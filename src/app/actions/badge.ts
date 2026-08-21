'use server';

import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';

export interface UserBadgeDetails {
  id: string;
  badgeSlug: string;
  subject?: string;
  questMode?: string;
  accuracy?: number;
  confidenceLevel?: string;
  xpEarned?: number;
  unlockedAt?: string;
  title: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  spriteUrl?: string | null;
  color: string;
  unlockCondition: string;
  xpReward: number;
}

/**
 * Fetches all earned badges for the authenticated user from UserBadge and joins with Badge master definitions
 */
export async function getUserBadgesAction(): Promise<{ success: boolean; data: UserBadgeDetails[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return { success: false, data: [], error: 'Not authenticated' };

    const client = await clientPromise;
    const db = client.db();

    let userObjId: ObjectId | null = null;
    try {
      userObjId = new ObjectId(userId);
    } catch (e) {}

    const query = userObjId ? { $or: [{ userId }, { userId: userObjId }] } : { userId };

    // Fetch user unlocked badges from MongoDB UserBadge collection
    const userBadges = await db.collection('UserBadge').find(query).toArray();

    // Fetch all master badge definitions from MongoDB Badge collection
    const masterBadges = await db.collection('Badge').find({ isActive: true }).toArray();

    const masterBadgeMap = new Map<string, any>();
    masterBadges.forEach(b => {
      if (b.badgeId) masterBadgeMap.set(b.badgeId, b);
      if (b._id) masterBadgeMap.set(b._id.toString(), b);
    });

    const result: UserBadgeDetails[] = userBadges.map(ub => {
      const badgeDef = masterBadgeMap.get(ub.badgeSlug) || masterBadgeMap.get(ub.badgeId?.toString()) || {};

      return {
        id: ub._id.toString(),
        badgeSlug: ub.badgeSlug || badgeDef.badgeId || 'gold',
        subject: ub.subject || undefined,
        questMode: ub.questMode || undefined,
        accuracy: ub.accuracy || 0,
        confidenceLevel: ub.confidenceLevel || undefined,
        xpEarned: ub.xpEarned || badgeDef.xpReward || 0,
        unlockedAt: ub.unlockedAt ? new Date(ub.unlockedAt).toISOString() : new Date().toISOString(),
        title: badgeDef.title || ub.badgeSlug || 'Master',
        name: badgeDef.name || 'Quest Badge',
        description: badgeDef.description || badgeDef.unlockCondition || 'Earned in Quest Arena',
        category: badgeDef.category || 'QUEST',
        icon: badgeDef.icon || 'trophy',
        spriteUrl: badgeDef.spriteUrl || null,
        color: badgeDef.color || '#FFD700',
        unlockCondition: badgeDef.unlockCondition || 'Completed in Quest Arena',
        xpReward: badgeDef.xpReward || 50,
      };
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to fetch user badges from MongoDB:', error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Fetches all master Badge catalog definitions created by Admin
 */
export async function getAllMasterBadgesAction(): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    const client = await clientPromise;
    const db = client.db();

    const badges = await db.collection('Badge').find({ isActive: true }).toArray();

    const formatted = badges.map(b => ({
      id: b._id.toString(),
      badgeId: b.badgeId,
      title: b.title,
      name: b.name,
      description: b.description,
      category: b.category || 'QUEST',
      icon: b.icon || 'trophy',
      spriteUrl: b.spriteUrl || null,
      color: b.color || '#FFD700',
      unlockCondition: b.unlockCondition || 'Earned through study milestones',
      xpReward: b.xpReward || 50,
    }));

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error('Failed to fetch master badges from MongoDB:', error);
    return { success: false, data: [], error: error.message };
  }
}
