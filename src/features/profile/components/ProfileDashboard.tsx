"use client";

import { useRouter } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { AccountSettingsDialog } from '@/components/profile/AccountSettingsDialog';
import { GuidanceCounselingDialog } from '@/components/guidance/GuidanceCounselingDialog';
import { useUserProfile } from '../hooks';
import { ProfileHeaderCard } from './ProfileHeaderCard';
import { CombatStatsCard } from './CombatStatsCard';
import { AspirantStatsCard } from './AspirantStatsCard';
import { BadgesShowcaseCard } from './BadgesShowcaseCard';
import { RecentAchievementsCard } from './RecentAchievementsCard';
import { GuidanceBanner } from './GuidanceBanner';
import { AllBadgesDialog } from './AllBadgesDialog';
import { ProfileLoading } from './ProfileLoading';

export function ProfileDashboard() {
  const router = useRouter();
  const {
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
    allMergedBadges,
    earnedBadgeCodes,
    filteredBadges,
  } = useUserProfile();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  if (loading) {
    return <ProfileLoading />;
  }

  if (!userProfile) {
    return null;
  }

  const earnedCount = allMergedBadges.filter(
    (b) =>
      earnedBadgeCodes.has(b.id.toLowerCase()) ||
      (b.id === 'speed' && earnedBadgeCodes.has('swift-solver'))
  ).length;

  return (
    <div className="min-h-screen bg-background p-3 sm:p-5 xl:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Profile Header Card */}
        <ProfileHeaderCard
          userProfile={userProfile}
          onOpenSettings={() => setAccountSettingsOpen(true)}
          onLogout={handleLogout}
        />

        {/* Stats and Achievements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6">
          {/* Left Column - Stats */}
          <div
            id="tour-profile-stats"
            className="lg:col-span-5 xl:col-span-4 space-y-5 xl:space-y-6 min-w-0"
          >
            <CombatStatsCard userProfile={userProfile} />
            <AspirantStatsCard userProfile={userProfile} />
          </div>

          {/* Right Column - Achievements and Activity */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 xl:space-y-6 min-w-0">
            <BadgesShowcaseCard
              userProfile={userProfile}
              dbUserBadges={dbUserBadges}
              onOpenViewAll={() => setViewAllBadgesOpen(true)}
            />

            <RecentAchievementsCard achievements={userProfile.achievements} />

            <GuidanceBanner
              guidanceList={guidanceList}
              onSelectGuidance={(guidance) => {
                setSelectedGuidance(guidance);
                setGuidanceDialogOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Hall of Achievements Dialog */}
      <AllBadgesDialog
        open={viewAllBadgesOpen}
        onOpenChange={setViewAllBadgesOpen}
        filteredBadges={filteredBadges}
        earnedBadgeCodes={earnedBadgeCodes}
        totalBadgesCount={allMergedBadges.length}
        earnedCount={earnedCount}
        badgeFilter={badgeFilter}
        onFilterChange={setBadgeFilter}
      />

      {/* Guidance Counseling Dialog */}
      {selectedGuidance && (
        <GuidanceCounselingDialog
          open={guidanceDialogOpen}
          onOpenChange={setGuidanceDialogOpen}
          assignment={selectedGuidance}
          onResolved={() => {
            setGuidanceList((prev) =>
              prev.map((item) =>
                item.id === selectedGuidance.id ? { ...item, status: 'RESOLVED' } : item
              )
            );
          }}
        />
      )}

      {/* Account Settings Dialog */}
      <AccountSettingsDialog
        open={accountSettingsOpen}
        onOpenChange={setAccountSettingsOpen}
        userProfile={userProfile}
        initialTab={initialSettingsTab}
        autoOpenCalendar={autoOpenCalendar}
        onProfileUpdated={(updated) => {
          if (updated) {
            setUserProfile((prev: any) => ({ ...prev, ...updated }));
          }
        }}
      />
    </div>
  );
}

