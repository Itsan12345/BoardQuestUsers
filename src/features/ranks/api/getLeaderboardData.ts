import { getUserStats, getGlobalLeaderboard, getRankTiersAction } from '@/app/actions/user';

export async function fetchLeaderboardData(page: number, limit: number = 10) {
  const [stats, leadersData, tiersData] = await Promise.all([
    getUserStats(),
    getGlobalLeaderboard(page, limit),
    getRankTiersAction(),
  ]);

  return {
    user: stats,
    topUsers: leadersData?.topUsers || [],
    totalUsers: leadersData?.totalUsers || 0,
    currentUserRank: leadersData?.currentUserRank ?? null,
    rankTiers: tiersData || [],
  };
}

