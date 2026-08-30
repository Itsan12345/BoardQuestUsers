'use server';

import { cookies, headers } from 'next/headers';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb-client';
import { prisma } from '@/lib/prisma';
import {
  DAILY_LOGIN_REWARDS,
  getLocalTodayDateString,
  calculateCycleDay,
  type DailyLoginStatusData,
  type DailyRewardTier,
} from '@/lib/daily-login-config';
import { differenceInCalendarDays, parseISO, startOfDay, addDays } from 'date-fns';

/**
 * Builds a query matching the student and date in DailyLogin
 */
function buildDailyLoginQuery(userId: string, userEmail?: string, dateStr?: string) {
  const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
  const todayDate = dateStr || getLocalTodayDateString(new Date());

  const userConditions: any[] = [
    { userId: userId },
    { studentId: userId },
  ];

  if (userObjId) {
    userConditions.push({ userId: userObjId });
    userConditions.push({ studentId: userObjId });
  }

  return {
    $and: [
      { $or: userConditions },
      { $or: [{ dateKey: todayDate }, { date: todayDate }] },
    ],
  };
}

/**
 * Automatically records the student's daily login into MongoDB
 * using clean, minimal, non-duplicate fields.
 */
export async function recordDailyLoginAction(deviceInfo?: string): Promise<{
  success: boolean;
  isLoggedIn: boolean;
  status?: DailyLoginStatusData;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, isLoggedIn: false, error: 'Not authenticated' };
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Fetch user record
    const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    const userQuery: any = userObjId
      ? { $or: [{ _id: userObjId }, { _id: userId }] }
      : { _id: userId };

    const user = await db.collection('User').findOne(userQuery);
    if (!user) {
      return { success: false, isLoggedIn: false, error: 'User not found' };
    }

    const todayDate = getLocalTodayDateString(new Date());

    // 2. Check if already logged in today
    const loginQuery = buildDailyLoginQuery(userId, user.email, todayDate);
    const existingTodayLogin = await db.collection('DailyLogin').findOne(loginQuery);

    let currentStreak = user.loginStreak ?? user.consecutiveStreak ?? user.streak ?? 0;
    const lastLoginDate = user.lastLoginDate;
    let totalLogins = user.totalLoginDays ?? 0;
    let highestStreak = user.highestLoginStreak ?? currentStreak;

    if (!existingTodayLogin) {
      // Calculate streak continuation
      if (!lastLoginDate) {
        currentStreak = 1;
        totalLogins = 1;
      } else {
        try {
          const daysDiff = differenceInCalendarDays(
            startOfDay(new Date()),
            startOfDay(parseISO(lastLoginDate))
          );

          if (daysDiff === 1) {
            currentStreak += 1;
            totalLogins += 1;
          } else if (daysDiff === 0) {
            currentStreak = Math.max(1, currentStreak);
          } else {
            currentStreak = 1;
            totalLogins += 1;
          }
        } catch (e) {
          currentStreak = 1;
          totalLogins += 1;
        }
      }

      highestStreak = Math.max(highestStreak, currentStreak);

      // Create new clean DailyLogin document with ONLY essential fields
      await db.collection('DailyLogin').insertOne({
        userId: userObjId || userId,
        studentName: user.name,
        studentEmail: user.email,
        dateKey: todayDate,
        consecutiveStreak: currentStreak,
        claimedReward: false,
        rewardXp: 0,
        loginCountToday: 1,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update User streak and login metrics
      await db.collection('User').updateOne(
        userQuery,
        {
          $set: {
            loginStreak: currentStreak,
            lastLoginDate: todayDate,
            lastLoginAt: new Date(),
            totalLoginDays: totalLogins,
            highestLoginStreak: highestStreak,
          },
        }
      );
    } else {
      // Increment login count & clean up legacy duplicate fields
      currentStreak = existingTodayLogin.consecutiveStreak || existingTodayLogin.loginStreak || currentStreak;

      await db.collection('DailyLogin').updateMany(
        loginQuery,
        {
          $set: {
            studentName: user.name,
            studentEmail: user.email,
            dateKey: todayDate,
            consecutiveStreak: currentStreak,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          },
          $inc: {
            loginCountToday: 1,
          },
          $unset: {
            studentId: '',
            userName: '',
            userEmail: '',
            date: '',
            timestamp: '',
            firstLoginAt: '',
            loginStreak: '',
            rewardClaimed: '',
            loginMethod: '',
            deviceInfo: '',
            status: '',
            flaggedByAdmin: '',
            flagReason: '',
            cycleDay: '',
            claimedAt: '',
          },
        }
      );
    }

    // 3. Return full DailyLoginStatusData
    const statusData = await getDailyLoginStatusAction();
    return {
      success: true,
      isLoggedIn: true,
      status: statusData,
    };
  } catch (error) {
    console.error('Error in recordDailyLoginAction:', error);
    return { success: false, isLoggedIn: false, error: 'Failed to record daily login' };
  }
}

/**
 * Claims today's daily streak reward (XP & consistency badges for 7/14/30 days)
 * Updates claimedReward: true and cleans up redundant legacy fields.
 */
export async function claimDailyLoginRewardAction(): Promise<{
  success: boolean;
  reward?: DailyRewardTier;
  currentStreak?: number;
  newXp?: number;
  newLevel?: number;
  earnedBadge?: string;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, error: 'Authentication required to claim reward.' };
    }

    const client = await clientPromise;
    const db = client.db();

    const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    const userQuery: any = userObjId
      ? { $or: [{ _id: userObjId }, { _id: userId }] }
      : { _id: userId };

    const todayDate = getLocalTodayDateString(new Date());

    // 1. Parallel fetch of user and today's login
    const [user, todayLoginRecord] = await Promise.all([
      db.collection('User').findOne(userQuery),
      db.collection('DailyLogin').findOne(buildDailyLoginQuery(userId, undefined, todayDate)),
    ]);

    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    let todayLogin = todayLoginRecord;
    const loginQuery = buildDailyLoginQuery(userId, user.email, todayDate);

    if (!todayLogin) {
      await recordDailyLoginAction();
      todayLogin = await db.collection('DailyLogin').findOne(loginQuery);
    }

    if (!todayLogin) {
      return { success: false, error: 'Unable to establish daily login session.' };
    }

    const alreadyClaimed = Boolean(todayLogin.claimedReward || todayLogin.rewardClaimed);
    if (alreadyClaimed) {
      return { success: false, error: 'Daily reward already claimed today! Check back tomorrow.' };
    }

    const currentStreak = todayLogin.consecutiveStreak || todayLogin.loginStreak || user.loginStreak || 1;
    const cycleDay = calculateCycleDay(currentStreak);
    const rewardTier = DAILY_LOGIN_REWARDS[cycleDay - 1] || DAILY_LOGIN_REWARDS[0];

    const currentXp = user.xp ?? 0;
    const updatedXp = currentXp + rewardTier.xp;
    const updatedLevel = Math.max(1, Math.floor(updatedXp / 1000) + 1);

    // Check if user has already earned consistency badges (7-Day, 14-Day, 30-Day)
    const existingStreakBadges = await prisma.achievement.findMany({
      where: {
        userId: userId,
        badge: { in: ['streak-7', 'streak-14', 'streak-30'] },
      },
      select: { badge: true },
    });
    const ownedBadges = new Set(existingStreakBadges.map((b) => b.badge));

    let awardedBadgeId: string | undefined = undefined;
    if (currentStreak >= 30 && !ownedBadges.has('streak-30')) {
      awardedBadgeId = 'streak-30';
    } else if (currentStreak >= 14 && !ownedBadges.has('streak-14')) {
      awardedBadgeId = 'streak-14';
    } else if (currentStreak >= 7 && !ownedBadges.has('streak-7')) {
      awardedBadgeId = 'streak-7';
    }

    // 2. Parallelized write operations to MongoDB and Prisma
    await Promise.all([
      // Update User collection (XP, level, loginStreak)
      db.collection('User').updateOne(
        userQuery,
        {
          $set: {
            xp: updatedXp,
            level: updatedLevel,
            loginStreak: currentStreak,
          },
        }
      ),
      // Update DailyLogin collection with clean fields and strip duplicate clutter
      db.collection('DailyLogin').updateMany(
        loginQuery,
        {
          $set: {
            studentName: user.name,
            studentEmail: user.email,
            dateKey: todayDate,
            claimedReward: true,
            rewardXp: rewardTier.xp,
            consecutiveStreak: currentStreak,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          },
          $unset: {
            studentId: '',
            userName: '',
            userEmail: '',
            date: '',
            timestamp: '',
            firstLoginAt: '',
            loginStreak: '',
            rewardClaimed: '',
            loginMethod: '',
            deviceInfo: '',
            status: '',
            flaggedByAdmin: '',
            flagReason: '',
            cycleDay: '',
            claimedAt: '',
          },
        }
      ),
      // Log Achievement for Daily Attendance (only attach consistency badge if milestone reached)
      prisma.achievement.create({
        data: {
          userId: userId,
          task: awardedBadgeId 
            ? `Daily Streak Milestone Reward: Day ${currentStreak} Streak` 
            : `Daily Check-In Reward: Day ${cycleDay} Streak`,
          type: 'quest',
          ...(awardedBadgeId ? { badge: awardedBadgeId } : {}),
          xp: rewardTier.xp,
          confidenceLevel: 'Unyielding',
          questMode: 'learning',
          subject: 'Daily Attendance',
        },
      }).catch((achErr) => {
        console.warn('Achievement log notice:', achErr);
      }),
    ]);

    return {
      success: true,
      reward: rewardTier,
      currentStreak: currentStreak,
      newXp: updatedXp,
      newLevel: updatedLevel,
      earnedBadge: awardedBadgeId,
    };
  } catch (error) {
    console.error('Error claiming daily login reward:', error);
    return { success: false, error: 'Failed to claim daily reward. Please try again.' };
  }
}

/**
 * Retrieves full student daily login status for dashboard and reward modal
 */
export async function getDailyLoginStatusAction(): Promise<DailyLoginStatusData> {
  const defaultToday = getLocalTodayDateString(new Date());
  const nextReset = addDays(startOfDay(new Date()), 1).toISOString();

  const fallbackData: DailyLoginStatusData = {
    success: false,
    isLoggedIn: false,
    todayDate: defaultToday,
    currentStreak: 0,
    highestStreak: 0,
    totalLogins: 0,
    hasLoggedInToday: false,
    hasClaimedToday: false,
    currentCycleDay: 1,
    todayReward: DAILY_LOGIN_REWARDS[0],
    cycleRewards: DAILY_LOGIN_REWARDS.map(r => ({
      ...r,
      status: r.day === 1 ? 'available' : 'locked',
      isToday: r.day === 1,
    })),
    nextResetIso: nextReset,
  };

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return fallbackData;
    }

    const client = await clientPromise;
    const db = client.db();

    const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    const userQuery: any = userObjId
      ? { $or: [{ _id: userObjId }, { _id: userId }] }
      : { _id: userId };

    const user = await db.collection('User').findOne(userQuery);
    if (!user) {
      return fallbackData;
    }

    const todayDate = getLocalTodayDateString(new Date());
    const loginQuery = buildDailyLoginQuery(userId, user.email, todayDate);
    const todayLogin = await db.collection('DailyLogin').findOne(loginQuery);

    const hasLoggedInToday = Boolean(todayLogin);
    const hasClaimedToday = Boolean(todayLogin?.claimedReward || todayLogin?.rewardClaimed);
    const currentStreak = Math.max(
      0,
      todayLogin?.consecutiveStreak ?? todayLogin?.loginStreak ?? user.loginStreak ?? user.streak ?? 0
    );
    const highestStreak = Math.max(currentStreak, user.highestLoginStreak ?? currentStreak);
    const totalLogins = user.totalLoginDays ?? (currentStreak > 0 ? currentStreak : 0);

    // Calculate current cycle day (1 to 7)
    const currentCycleDay = currentStreak > 0 ? calculateCycleDay(currentStreak) : 1;
    const todayReward = DAILY_LOGIN_REWARDS[currentCycleDay - 1] || DAILY_LOGIN_REWARDS[0];

    // Compute status for all 7 days of the cycle
    const cycleRewards = DAILY_LOGIN_REWARDS.map((reward) => {
      const isToday = reward.day === currentCycleDay;
      let status: 'claimed' | 'available' | 'locked' = 'locked';

      if (reward.day < currentCycleDay) {
        status = 'claimed';
      } else if (reward.day === currentCycleDay) {
        status = hasClaimedToday ? 'claimed' : 'available';
      } else {
        status = 'locked';
      }

      return {
        ...reward,
        status,
        isToday,
      };
    });

    return {
      success: true,
      isLoggedIn: true,
      todayDate,
      currentStreak,
      highestStreak,
      totalLogins,
      hasLoggedInToday,
      hasClaimedToday,
      currentCycleDay,
      todayReward,
      cycleRewards,
      lastLoginAt: todayLogin?.lastActiveAt || todayLogin?.createdAt
        ? new Date(todayLogin.lastActiveAt || todayLogin.createdAt).toISOString()
        : undefined,
      nextResetIso: nextReset,
    };
  } catch (error) {
    console.error('Error in getDailyLoginStatusAction:', error);
    return fallbackData;
  }
}

/**
 * Helper to clean up all legacy duplicate fields from the DailyLogin collection
 */
export async function cleanupDailyLoginCollectionFieldsAction(): Promise<{
  success: boolean;
  cleanedCount: number;
}> {
  try {
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('DailyLogin').updateMany(
      {},
      {
        $unset: {
          studentId: '',
          userName: '',
          userEmail: '',
          date: '',
          timestamp: '',
          firstLoginAt: '',
          loginStreak: '',
          rewardClaimed: '',
          loginMethod: '',
          deviceInfo: '',
          status: '',
          flaggedByAdmin: '',
          flagReason: '',
          cycleDay: '',
          claimedAt: '',
        },
      }
    );

    return { success: true, cleanedCount: result.modifiedCount };
  } catch (error) {
    console.error('Error cleaning DailyLogin collection fields:', error);
    return { success: false, cleanedCount: 0 };
  }
}
