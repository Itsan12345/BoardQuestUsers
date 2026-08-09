
'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { startOfWeek } from 'date-fns';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb-client';

export async function getUserStats(): Promise<any> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mastery: true,
        achievements: {
          orderBy: { timestamp: 'desc' },
          take: 5
        },
        _count: {
          select: { lessonCompletions: true }
        }
      }
    });
    
    if (!user) return null;

    const curriculumCount = await prisma.lessonCompletion.count({
      where: {
        userId,
        status: 'completed',
        NOT: {
          lessonId: { contains: '_' }
        }
      }
    });

    const today = startOfWeek(new Date());
    const todayExamResults = await prisma.examResult.findMany({
      where: {
        userId,
        timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      },
      select: { total: true }
    });
    const todayQuestions = todayExamResults.reduce((acc, curr) => acc + (curr.total || 0), 0);

    const parsedUser = JSON.parse(JSON.stringify(user));
    if (parsedUser._count) {
      parsedUser._count.lessonCompletions = curriculumCount;
    }
    parsedUser.todayQuestions = todayQuestions;
    return parsedUser;
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return null;
  }
}

export async function getUserProfile() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return null;

    // Fetch current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    });

    if (!user) return null;

    // Calculate global ranking
    const totalUsers = await prisma.user.count();
    const usersWithHigherXp = await prisma.user.count({
      where: { xp: { gt: user.xp } }
    });

    const userRank = usersWithHigherXp + 1;
    const rankingPercentage = Math.round(((totalUsers - usersWithHigherXp) / totalUsers) * 100);

    // Calculate today's completed questions
    const todayExamResults = await prisma.examResult.findMany({
      where: {
        userId,
        timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      },
      select: { total: true }
    });
    const todayQuestions = todayExamResults.reduce((acc, curr) => acc + (curr.total || 0), 0);

    // Calculate class year from createdAt (year - 1)
    const classYear = new Date(user.createdAt).getFullYear() - 1;
    const classString = `MedTech Class of ${classYear}`;

    const result = {
      ...user,
      todayQuestions,
      classString,
      userRank,
      rankingPercentage
    };

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

export async function getLeaderboard() {
  try {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Week starts on Monday

    // Fetch all users to calculate rank
    const weeklyXp = await prisma.achievement.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: weekStart
        }
      },
      _sum: {
        xp: true
      },
      orderBy: {
        _sum: {
          xp: 'desc'
        }
      }
    });

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    // Fetch user details for all users in weeklyXp to correctly calculate rank
    const userIds = weeklyXp.map(item => item.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        level: true
      }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Filter out achievements for users that no longer exist
    const validWeeklyXp = weeklyXp.filter(item => userMap.has(item.userId));

    let currentUserRank = null;
    if (userId) {
      const userIndex = validWeeklyXp.findIndex(item => item.userId === userId);
      if (userIndex !== -1) {
        currentUserRank = userIndex + 1;
      }
    }

    const top5WeeklyXp = validWeeklyXp.slice(0, 5);

    const leaderboard = top5WeeklyXp.map(item => {
      const user = userMap.get(item.userId)!;
      return {
        id: item.userId,
        name: user.name,
        level: user.level,
        xp: item._sum.xp || 0
      };
    });

    return { topUsers: leaderboard, currentUserRank };
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return { topUsers: [], currentUserRank: null };
  }
}

export async function getGlobalLeaderboard(page: number = 1, limit: number = 10) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    const skip = (page - 1) * limit;

    const [topUsers, totalUsers] = await Promise.all([
      prisma.user.findMany({
        orderBy: { xp: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          level: true,
          xp: true
        }
      }),
      prisma.user.count()
    ]);

    let currentUserRank = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true }
      });
      if (user) {
        const usersWithHigherXp = await prisma.user.count({
          where: { xp: { gt: user.xp } }
        });
        currentUserRank = usersWithHigherXp + 1;
      }
    }

    return { topUsers, currentUserRank, totalUsers };
  } catch (error) {
    console.error('Failed to fetch global leaderboard:', error);
    return { topUsers: [], currentUserRank: null, totalUsers: 0 };
  }
}

export async function generateDailyMissions() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return [];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mastery: true,
        studyPlans: {
          orderBy: { targetDate: 'asc' }
        }
      }
    });

    if (!user || !user.studyPlans.length) return [];

    const today = new Date();
    const missions: any[] = [];

    // Sort plans by urgency (closest deadline first)
    const sortedPlans = user.studyPlans.sort((a, b) =>
      new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    );

    for (const plan of sortedPlans) {
      const daysRemaining = Math.ceil(
        (new Date(plan.targetDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Skip past deadlines
      if (daysRemaining < 0) continue;

      const subjectMastery = user.mastery.find(m => m.subject === plan.subject);
      const currentProficiency = subjectMastery?.proficiency || 0;

      // Determine mission based on urgency and proficiency
      let title = '';
      let priority = 0;

      if (daysRemaining <= 3) {
        // Urgent: final review
        title = `Final review: ${plan.subject} (Due in ${daysRemaining} days)`;
        priority = 1;
      } else if (daysRemaining <= 7) {
        // Near deadline: intensive study
        title = `Master ${plan.subject.split(' ')[0]} concepts (${daysRemaining} days left)`;
        priority = 2;
      } else if (currentProficiency < 50) {
        // Low proficiency: catch up
        title = `Strengthen ${plan.subject} foundation`;
        priority = 3;
      } else {
        // On track: consistent progress
        title = `Progress ${plan.subject} (${daysRemaining} days on schedule)`;
        priority = 4;
      }

      missions.push({
        id: `${plan.subject}-${daysRemaining}`,
        title,
        subject: plan.subject,
        daysRemaining,
        proficiency: currentProficiency,
        priority,
        xp: daysRemaining <= 3 ? 150 : daysRemaining <= 7 ? 100 : daysRemaining <= 14 ? 75 : 50,
        targetDate: plan.targetDate
      });

      // Limit to 3 most urgent missions
      if (missions.length >= 3) break;
    }

    // Add streak maintenance mission if user has active streak
    if (user.streak > 0) {
      missions.unshift({
        id: 'streak-maintenance',
        title: `Maintain ${user.streak}-day streak`,
        subject: 'Consistency',
        daysRemaining: 1,
        proficiency: 100,
        priority: 0,
        xp: 100,
        isStreakMission: true
      });
    }

    return missions.slice(0, 3); // Return top 3 missions
  } catch (error) {
    console.error('Failed to generate daily missions:', error);
    return [];
  }
}

export async function saveUserInventory(inventory: Record<string, number>, equippedItem: string | null) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, error: 'Not authenticated' };

    await prisma.user.update({
      where: { id: userId },
      data: {
        inventory: JSON.stringify(inventory),
        equippedItem: equippedItem || 'none'
      } as any
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save user inventory to DB:', error);
    return { success: false, error: 'Failed to update inventory' };
  }
}

export async function purchaseReagentAction(itemId: string, cost: number, newInventory: Record<string, number>) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true }
    });

    if (!user) return { success: false, error: 'User not found' };
    if (user.xp < cost) return { success: false, error: 'Insufficient XP' };

    const newXp = user.xp - cost;

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        inventory: JSON.stringify(newInventory)
      } as any
    });

    revalidatePath('/quest');
    revalidatePath('/profile');

    return { success: true, newXp };
  } catch (error) {
    console.error('Failed to process reagent purchase on server:', error);
    return { success: false, error: 'Purchase failed' };
  }
}

export async function updateUserProfileDetails(data: {
  name: string;
  location?: string;
}) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, error: 'Not authenticated' };

    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Name cannot be empty' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name.trim(),
        location: data.location?.trim() || 'Philippines',
      }
    });

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
  } catch (error) {
    console.error('Failed to update user profile details:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function changeUserPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, error: 'Not authenticated' };

    if (!data.newPassword || data.newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return { success: false, error: 'User not found' };

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      return { success: false, error: 'Incorrect current password' };
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword
      }
    });

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Failed to change user password:', error);
    return { success: false, error: 'Failed to update password' };
  }
}

export async function exportUserStudyData() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mastery: true,
        achievements: true,
        examResults: true,
        lessonCompletions: true,
      }
    });

    if (!user) return { success: false, error: 'User not found' };

    const exportData = {
      aspirantName: user.name,
      email: user.email,
      level: user.level,
      totalXp: user.xp,
      streakDays: user.streak,
      location: user.location,
      exportedAt: new Date().toISOString(),
      subjectMasteries: user.mastery.map(m => ({
        subject: m.subject,
        proficiency: `${m.proficiency}%`,
        status: m.status
      })),
      completedLessonsCount: user.lessonCompletions.length,
      achievementsCount: user.achievements.length,
      achievements: user.achievements.map(a => ({
        task: a.task,
        xp: a.xp,
        badge: a.badge,
        earnedDate: a.timestamp
      })),
      mockExamResults: user.examResults.map(e => ({
        subject: e.subject,
        score: e.score,
        total: e.total,
        percentage: `${Math.round((e.score / (e.total || 1)) * 100)}%`,
        date: e.timestamp
      }))
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error('Failed to export study data:', error);
    return { success: false, error: 'Failed to generate study export' };
  }
}

export async function getUserSettingsAction() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return null;

    const client = await clientPromise;
    const db = client.db();
    const settings = await db.collection('UserSettings').findOne({ userId });
    return settings ? JSON.parse(JSON.stringify(settings)) : null;
  } catch (error) {
    console.error('Failed to get user settings from MongoDB:', error);
    return null;
  }
}

export async function saveUserSettingsAction(settingsData: any) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const client = await clientPromise;
    const db = client.db();
    await db.collection('UserSettings').updateOne(
      { userId },
      {
        $set: {
          ...settingsData,
          userId,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    revalidatePath('/profile');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to save user settings to MongoDB:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

