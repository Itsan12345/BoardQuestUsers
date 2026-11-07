"use client";

import React from 'react';
import { useHomeDashboard } from '../hooks';
import { HomeLoading } from './HomeLoading';
import { HomeHeroSection } from './HomeHeroSection';
import { TargetExamCard } from './TargetExamCard';
import { ActiveCourseCard } from './ActiveCourseCard';
import { HomeLeaderboardCard } from './HomeLeaderboardCard';
import { NextMilestoneCard } from './NextMilestoneCard';
import { DailyTargetMeterCard } from './DailyTargetMeterCard';
import { ActiveGuidanceBanner } from '@/components/faculty/ActiveGuidanceBanner';
import { DailyLoginWidget } from '@/components/daily-login/DailyLoginWidget';
import { DailyLoginRewardModal } from '@/components/daily-login/DailyLoginRewardModal';

export const HomeDashboard: React.FC = () => {
  const {
    mounted,
    user,
    leaderboard,
    userRank,
    guidanceList,
    dailyLoginStatus,
    dailyModalOpen,
    setDailyModalOpen,
    nextMilestone,
    targetExamDate,
    dailyQuota,
    loading,
    activeCourseInfo,
    loadData,
  } = useHomeDashboard();

  if (!mounted || loading) {
    return <HomeLoading />;
  }

  return (
    <div
      className="min-h-full bg-background p-3.5 sm:p-5 lg:p-5 xl:p-8 space-y-5 sm:space-y-6 xl:space-y-8"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Hero Section */}
      <HomeHeroSection />

      {/* Active Faculty Guidance & Academic Counseling Referral Banner */}
      {guidanceList.length > 0 && (
        <section className="space-y-2">
          <ActiveGuidanceBanner guidanceList={guidanceList} onRefresh={loadData} />
        </section>
      )}

      {/* Your Study Dashboard Section */}
      <section className="space-y-0.5">
        <h2
          className="text-xl sm:text-2xl xl:text-3xl font-medium"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Your Study Dashboard
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
          Real-time tracking of your journey to professional certification
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 xl:gap-8">
        {/* Left Column: Target Exam, Current Course & Leaderboard */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5 xl:space-y-6 min-w-0">
          <TargetExamCard targetExamDate={targetExamDate} />

          <ActiveCourseCard activeCourseInfo={activeCourseInfo} />

          <HomeLeaderboardCard leaderboard={leaderboard} userRank={userRank} />
        </div>

        {/* Right Sidebar - Active Objectives, Daily Target & Missions */}
        <div
          id="tour-dashboard-dailygoal"
          className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-5 xl:space-y-6 min-w-0"
        >
          <NextMilestoneCard nextMilestone={nextMilestone} user={user} />

          <DailyTargetMeterCard user={user} dailyQuota={dailyQuota} />

          {/* Student Daily Login Attendance & Streak Widget */}
          {dailyLoginStatus && (
            <DailyLoginWidget
              statusData={dailyLoginStatus}
              onRefresh={loadData}
              onOpenModal={() => setDailyModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Auto / Controlled Daily Login Attendance Modal */}
      <DailyLoginRewardModal
        open={dailyModalOpen}
        onOpenChange={(open) => {
          setDailyModalOpen(open);
          if (!open && dailyLoginStatus?.todayDate) {
            try {
              sessionStorage.setItem('bq_daily_modal_dismissed', dailyLoginStatus.todayDate);
            } catch {
              // safe fallback
            }
          }
        }}
        statusData={dailyLoginStatus}
        onRewardClaimed={loadData}
      />
    </div>
  );
};

