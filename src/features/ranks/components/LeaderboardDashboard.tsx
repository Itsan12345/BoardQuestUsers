"use client";

import { useLeaderboard } from '../hooks';
import { LeaderboardLoading } from './LeaderboardLoading';
import { LeaderboardHeader } from './LeaderboardHeader';
import { RankTiersModal } from './RankTiersModal';
import { UnrankedBanner } from './UnrankedBanner';
import { LeaderboardOverviewCards } from './LeaderboardOverviewCards';
import { LeaderboardTable } from './LeaderboardTable';
import { LeaderboardPagination } from './LeaderboardPagination';

export function LeaderboardDashboard() {
  const {
    user,
    topUsers,
    rankTiers,
    loading,
    page,
    limit,
    currentUserRank,
    totalPages,
    userRankTitle,
    handlePageChange,
  } = useLeaderboard();

  if (loading) {
    return <LeaderboardLoading />;
  }

  const isUnranked = user && (!user.xp || user.xp === 0);

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6 sm:space-y-8 relative">
      {/* Info Button - Very Top Right of Page */}
      <RankTiersModal rankTiers={rankTiers} userLevel={user?.level || 1} />

      {/* Header Banner */}
      <LeaderboardHeader />

      {/* 0 XP / Unranked Banner for First-Time Users */}
      {isUnranked && <UnrankedBanner />}

      {/* Top Overview Cards */}
      <LeaderboardOverviewCards
        level={user?.level || 1}
        rankTitle={userRankTitle}
        xp={user?.xp || 0}
        streak={user?.streak || 0}
      />

      {/* Regional Leaderboard Table */}
      <LeaderboardTable
        topUsers={topUsers}
        currentUserId={user?.id}
        currentUserXp={user?.xp || 0}
        currentUserRank={currentUserRank}
        rankTiers={rankTiers}
        page={page}
        limit={limit}
      />

      {/* Pagination Controls */}
      <LeaderboardPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

