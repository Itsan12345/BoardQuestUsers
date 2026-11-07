"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  fetchHomeInitialData,
  fetchDailyLoginStatusSafe,
  fetchUserSettingsSafe,
} from '../api';
import type { DailyLoginStatusData } from '@/lib/daily-login-config';
import type { GuidanceAssignmentRecord } from '@/app/actions/guidance';
import type { ActiveCourseInfo, NextMilestone } from '../types';

export function useHomeDashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [dailyMissions, setDailyMissions] = useState<any[]>([]);
  const [guidanceList, setGuidanceList] = useState<GuidanceAssignmentRecord[]>([]);
  const [dailyLoginStatus, setDailyLoginStatus] = useState<DailyLoginStatusData | null>(null);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [nextMilestone, setNextMilestone] = useState<NextMilestone | null>(null);
  const [targetExamDate, setTargetExamDate] = useState<Date | null>(null);
  const [dailyQuota] = useState<number>(50);
  const [focusSubject, setFocusSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCourseInfo, setActiveCourseInfo] = useState<ActiveCourseInfo>({
    status: 'no_modules',
    subject: 'BoardQuest Curriculum',
    currentModuleTitle: 'No Learning Modules Available',
    currentModuleDesc: 'Learning materials and review subjects are currently being prepared.',
    completedCount: 0,
    totalLessons: 0,
    progressPercent: 0,
    upNextModule: null,
  });

  const loadData = useCallback(async () => {
    try {
      const {
        stats,
        leadersData,
        plans,
        missions,
        settings,
        guidanceList: fetchedGuidance,
        loginRecordRes,
        completionsMap,
        dbCategories,
        dbModules,
      } = await fetchHomeInitialData();

      setUser(stats);
      setLeaderboard(leadersData.topUsers);
      setUserRank(leadersData.currentUserRank);
      setDailyMissions(missions);
      setGuidanceList(fetchedGuidance);

      let currentStatus: DailyLoginStatusData | null = null;
      if (loginRecordRes && 'status' in loginRecordRes && loginRecordRes.status) {
        currentStatus = loginRecordRes.status;
      } else {
        const statusRes = await fetchDailyLoginStatusSafe();
        if (statusRes) currentStatus = statusRes;
      }

      if (currentStatus) {
        setDailyLoginStatus(currentStatus);

        try {
          const justLoggedIn = sessionStorage.getItem('bq_just_logged_in') === 'true';
          const dismissedToday =
            sessionStorage.getItem('bq_daily_modal_dismissed') === currentStatus.todayDate;

          if (justLoggedIn || (!currentStatus.hasClaimedToday && !dismissedToday)) {
            setDailyModalOpen(true);
            sessionStorage.removeItem('bq_just_logged_in');
          }
        } catch {
          // safe sessionStorage fallback
        }
      }

      const effectiveFocus =
        settings?.focusSubject && settings.focusSubject !== 'none'
          ? settings.focusSubject
          : null;
      if (settings) {
        setTargetExamDate(settings.targetExamDate ? new Date(settings.targetExamDate) : null);
        setFocusSubject(effectiveFocus);
      } else {
        setTargetExamDate(null);
        setFocusSubject(null);
      }

      if (plans && plans.length > 0) {
        const today = new Date();
        const futurePlans = plans.filter(
          (p: any) => new Date(p.endDate || p.targetDate || p.createdAt) >= today
        );
        const activePlan = futurePlans.length > 0 ? futurePlans[0] : plans[plans.length - 1];
        const planDate = activePlan.endDate || activePlan.targetDate || activePlan.createdAt;
        setNextMilestone({ subject: activePlan.subject, date: new Date(planDate) });
      }

      // Build dynamic curriculum categories & modules purely from database
      const baseCategories =
        dbCategories && dbCategories.length > 0
          ? dbCategories.map((c: any) => ({ id: c.id, title: c.name }))
          : [];

      const dynamicCurriculum = baseCategories.map((cat: any) => {
        const catId = cat.id;

        const dynamicModulesForCat = (dbModules || []).filter(
          (m: any) =>
            m.categoryId === catId ||
            (m.categoryId && m.categoryId.toString() === catId)
        );

        const lessons = dynamicModulesForCat.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description || 'Uploaded learning module',
          duration: `${m.fileUrls?.length || 1} Doc`,
          status: completionsMap[m.id] || 'not-started',
        }));

        return {
          id: cat.id,
          title: cat.title,
          lessons,
        };
      });

      // Load last studied info from localStorage or focus settings
      let lastStudied: any = null;
      try {
        const raw = localStorage.getItem('bq_last_studied');
        if (raw) lastStudied = JSON.parse(raw);
      } catch {
        // safe localStorage fallback
      }

      const targetSubName = lastStudied?.subject || effectiveFocus || 'Clinical Chemistry';

      let matchedCat = dynamicCurriculum.find(
        (c: any) =>
          c.title.toLowerCase() === targetSubName.toLowerCase() || c.id === targetSubName
      );

      if (!matchedCat && dynamicCurriculum.length > 0) {
        matchedCat = dynamicCurriculum[0];
      }

      if (!matchedCat || matchedCat.lessons.length === 0) {
        setActiveCourseInfo({
          status: 'no_modules',
          subject: targetSubName,
          currentModuleTitle: 'No Learning Modules Available',
          currentModuleDesc: `Learning materials for ${targetSubName} are currently being prepared. Select another subject in Study Subjects to begin.`,
          completedCount: 0,
          totalLessons: 0,
          progressPercent: 0,
          upNextModule: null,
        });
      } else {
        const lessons = matchedCat.lessons;
        const totalL = lessons.length;
        const compCount = lessons.filter((l: any) => l.status === 'completed').length;
        const progPct = totalL > 0 ? Math.min(100, Math.round((compCount / totalL) * 100)) : 0;

        let curMod = lessons[0];
        let upNext: { title: string; duration?: string } | null = null;
        let computedStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';

        if (compCount === totalL && totalL > 0) {
          computedStatus = 'completed';
          curMod = lessons[lessons.length - 1];

          const currentSubIdx = dynamicCurriculum.findIndex(
            (c: any) => c.id === matchedCat!.id
          );
          if (dynamicCurriculum.length > 1) {
            const nextCat = dynamicCurriculum[(currentSubIdx + 1) % dynamicCurriculum.length];
            if (nextCat && nextCat.lessons.length > 0 && nextCat.id !== matchedCat.id) {
              upNext = {
                title: `${nextCat.title}: ${nextCat.lessons[0].title}`,
                duration: nextCat.lessons[0].duration,
              };
            }
          }
        } else if (
          lastStudied?.subject?.toLowerCase() === matchedCat.title.toLowerCase() &&
          lastStudied?.moduleId
        ) {
          const foundIdx = lessons.findIndex((l: any) => l.id === lastStudied.moduleId);
          if (foundIdx !== -1) {
            curMod = lessons[foundIdx];
            computedStatus = compCount > 0 ? 'in_progress' : 'not_started';

            if (foundIdx + 1 < lessons.length) {
              upNext = lessons[foundIdx + 1];
            } else {
              const currentSubIdx = dynamicCurriculum.findIndex(
                (c: any) => c.id === matchedCat!.id
              );
              if (dynamicCurriculum.length > 1) {
                const nextCat =
                  dynamicCurriculum[(currentSubIdx + 1) % dynamicCurriculum.length];
                if (nextCat && nextCat.lessons.length > 0 && nextCat.id !== matchedCat.id) {
                  upNext = {
                    title: `${nextCat.title}: ${nextCat.lessons[0].title}`,
                    duration: nextCat.lessons[0].duration,
                  };
                }
              }
            }
          }
        } else {
          const uncompletedIdx = lessons.findIndex((l: any) => l.status !== 'completed');
          if (uncompletedIdx !== -1) {
            curMod = lessons[uncompletedIdx];
            computedStatus = compCount > 0 ? 'in_progress' : 'not_started';

            if (uncompletedIdx + 1 < lessons.length) {
              upNext = lessons[uncompletedIdx + 1];
            } else {
              const currentSubIdx = dynamicCurriculum.findIndex(
                (c: any) => c.id === matchedCat!.id
              );
              if (dynamicCurriculum.length > 1) {
                const nextCat =
                  dynamicCurriculum[(currentSubIdx + 1) % dynamicCurriculum.length];
                if (nextCat && nextCat.lessons.length > 0 && nextCat.id !== matchedCat.id) {
                  upNext = {
                    title: `${nextCat.title}: ${nextCat.lessons[0].title}`,
                    duration: nextCat.lessons[0].duration,
                  };
                }
              }
            }
          } else {
            curMod = lessons[lessons.length - 1];
            computedStatus = compCount > 0 ? 'in_progress' : 'not_started';
          }
        }

        setActiveCourseInfo({
          status: computedStatus,
          subject: matchedCat.title,
          currentModuleTitle: curMod.title,
          currentModuleDesc: curMod.description,
          currentModuleId: curMod.id,
          completedCount: compCount,
          totalLessons: totalL,
          progressPercent: progPct,
          upNextModule: upNext,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();

    const handleSettingsUpdated = async () => {
      const settings = await fetchUserSettingsSafe();
      if (settings) {
        setTargetExamDate(settings.targetExamDate ? new Date(settings.targetExamDate) : null);
        setFocusSubject(
          settings.focusSubject && settings.focusSubject !== 'none'
            ? settings.focusSubject
            : null
        );
      }
      loadData();
    };

    const handleStatsUpdated = () => {
      loadData();
    };

    window.addEventListener('bq_settings_updated', handleSettingsUpdated);
    window.addEventListener('bq_stats_updated', handleStatsUpdated);

    return () => {
      window.removeEventListener('bq_settings_updated', handleSettingsUpdated);
      window.removeEventListener('bq_stats_updated', handleStatsUpdated);
    };
  }, [loadData]);

  const handleRewardClaimed = useCallback((updatedStatus: DailyLoginStatusData) => {
    setDailyLoginStatus(updatedStatus);
    setUser((prev: any) =>
      prev
        ? {
            ...prev,
            xp: (prev.xp || 0) + (updatedStatus.lastClaimedReward?.xp || 0),
            streak: updatedStatus.currentStreak,
          }
        : prev
    );
  }, []);

  return {
    mounted,
    user,
    leaderboard,
    userRank,
    dailyMissions,
    guidanceList,
    dailyLoginStatus,
    dailyModalOpen,
    setDailyModalOpen,
    nextMilestone,
    targetExamDate,
    dailyQuota,
    focusSubject,
    loading,
    activeCourseInfo,
    loadData,
    handleRewardClaimed,
  };
}
