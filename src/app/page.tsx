
"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Zap, ChevronRight, Rocket, Loader2, Flame, Trophy, Target, Calendar as CalendarIcon, Pencil, PlayCircle, BookOpen, GraduationCap, Sparkles, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserStats, getLeaderboard, generateDailyMissions, getUserSettingsAction } from '@/app/actions/user';
import { getStudyPlans } from '@/app/actions/study-plan';
import { getStudentGuidanceAssignmentsAction, type GuidanceAssignmentRecord } from '@/app/actions/guidance';
import { recordDailyLoginAction, getDailyLoginStatusAction } from '@/app/actions/daily-login';
import { type DailyLoginStatusData } from '@/lib/daily-login-config';
import { DailyLoginWidget } from '@/components/dashboard/DailyLoginWidget';
import { DailyLoginRewardModal } from '@/components/dashboard/DailyLoginRewardModal';
import { ActiveGuidanceBanner } from '@/components/guidance/ActiveGuidanceBanner';
import { getUserLessonCompletions, getCategories, getLearningModules } from '@/app/actions/study';
import { format, differenceInCalendarDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

function DashboardContent() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [dailyMissions, setDailyMissions] = useState<any[]>([]);
  const [guidanceList, setGuidanceList] = useState<GuidanceAssignmentRecord[]>([]);
  const [dailyLoginStatus, setDailyLoginStatus] = useState<DailyLoginStatusData | null>(null);
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [nextMilestone, setNextMilestone] = useState<{ subject: string; date: Date } | null>(null);
  const [targetExamDate, setTargetExamDate] = useState<Date | null>(null);
  const [dailyQuota, setDailyQuota] = useState<number>(50);
  const [focusSubject, setFocusSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCourseInfo, setActiveCourseInfo] = useState<{
    status: 'not_started' | 'in_progress' | 'completed' | 'no_modules';
    subject: string;
    currentModuleTitle: string;
    currentModuleDesc?: string;
    currentModuleId?: string;
    completedCount: number;
    totalLessons: number;
    progressPercent: number;
    upNextModule?: { title: string; duration?: string } | null;
  }>({
    status: 'no_modules',
    subject: 'BoardQuest Curriculum',
    currentModuleTitle: 'No Learning Modules Available',
    currentModuleDesc: 'Learning materials and review subjects are currently being prepared.',
    completedCount: 0,
    totalLessons: 0,
    progressPercent: 0,
    upNextModule: null
  });

  const loadData = useCallback(async () => {
    try {
      const [stats, leadersData, plans, missions, settings, guidanceRes, loginRecordRes, completionsMap, dbCategories, dbModules] = await Promise.all([
        getUserStats(),
        getLeaderboard(),
        getStudyPlans(),
        generateDailyMissions(),
        getUserSettingsAction().catch(() => null),
        getStudentGuidanceAssignmentsAction().catch(() => ({ success: false, data: [] })),
        recordDailyLoginAction().catch(() => ({ success: false, isLoggedIn: false, status: undefined })),
        getUserLessonCompletions().catch(() => ({} as Record<string, string>)),
        getCategories().catch(() => []),
        getLearningModules().catch(() => []),
      ]);

      setUser(stats);
      setLeaderboard(leadersData.topUsers);
      setUserRank(leadersData.currentUserRank);
      setDailyMissions(missions);
      if (guidanceRes?.success && guidanceRes.data) {
        setGuidanceList(guidanceRes.data);
      }

      let currentStatus: DailyLoginStatusData | null = null;
      if (loginRecordRes && 'status' in loginRecordRes && loginRecordRes.status) {
        currentStatus = loginRecordRes.status;
      } else {
        const statusRes = await getDailyLoginStatusAction().catch(() => null);
        if (statusRes) currentStatus = statusRes;
      }

      if (currentStatus) {
        setDailyLoginStatus(currentStatus);

        // Check if user just logged in or if today's reward is available
        try {
          const justLoggedIn = sessionStorage.getItem('bq_just_logged_in') === 'true';
          const dismissedToday = sessionStorage.getItem('bq_daily_modal_dismissed') === currentStatus.todayDate;

          if (justLoggedIn || (!currentStatus.hasClaimedToday && !dismissedToday)) {
            setDailyModalOpen(true);
            sessionStorage.removeItem('bq_just_logged_in');
          }
        } catch (e) { }
      }

      let effectiveFocus = settings?.focusSubject && settings.focusSubject !== 'none' ? settings.focusSubject : null;
      if (settings) {
        setTargetExamDate(settings.targetExamDate ? new Date(settings.targetExamDate) : null);
        setFocusSubject(effectiveFocus);
      } else {
        setTargetExamDate(null);
        setFocusSubject(null);
      }

      if (plans && plans.length > 0) {
        const today = new Date();
        const futurePlans = plans.filter(p => new Date(p.endDate || p.targetDate || p.createdAt) >= today);
        const activePlan = futurePlans.length > 0 ? futurePlans[0] : plans[plans.length - 1];
        const planDate = activePlan.endDate || activePlan.targetDate || activePlan.createdAt;
        setNextMilestone({ subject: activePlan.subject, date: new Date(planDate) });
      }

      // Build dynamic curriculum categories & modules purely from database
      const baseCategories = (dbCategories && dbCategories.length > 0)
        ? dbCategories.map((c: any) => ({ id: c.id, title: c.name }))
        : [];

      const dynamicCurriculum = baseCategories.map((cat: any) => {
        const catId = cat.id;

        const dynamicModulesForCat = (dbModules || []).filter((m: any) =>
          m.categoryId === catId || (m.categoryId && m.categoryId.toString() === catId)
        );

        const lessons = dynamicModulesForCat.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description || 'Uploaded learning module',
          duration: `${m.fileUrls?.length || 1} Doc`,
          status: completionsMap[m.id] || 'not-started'
        }));

        return {
          id: cat.id,
          title: cat.title,
          lessons
        };
      });

      // Load last studied info from localStorage or focus settings
      let lastStudied: any = null;
      try {
        const raw = localStorage.getItem('bq_last_studied');
        if (raw) lastStudied = JSON.parse(raw);
      } catch (e) { }

      let targetSubName = lastStudied?.subject || effectiveFocus || 'Clinical Chemistry';

      let matchedCat = dynamicCurriculum.find(
        c => c.title.toLowerCase() === targetSubName.toLowerCase() || c.id === targetSubName
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
          upNextModule: null
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

          const currentSubIdx = dynamicCurriculum.findIndex(c => c.id === matchedCat!.id);
          if (dynamicCurriculum.length > 1) {
            const nextCat = dynamicCurriculum[(currentSubIdx + 1) % dynamicCurriculum.length];
            if (nextCat && nextCat.lessons.length > 0 && nextCat.id !== matchedCat.id) {
              upNext = { title: `${nextCat.title}: ${nextCat.lessons[0].title}`, duration: nextCat.lessons[0].duration };
            }
          }
        } else if (lastStudied?.subject?.toLowerCase() === matchedCat.title.toLowerCase() && lastStudied?.moduleId) {
          const foundIdx = lessons.findIndex((l: any) => l.id === lastStudied.moduleId);
          if (foundIdx !== -1) {
            curMod = lessons[foundIdx];
            computedStatus = compCount > 0 ? 'in_progress' : 'not_started';

            if (foundIdx + 1 < lessons.length) {
              upNext = lessons[foundIdx + 1];
            } else {
              const currentSubIdx = dynamicCurriculum.findIndex(c => c.id === matchedCat!.id);
              if (dynamicCurriculum.length > 1) {
                const nextCat = dynamicCurriculum[(currentSubIdx + 1) % dynamicCurriculum.length];
                if (nextCat && nextCat.lessons.length > 0 && nextCat.id !== matchedCat.id) {
                  upNext = { title: `${nextCat.title}: ${nextCat.lessons[0].title}`, duration: nextCat.lessons[0].duration };
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
              const currentSubIdx = dynamicCurriculum.findIndex(c => c.id === matchedCat!.id);
              if (dynamicCurriculum.length > 1) {
                const nextCat = dynamicCurriculum[(currentSubIdx + 1) % dynamicCurriculum.length];
                if (nextCat && nextCat.lessons.length > 0 && nextCat.id !== matchedCat.id) {
                  upNext = { title: `${nextCat.title}: ${nextCat.lessons[0].title}`, duration: nextCat.lessons[0].duration };
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
          upNextModule: upNext
        });
      }

      // Load preferences from localStorage
      try {
        const savedQuota = localStorage.getItem('bq_pref_daily_quota');
        if (savedQuota) setDailyQuota(parseInt(savedQuota, 10));
      } catch (e) { }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();

    const handleSync = (e?: any) => {
      if (e?.detail?.targetExamDate !== undefined) {
        setTargetExamDate(e.detail.targetExamDate ? new Date(e.detail.targetExamDate) : null);
      }
      if (e?.detail?.focusSubject !== undefined) {
        setFocusSubject(e.detail.focusSubject && e.detail.focusSubject !== 'none' ? e.detail.focusSubject : null);
      }
      loadData();
    };

    window.addEventListener('bq_settings_updated', handleSync);
    window.addEventListener('bq_stats_updated', handleSync);
    window.addEventListener('bq_guidance_updated', handleSync);
    window.addEventListener('bq_daily_login_updated', handleSync);
    window.addEventListener('bq_last_studied_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('bq_settings_updated', handleSync);
      window.removeEventListener('bq_stats_updated', handleSync);
      window.removeEventListener('bq_guidance_updated', handleSync);
      window.removeEventListener('bq_daily_login_updated', handleSync);
      window.removeEventListener('bq_last_studied_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadData]);

  const totalMastery = user?.mastery?.length > 0
    ? Math.round(user.mastery.reduce((acc: number, m: any) => acc + m.proficiency, 0) / user.mastery.length)
    : 0;

  const completedModules = user?._count?.lessonCompletions || 0;
  const totalModules = 13;
  const courseProgressPercent = totalModules > 0
    ? Math.min(100, Math.round((completedModules / totalModules) * 100))
    : 0;

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Hero Section */}
      <section id="tour-dashboard-hero" className="space-y-4 sm:space-y-6">
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Master Your Boards,<br />
            <span className="text-primary font-semibold">Level Up Your Knowledge</span>
          </h1>
        </div>
        <Link href="/quest">
          <Button size="lg" className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl mt-2 sm:mt-4 text-xs sm:text-sm font-medium shadow-lg bg-primary hover:bg-primary/90" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Start Quest <Zap className="h-4 w-4 sm:h-5 sm:w-5 ml-2 fill-current" />
          </Button>
        </Link>
      </section>

      {/* Active Faculty Guidance & Academic Counseling Referral Banner */}
      {guidanceList.length > 0 && (
        <section className="space-y-2">
          <ActiveGuidanceBanner guidanceList={guidanceList} onRefresh={loadData} />
        </section>
      )}

      {/* Your Study Dashboard Section */}
      <section className="space-y-0.5">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Your Study Dashboard</h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal">Real-time tracking of your journey to professional certification</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
        {/* Left 2-Column: Target Exam & Current Course */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Target Board Exam (MTLE) Countdown Card */}
          <Card className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm",
                  targetExamDate
                    ? "bg-red-50 dark:bg-red-950/40 border-primary/20 text-primary"
                    : "bg-muted/50 border-border text-muted-foreground"
                )}>
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-widest truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Target Board Exam (MTLE)
                  </p>
                  <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {targetExamDate ? format(targetExamDate, 'MMMM d, yyyy') : 'No Target Date Set'}
                  </h3>
                </div>
              </div>

              {targetExamDate ? (
                (() => {
                  const today = startOfDay(new Date());
                  const daysLeft = differenceInCalendarDays(startOfDay(targetExamDate), today);

                  return (
                    <div className="flex items-center justify-center gap-2 shrink-0">
                      <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-muted/40 border border-border/80 flex items-baseline gap-1.5 shadow-sm">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {daysLeft > 0 ? daysLeft : daysLeft === 0 ? '0' : Math.abs(daysLeft)}
                        </span>
                        <span className="text-[9px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {daysLeft > 0 ? 'DAYS LEFT' : daysLeft === 0 ? 'EXAM TODAY' : 'DAYS AGO'}
                        </span>
                      </div>
                      <Link href="/profile?openSettings=true&tab=profile&focus=targetExam">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Edit Target MTLE Board Schedule"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center shrink-0">
                  <Link href="/profile?openSettings=true&tab=profile&focus=targetExam">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold h-9 px-3"
                    >
                      Set Target Date
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coursera-Style Current Course Progress Card with Dynamic Fallbacks */}
          <Card id="tour-dashboard-studyplan" className="border-2 border-border shadow-md rounded-2xl bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden relative group transition-all duration-300 hover:shadow-lg">
            {/* Top Badge & Header Pill */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between gap-3 border-b border-border/60 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                {activeCourseInfo.status === 'no_modules' ? (
                  <>
                    <FolderKanban className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Curriculum Overview • {activeCourseInfo.subject}
                    </span>
                  </>
                ) : activeCourseInfo.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Completed • {activeCourseInfo.subject}
                    </span>
                  </>
                ) : activeCourseInfo.status === 'not_started' ? (
                  <>
                    <span className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-widest truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Ready to Begin • {activeCourseInfo.subject}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
                    <span className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-widest truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      In Progress • {activeCourseInfo.subject}
                    </span>
                  </>
                )}
              </div>

              <Badge variant="outline" className={cn(
                "text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0",
                activeCourseInfo.status === 'no_modules'
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  : activeCourseInfo.status === 'completed'
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : "bg-primary/10 text-primary border-primary/30"
              )}>
                {activeCourseInfo.status === 'no_modules'
                  ? '0 Modules Available'
                  : activeCourseInfo.status === 'completed'
                    ? `All ${activeCourseInfo.totalLessons} Modules Mastered 🎉`
                    : `${activeCourseInfo.completedCount}/${activeCourseInfo.totalLessons} Modules`}
              </Badge>
            </div>

            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Fallback View: No Modules in Database */}
              {activeCourseInfo.status === 'no_modules' ? (
                <div className="py-4 sm:py-6 px-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        No Learning Modules Uploaded Yet
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Curriculum materials for {activeCourseInfo.subject} are currently being prepared. Check back soon or select another subject in Study Subjects.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Main Subject & Current Module Title */
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {activeCourseInfo.status === 'not_started'
                        ? 'Recommended Starting Point'
                        : activeCourseInfo.status === 'completed'
                          ? 'Subject Completed'
                          : 'Current Module'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {activeCourseInfo.currentModuleTitle}
                  </h3>
                  {activeCourseInfo.currentModuleDesc && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {activeCourseInfo.currentModuleDesc}
                    </p>
                  )}
                </div>
              )}

              {/* Progress Bar & Percentage */}
              <div className="space-y-2.5 bg-muted/30 p-3.5 sm:p-4 rounded-xl border border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-primary shrink-0" /> Subject Mastery & Completion
                  </span>
                  <span className="font-bold text-primary text-sm">{activeCourseInfo.progressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/40">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 shadow-xs",
                      activeCourseInfo.status === 'completed'
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-primary/80 to-primary"
                    )}
                    style={{ width: `${activeCourseInfo.progressPercent}%` }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground font-medium gap-1 pt-0.5">
                  <span>
                    {activeCourseInfo.status === 'no_modules'
                      ? 'Awaiting module deployment by review center'
                      : activeCourseInfo.status === 'not_started'
                        ? `0 of ${activeCourseInfo.totalLessons} lessons completed • Ready to start`
                        : `${activeCourseInfo.completedCount} of ${activeCourseInfo.totalLessons} lessons completed`}
                  </span>
                  <span>
                    {activeCourseInfo.status === 'completed'
                      ? 'All subject lessons complete 🎉'
                      : activeCourseInfo.status === 'no_modules'
                        ? '0 lessons available'
                        : `${activeCourseInfo.totalLessons - activeCourseInfo.completedCount} lessons left`}
                  </span>
                </div>
              </div>

              {/* Up Next Module Section */}
              {activeCourseInfo.upNextModule && activeCourseInfo.status !== 'no_modules' && (
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        {activeCourseInfo.status === 'completed' ? 'Up Next Subject' : 'Up Next'}
                      </span>
                      {activeCourseInfo.upNextModule.duration && (
                        <span className="text-[10px] text-muted-foreground font-medium">• {activeCourseInfo.upNextModule.duration}</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                      {activeCourseInfo.upNextModule.title}
                    </p>
                  </div>
                </div>
              )}

              {/* Responsive Dynamic CTA Action Button */}
              <div className="pt-1 w-full">
                <Link
                  href={
                    activeCourseInfo.status === 'no_modules'
                      ? '/study'
                      : `/study?subject=${encodeURIComponent(activeCourseInfo.subject)}${activeCourseInfo.currentModuleId ? '&module=' + activeCourseInfo.currentModuleId : ''}`
                  }
                  className="block w-full"
                >
                  <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <PlayCircle className="w-4 h-4 fill-current shrink-0" />
                    <span>
                      {activeCourseInfo.status === 'no_modules'
                        ? 'Explore Study Subjects'
                        : activeCourseInfo.status === 'not_started'
                          ? 'Start Learning Module'
                          : activeCourseInfo.status === 'completed'
                            ? 'Review Subject Material'
                            : 'Resume Learning'}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Leaderboard */}
          <Card className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <p className="text-base sm:text-lg font-medium text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>Weekly Leaderboard</p>
                <p className="text-[11px] sm:text-xs font-normal text-muted-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {userRank ? `You placed ${userRank}${["th", "st", "nd", "rd"][((userRank % 100) - 20) % 10] || ["th", "st", "nd", "rd"][userRank % 100] || "th"} this week` : "No ranking this week"}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 lg:p-8">
              <div className="space-y-3 sm:space-y-4">
                {leaderboard.map((u, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 sm:gap-4 pb-3 sm:pb-4 last:pb-0 border-b border-border last:border-b-0 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary text-[10px] sm:text-xs" style={{ fontFamily: "'Poppins', sans-serif" }}>#{idx + 1}</span>
                      </div>
                    </div>
                    <Avatar className="h-9 w-9 sm:h-12 sm:w-12 bg-primary/20 border-2 border-primary/10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-[10px] sm:text-xs font-medium">{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{u.name}</p>
                      <p className="text-[10px] sm:text-xs font-normal text-muted-foreground truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{u.xp.toLocaleString()} XP</p>
                    </div>
                    {idx === 0 && <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Active Objectives, Daily Target & Missions */}
        <div id="tour-dashboard-dailygoal" className="space-y-5 sm:space-y-6">

          {/* Active Mission Objective Card */}
          <Card className="border-2 border-border shadow-sm rounded-2xl bg-background p-4 sm:p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary shrink-0" />
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Active Mission Objective
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary shrink-0">
                Curriculum Milestone
              </Badge>
            </div>

            {nextMilestone ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Focus Subject</p>
                  <h4 className="text-base sm:text-lg font-bold text-foreground leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {nextMilestone.subject}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">Target Date</span>
                    <span className="font-bold text-primary flex items-center gap-1 mt-0.5">
                      <CalendarIcon className="w-3 h-3 shrink-0" />
                      {format(nextMilestone.date, "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">Time Left</span>
                    <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-primary shrink-0" />
                      {Math.max(0, differenceInCalendarDays(startOfDay(nextMilestone.date), startOfDay(new Date())))} Days
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-muted-foreground">Mastery Level</span>
                    <span className="text-primary">
                      {user?.mastery?.find((m: any) => m.subject === nextMilestone.subject)?.proficiency || 0}%
                    </span>
                  </div>
                  <Progress
                    value={user?.mastery?.find((m: any) => m.subject === nextMilestone.subject)?.proficiency || 0}
                    className="h-2 rounded-full"
                  />
                </div>

                <Link href={`/study?subject=${encodeURIComponent(nextMilestone.subject)}`} className="block">
                  <Button variant="outline" className="w-full h-9 rounded-xl text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 flex items-center justify-center gap-1">
                    <span>Deploy Target Milestone</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="py-5 text-center space-y-2">
                <Target className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs font-medium text-muted-foreground leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  No active objective scheduled.{' '}
                  <Link href="/study" className="text-primary font-semibold hover:underline">
                    Visit Study Subjects
                  </Link>{' '}
                  to deploy target milestones.
                </p>
              </div>
            )}
          </Card>

          {/* Daily Question Target Meter */}
          {/* Daily Target Card */}
          <Card className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-widest" style={{ fontFamily: "'Poppins', sans-serif" }}>Daily Target</p>
                <Link href="/profile?openSettings=true&tab=goals">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Edit Daily Goals"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5">
                {user?.todayQuestions || 0} / {dailyQuota} Qs
              </Badge>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              {(() => {
                const todayDone = user?.todayQuestions || 0;
                const percent = Math.min(100, Math.round((todayDone / (dailyQuota || 1)) * 100));
                return (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Today's Progress</span>
                      <span className="font-semibold text-foreground">{percent}% Completed</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/60">
                      <div
                        className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {percent >= 100
                        ? '🎉 Daily question goal achieved! Excellent discipline.'
                        : `${Math.max(0, dailyQuota - todayDone)} questions remaining to hit today's study target.`}
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>

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
            } catch (e) { }
          }
        }}
        statusData={dailyLoginStatus}
        onRewardClaimed={loadData}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
