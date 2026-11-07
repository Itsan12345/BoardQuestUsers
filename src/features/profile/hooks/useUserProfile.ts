"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { fetchProfileData } from '../api';
import { getLevelProgress, getRankTitle } from '@/lib/badge-system';
import { calculatePlayerStats } from '@/lib/game-logic';
import { BADGE_SPRITE_DEFINITIONS, ALL_BADGE_TYPES } from '../utils';
import type {
  UserProfile,
  UserBadgeDetails,
  GuidanceAssignmentRecord,
} from '../types';

export function useUserProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dbUserBadges, setDbUserBadges] = useState<UserBadgeDetails[]>([]);
  const [masterBadges, setMasterBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAllBadgesOpen, setViewAllBadgesOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [initialSettingsTab, setInitialSettingsTab] = useState<string>('profile');
  const [autoOpenCalendar, setAutoOpenCalendar] = useState<boolean>(false);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [guidanceList, setGuidanceList] = useState<GuidanceAssignmentRecord[]>([]);
  const [selectedGuidance, setSelectedGuidance] = useState<GuidanceAssignmentRecord | null>(null);
  const [guidanceDialogOpen, setGuidanceDialogOpen] = useState(false);

  useEffect(() => {
    const openParam = searchParams.get('openSettings');
    const tabParam = searchParams.get('tab');
    const focusParam = searchParams.get('focus');
    const calendarParam = searchParams.get('openCalendar');

    if (openParam === 'true' || tabParam || focusParam || calendarParam) {
      setAccountSettingsOpen(true);
      if (tabParam) {
        setInitialSettingsTab(tabParam);
      }
      if (focusParam === 'targetExam' || calendarParam === 'true') {
        setAutoOpenCalendar(true);
      }
    }
  }, [searchParams]);

  const loadProfile = useCallback(async () => {
    try {
      const {
        profile,
        guidanceList: fetchedGuidance,
        dbUserBadges: fetchedUserBadges,
        masterBadges: fetchedMasterBadges,
        dailyStatus,
      } = await fetchProfileData();

      if (!profile) {
        router.replace('/login');
        return;
      }

      if (dailyStatus && typeof dailyStatus.currentStreak === 'number') {
        profile.streak = Math.max(profile.streak ?? 0, dailyStatus.currentStreak);
        profile.loginStreak = dailyStatus.currentStreak;
      }

      setUserProfile(profile);
      setDbUserBadges(fetchedUserBadges);
      setMasterBadges(fetchedMasterBadges);
      setGuidanceList(fetchedGuidance);
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load profile data.',
      });
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    loadProfile();

    const handleSync = () => {
      loadProfile();
    };

    window.addEventListener('bq_profile_updated', handleSync);
    window.addEventListener('bq_avatar_updated', handleSync);

    return () => {
      window.removeEventListener('bq_profile_updated', handleSync);
      window.removeEventListener('bq_avatar_updated', handleSync);
    };
  }, [loadProfile]);

  const levelInfo = useMemo(() => {
    return userProfile ? getLevelProgress(userProfile.xp) : { currentLevelXP: 0, nextLevelXP: 100, progressPercent: 0 };
  }, [userProfile]);

  const rankTitle = useMemo(() => {
    return userProfile ? getRankTitle(userProfile.level) : 'Apprentice Technician';
  }, [userProfile]);

  const stats = useMemo(() => {
    return userProfile ? calculatePlayerStats(userProfile.level) : null;
  }, [userProfile]);

  const equippedBadgeSprite = useMemo(() => {
    if (!userProfile?.equippedItem) return null;
    const def = BADGE_SPRITE_DEFINITIONS[userProfile.equippedItem];
    return def ? def.sprite : '/ui/gold-badge.png';
  }, [userProfile?.equippedItem]);

  // Merge master and fallback badge catalog
  const allMergedBadges = useMemo(() => {
    if (masterBadges && masterBadges.length > 0) {
      return masterBadges.map((mb) => {
        const spriteDef = BADGE_SPRITE_DEFINITIONS[mb.badgeCode] || BADGE_SPRITE_DEFINITIONS[mb.tier?.toLowerCase()] || BADGE_SPRITE_DEFINITIONS.gold;
        return {
          id: mb.badgeCode,
          title: mb.title,
          sprite: mb.iconUrl || spriteDef.sprite,
          bgGradient: spriteDef.bgGradient,
          borderColor: spriteDef.borderColor,
          unlockCondition: mb.requirement,
          description: mb.description,
          xpReward: mb.xpReward,
          category: mb.category,
        };
      });
    }
    return ALL_BADGE_TYPES;
  }, [masterBadges]);

  const earnedBadgeCodes = useMemo(() => {
    const codes = new Set<string>();
    if (dbUserBadges && dbUserBadges.length > 0) {
      dbUserBadges.forEach((b) => {
        if (b.badgeCode) codes.add(b.badgeCode.toLowerCase());
      });
    }
    if (userProfile?.achievements) {
      userProfile.achievements.forEach((a) => {
        if (a.badge) codes.add(a.badge.toLowerCase());
      });
    }
    return codes;
  }, [dbUserBadges, userProfile?.achievements]);

  const displayBadges = useMemo(() => {
    return allMergedBadges.slice(0, 6);
  }, [allMergedBadges]);

  const filteredBadges = useMemo(() => {
    return allMergedBadges.filter((badge) => {
      const isEarned = earnedBadgeCodes.has(badge.id.toLowerCase());
      if (badgeFilter === 'earned') return isEarned;
      if (badgeFilter === 'locked') return !isEarned;
      return true;
    });
  }, [allMergedBadges, earnedBadgeCodes, badgeFilter]);

  return {
    userProfile,
    setUserProfile,
    loading,
    accountSettingsOpen,
    setAccountSettingsOpen,
    initialSettingsTab,
    autoOpenCalendar,
    viewAllBadgesOpen,
    setViewAllBadgesOpen,
    badgeFilter,
    setBadgeFilter,
    guidanceList,
    setGuidanceList,
    dbUserBadges,
    selectedGuidance,
    setSelectedGuidance,
    guidanceDialogOpen,
    setGuidanceDialogOpen,
    levelInfo,
    rankTitle,
    stats,
    equippedBadgeSprite,
    allMergedBadges,
    earnedBadgeCodes,
    displayBadges,
    filteredBadges,
  };
}
