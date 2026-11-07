"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePerformanceData } from '../hooks';
import { PerformanceLoading } from './PerformanceLoading';
import { PerformanceHeader } from './PerformanceHeader';
import { CompetencyAnalyticsHub } from './CompetencyAnalyticsHub';
import { ActiveObjectiveCard } from './ActiveObjectiveCard';
import { StudentPointingCard } from '@/components/performance/StudentPointingCard';
import { AiDiagnosticPrescription } from '@/components/performance/AiDiagnosticPrescription';
import { SubjectTechnicalBreakdown } from '@/components/performance/SubjectTechnicalBreakdown';
import { PointScorecardModal } from '@/components/performance/PointScorecardModal';
import { AccountSettingsDialog } from '@/components/profile/AccountSettingsDialog';

export function PerformanceDashboard() {
  const router = useRouter();
  const {
    user,
    setUser,
    userSettings,
    nextObjective,
    loading,
    performanceHistory,
    scorecardOpen,
    setScorecardOpen,
    settingsOpen,
    setSettingsOpen,
    fullMastery,
    radarData,
    summaryStats,
    daysRemaining,
  } = usePerformanceData();

  const handleNavigateToStudy = useCallback(
    (subjectName?: string) => {
      if (subjectName) {
        router.push(`/study?subject=${encodeURIComponent(subjectName)}`);
      } else {
        router.push('/study');
      }
    },
    [router]
  );

  const handleNavigateToQuest = useCallback(
    (subjectName?: string, topicName?: string) => {
      if (subjectName && topicName) {
        router.push(
          `/quest?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topicName)}`
        );
      } else if (subjectName) {
        router.push(`/quest?subject=${encodeURIComponent(subjectName)}`);
      } else {
        router.push('/quest');
      }
    },
    [router]
  );

  const handleOpenGoalSettings = useCallback(() => {
    router.push('/profile?openSettings=true&tab=goals');
  }, [router]);

  if (loading) {
    return <PerformanceLoading />;
  }

  const activeObjectiveMastery = nextObjective
    ? fullMastery.find((m) => m.subject === nextObjective.subject)?.mastery || 0
    : 0;

  return (
    <div className="max-w-6xl mx-auto py-5 sm:py-8 lg:py-10 px-3 sm:px-4 lg:px-6 space-y-6 sm:space-y-8 pb-24 lg:pb-12">
      {/* 1. Executive Header */}
      <PerformanceHeader />

      {/* 2. Hero Pointing System Strip */}
      <StudentPointingCard
        totalPoints={summaryStats.totalEarnedPoints}
        avgProficiency={summaryStats.avgMasteryNum}
        avgCompletion={summaryStats.avgCompletion}
        masteredCount={summaryStats.masteredCount}
        totalSubjects={fullMastery.length}
        subjects={fullMastery}
        userName={user?.name}
        onOpenScorecard={() => setScorecardOpen(true)}
      />

      {/* 3. Section I: Full-Width AI Diagnostic & Remediation Prescription Card */}
      <section id="ai-diagnostic-prescription">
        <AiDiagnosticPrescription
          avgMastery={summaryStats.avgMasteryNum}
          avgCompletion={summaryStats.avgCompletion}
          fullMastery={fullMastery}
          nextObjective={nextObjective}
          userSettings={userSettings}
          onNavigateToStudy={handleNavigateToStudy}
          onNavigateToQuest={handleNavigateToQuest}
          onOpenGoalSettings={handleOpenGoalSettings}
        />
      </section>

      {/* 4. Section II: Subject Technical Breakdown Grid (Dual Progress Bars: Completion & Mastery) */}
      <section id="subject-technical-breakdown">
        <SubjectTechnicalBreakdown
          items={fullMastery}
          onNavigateToStudy={handleNavigateToStudy}
          onNavigateToQuest={handleNavigateToQuest}
        />
      </section>

      {/* 5. Section III: Competency Diagnostics & Active Objectives */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-5 xl:gap-8 items-start">
        {/* Left 2-Column: Visual Analytics Tabbed Hub (Radar + Quest History) */}
        <div className="lg:col-span-7 xl:col-span-8 min-w-0">
          <CompetencyAnalyticsHub
            radarData={radarData}
            performanceHistory={performanceHistory}
          />
        </div>

        {/* Right 1-Column: Active Mission Objective Milestone */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 min-w-0">
          <ActiveObjectiveCard
            nextObjective={nextObjective}
            daysRemaining={daysRemaining}
            subjectMastery={activeObjectiveMastery}
          />
        </div>
      </section>

      {/* Printable Scorecard Modal */}
      <PointScorecardModal
        open={scorecardOpen}
        onOpenChange={setScorecardOpen}
        totalPoints={summaryStats.totalEarnedPoints}
        avgAccuracy={summaryStats.avgMasteryNum}
        totalQuestions={summaryStats.totalQuestionsAttempted}
        subjects={fullMastery}
        userName={user?.name}
      />

      {/* Account Settings Modal initialized on Goals tab */}
      {user && (
        <AccountSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          initialTab="goals"
          userProfile={{
            id: user.id || '',
            name: user.name || 'Candidate',
            email: user.email || '',
            level: user.level || 1,
            xp: user.xp || 0,
            streak: user.streak || 0,
            location: user.location || 'Philippines',
            classString: 'Aspirant',
          }}
          onProfileUpdated={(updated) => {
            if (updated) setUser((prev: any) => ({ ...prev, ...updated }));
          }}
        />
      )}
    </div>
  );
}

