'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  calculateEarnedBadges,
  calculateTotalXp,
  getLevelFromXp,
  type ConfidenceLevel,
  type Badge,
  type BadgeId,
} from '@/lib/badge-system';
import { syncSubjectMastery } from '@/app/actions/study';
import { differenceInCalendarDays } from 'date-fns';
import clientPromise from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';

export interface CompleteQuestParams {
  score: number;
  totalQuestions: number;
  confidenceLevel: ConfidenceLevel;
  completionTime: number; // in seconds
  questMode: 'learning' | 'test' | 'boss-battle';
  subject: string;
  userAnswers?: { questionId: string; isCorrect: boolean; difficulty?: string }[];
}

export interface CompleteQuestResponse {
  success: boolean;
  earnedBadges: Badge[];
  totalXp: number;
  newLevel: number;
  message: string;
  error?: string;
}

export async function completeQuest(params: CompleteQuestParams): Promise<CompleteQuestResponse> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return {
        success: false,
        earnedBadges: [],
        totalXp: 0,
        newLevel: 1,
        message: '',
        error: 'Not authenticated. Please log in.',
      };
    }

    // Fetch current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, streak: true },
    });

    if (!user) {
      return {
        success: false,
        earnedBadges: [],
        totalXp: 0,
        newLevel: 1,
        message: '',
        error: 'User not found.',
      };
    }

    // Calculate streak dynamically before creating the new achievement
    const [lastAchievement, lastExam] = await Promise.all([
      prisma.achievement.findFirst({
        where: { userId, type: 'quest' },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true }
      }),
      prisma.examResult.findFirst({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true }
      })
    ]);

    const lastTime = lastAchievement?.timestamp && lastExam?.timestamp
      ? (new Date(lastAchievement.timestamp).getTime() > new Date(lastExam.timestamp).getTime() ? lastAchievement.timestamp : lastExam.timestamp)
      : (lastAchievement?.timestamp || lastExam?.timestamp);

    let newStreak = 1;
    const now = new Date();
    
    if (lastTime) {
      const diff = differenceInCalendarDays(now, new Date(lastTime));
      if (diff === 0) {
        // Already completed a quest/exam today: maintain current streak (at least 1)
        newStreak = Math.max(1, user.streak || 0);
      } else if (diff === 1) {
        // Consecutive day: increment streak
        newStreak = (user.streak || 0) + 1;
      } else {
        // Missed yesterday / more than 1 day passed: streak broken, starts fresh at 1
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Calculate actual total and accuracy. In boss-battle, totalQuestions is artificially high (e.g., 999), 
    // so we use the number of questions actually answered.
    const actualTotal = params.questMode === 'boss-battle' 
      ? (params.userAnswers?.length || params.score) 
      : params.totalQuestions;
    
    const accuracy = actualTotal > 0 ? (params.score / actualTotal) * 100 : 0;

    // Calculate earned badges using the CURRENT streak
    const earnedBadges = calculateEarnedBadges({
      score: params.score,
      totalQuestions: params.totalQuestions,
      confidenceLevel: params.confidenceLevel,
      completionTime: params.completionTime,
      streak: newStreak,
    });

    // Calculate base XP based on difficulty
    let baseXp = 0;
    if (params.userAnswers && params.userAnswers.length > 0) {
      params.userAnswers.forEach((ua) => {
        if (ua.isCorrect) {
          const diff = (ua.difficulty || 'MEDIUM').toUpperCase();
          if (diff === 'HARD') baseXp += 100;
          else if (diff === 'EASY') baseXp += 25;
          else baseXp += 50;
        }
      });
    } else {
      baseXp = params.score * 50;
    }

    // Calculate total XP earned with streak multiplier
    const totalXpEarned = calculateTotalXp(baseXp, earnedBadges, params.confidenceLevel, newStreak);

    // Calculate new user stats
    const newTotalXp = user.xp + totalXpEarned;
    const newLevel = getLevelFromXp(newTotalXp);

    // Update user XP, level, and streak
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newTotalXp,
        level: newLevel,
        streak: newStreak,
      },
    });

    // Save ExamResult
    await prisma.examResult.create({
      data: {
        userId,
        score: params.score,
        total: actualTotal,
        accuracy,
        subject: params.subject,
      },
    });

    // ALWAYS create a primary achievement record for completing the quest with the total XP
    await prisma.achievement.create({
      data: {
        userId,
        task: `Completed quest: ${params.subject} (${Math.round(accuracy)}% accuracy)`,
        type: 'quest',
        xp: totalXpEarned,
        confidenceLevel: params.confidenceLevel,
        accuracy,
        questMode: params.questMode,
        subject: params.subject,
      } as any,
    });

    // Create Achievement records & upsert UserBadge documents for each earned badge
    if (earnedBadges.length > 0) {
      try {
        const client = await clientPromise;
        const db = client.db();

        let userObjId: ObjectId | null = null;
        try {
          userObjId = new ObjectId(userId);
        } catch (e) {}

        await Promise.all(
          earnedBadges.map(async (badge) => {
            // 1. Save Achievement log
            await prisma.achievement.create({
              data: {
                userId,
                task: `Earned ${badge.name}: ${badge.description}`,
                type: 'quest',
                xp: 0,
                badge: badge.id as string,
                confidenceLevel: params.confidenceLevel,
                accuracy,
                questMode: params.questMode,
                subject: params.subject,
              } as any,
            });

            // 2. Find master Badge document created by Admin
            const badgeDoc = await db.collection('Badge').findOne({ badgeId: badge.id });
            const badgeObjId = badgeDoc?._id || null;

            // 3. Upsert into UserBadge collection
            const filterQuery = userObjId
              ? { userId: userObjId, badgeSlug: badge.id }
              : { userId, badgeSlug: badge.id };

            await db.collection('UserBadge').updateOne(
              filterQuery,
              {
                $set: {
                  userId: userObjId || userId,
                  badgeId: badgeObjId,
                  badgeSlug: badge.id,
                  subject: params.subject || null,
                  questMode: params.questMode,
                  accuracy,
                  confidenceLevel: params.confidenceLevel,
                  xpEarned: badge.xpReward || 50,
                  unlockedAt: new Date(),
                }
              },
              { upsert: true }
            );
          })
        );
      } catch (badgeErr) {
        console.error('Failed to sync UserBadge collection:', badgeErr);
      }
    }

    // Sync Subject Mastery
    await syncSubjectMastery(userId, params.subject);

    // Record individual question attempts for Spaced Repetition logic
    if (params.userAnswers && params.userAnswers.length > 0) {
      await Promise.all(
        params.userAnswers.map((ua) => {
          if (!ua.questionId) return Promise.resolve();
          // Extract base MongoDB ObjectId and strip any looping cycle suffixes like "_cycle_7"
          const rawId = ua.questionId.split('_cycle_')[0].trim();
          // Ensure rawId is a valid 24-char hex string
          if (!/^[0-9a-fA-F]{24}$/.test(rawId)) {
            return Promise.resolve();
          }

          return (prisma as any).userQuestionAttempt.upsert({
            where: {
              userId_questionId: { userId, questionId: rawId },
            },
            update: {
              attempts: { increment: 1 },
              correct: { increment: ua.isCorrect ? 1 : 0 },
              lastAttempt: new Date(),
            },
            create: {
              userId,
              questionId: rawId,
              attempts: 1,
              correct: ua.isCorrect ? 1 : 0,
            },
          }).catch((err: any) => console.warn('Question attempt record skipped:', err));
        })
      );
    }

    // Revalidate related pages
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/quest');

    // Determine message
    let message = '';
    if (params.questMode === 'boss-battle') {
      message = `🎉 Glorious Victory! You conquered the chapter and defeated the boss in ${params.subject}!`;
    } else if (earnedBadges.length === 0) {
      message = `Great effort! You scored ${params.score}/${params.totalQuestions} and earned ${totalXpEarned} XP.`;
    } else if (earnedBadges.length === 1) {
      message = `Excellent! You earned the ${earnedBadges[0].name} and gained ${totalXpEarned} XP!`;
    } else {
      const badgeNames = earnedBadges.map((b) => b.name).join(', ');
      message = `Amazing! You earned ${earnedBadges.length} badges (${badgeNames}) and gained ${totalXpEarned} XP!`;
    }

    return {
      success: true,
      earnedBadges,
      totalXp: totalXpEarned,
      newLevel,
      message,
    };
  } catch (error) {
    console.error('Error completing quest:', error);
    return {
      success: false,
      earnedBadges: [],
      totalXp: 0,
      newLevel: 1,
      message: '',
      error: 'Failed to complete quest. Please try again.',
    };
  }
}

export interface NodeClearsResult {
  nodeStars: Record<string, number>;
  nodeClears: Record<string, { EASY?: boolean; MEDIUM?: boolean; HARD?: boolean }>;
}

export async function saveNodeClearAction(nodeId: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD', subject: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return;

    const diffUpper = difficulty.toUpperCase();

    if ((prisma as any).questNodeCompletion) {
      await (prisma as any).questNodeCompletion.upsert({
        where: {
          userId_nodeId_difficulty: {
            userId,
            nodeId,
            difficulty: diffUpper,
          },
        },
        update: {
          status: 'completed',
          subject,
        },
        create: {
          userId,
          nodeId,
          difficulty: diffUpper,
          subject,
          status: 'completed',
        },
      });
    } else {
      // Direct MongoDB raw command fallback (works instantly without requiring dev server restart)
      await (prisma as any).$runCommandRaw({
        update: "QuestNodeCompletion",
        updates: [
          {
            q: { userId: { $oid: userId }, nodeId, difficulty: diffUpper },
            u: {
              $set: {
                userId: { $oid: userId },
                nodeId,
                difficulty: diffUpper,
                subject,
                status: "completed",
                updatedAt: { $date: new Date().toISOString() }
              },
              $setOnInsert: {
                createdAt: { $date: new Date().toISOString() }
              }
            },
            upsert: true,
          }
        ]
      });
    }
  } catch (error) {
    console.error('Failed to save quest node clear:', error);
  }
}

export async function getNodeClearsAction(): Promise<NodeClearsResult> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { nodeStars: {}, nodeClears: {} };

    let completions: any[] = [];

    if ((prisma as any).questNodeCompletion) {
      completions = await (prisma as any).questNodeCompletion.findMany({
        where: { userId, status: 'completed' },
        select: { nodeId: true, difficulty: true }
      });
    } else {
      const rawRes: any = await (prisma as any).$runCommandRaw({
        find: "QuestNodeCompletion",
        filter: { userId: { $oid: userId }, status: "completed" },
        projection: { nodeId: 1, difficulty: 1, _id: 0 }
      });
      if (rawRes?.cursor?.firstBatch) {
        completions = rawRes.cursor.firstBatch;
      }
    }

    const nodeStarsMap: Record<string, number> = {};
    const nodeClearsMap: Record<string, { EASY?: boolean; MEDIUM?: boolean; HARD?: boolean }> = {};

    completions.forEach((comp) => {
      const nodeId = comp.nodeId;
      const diff = (comp.difficulty || '').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      if (!nodeId || !diff) return;

      if (!nodeClearsMap[nodeId]) nodeClearsMap[nodeId] = {};
      nodeClearsMap[nodeId][diff] = true;
    });

    Object.keys(nodeClearsMap).forEach((nodeId) => {
      const clears = nodeClearsMap[nodeId];
      const count = (clears.EASY ? 1 : 0) + (clears.MEDIUM ? 1 : 0) + (clears.HARD ? 1 : 0);
      nodeStarsMap[nodeId] = count;
    });

    return { nodeStars: nodeStarsMap, nodeClears: nodeClearsMap };
  } catch (error) {
    console.error('Failed to fetch quest node clears:', error);
    return { nodeStars: {}, nodeClears: {} };
  }
}

export async function getNodeStarsAction(): Promise<Record<string, number>> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return {};

    const examResults = await prisma.examResult.findMany({
      where: { userId },
      select: { accuracy: true, subject: true }
    });

    const nodeStarsMap: Record<string, number> = {};

    examResults.forEach((res) => {
      if (!res.subject) return;
      const acc = res.accuracy || 0;
      let stars = 0;
      if (acc >= 90) stars = 3;
      else if (acc >= 75) stars = 2;
      else if (acc >= 60) stars = 1;

      if (stars > 0) {
        const cleanSub = res.subject.toLowerCase().replace(/[^a-z0-9]/g, '');
        const prefix = cleanSub.includes('chem') ? 'cc'
          : cleanSub.includes('hema') && !cleanSub.includes('immuno') ? 'hem'
          : cleanSub.includes('microb') ? 'mb' : cleanSub;
        const nodeId = `${prefix}-1`;
        if (stars > (nodeStarsMap[nodeId] || 0)) {
          nodeStarsMap[nodeId] = stars;
        }
      }
    });

    return nodeStarsMap;
  } catch (error) {
    console.error('Failed to fetch node stars:', error);
    return {};
  }
}
