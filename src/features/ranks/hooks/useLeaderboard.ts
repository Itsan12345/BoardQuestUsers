"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchLeaderboardData } from '../api';
import { getRankTitle } from '@/lib/badge-system';
import type { LeaderboardUser, RankTier } from '../types';

export function useLeaderboard(initialLimit: number = 10) {
  const [user, setUser] = useState<any>(null);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [rankTiers, setRankTiers] = useState<RankTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  const limit = initialLimit;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboardData(page, limit);
      setUser(data.user);
      setTopUsers(data.topUsers);
      setTotalUsers(data.totalUsers);
      setCurrentUserRank(data.currentUserRank);
      setRankTiers(data.rankTiers);
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    const tableElement = document.getElementById('tour-ranks-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const totalPages = useMemo(() => {
    return Math.ceil(totalUsers / limit) || 1;
  }, [totalUsers, limit]);

  const userRankTitle = useMemo(() => {
    return user ? getRankTitle(user.level || 1, rankTiers) : 'Apprentice Technician';
  }, [user, rankTiers]);

  return {
    user,
    topUsers,
    rankTiers,
    loading,
    page,
    limit,
    totalUsers,
    currentUserRank,
    totalPages,
    userRankTitle,
    handlePageChange,
  };
}

