
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Zap, ChevronRight, Rocket, Loader2, Flame, Trophy, Target, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserStats, getLeaderboard, generateDailyMissions, getUserSettingsAction } from '@/app/actions/user';
import { getStudyPlans } from '@/app/actions/study-plan';
import { format, differenceInCalendarDays, startOfDay } from 'date-fns';

function DashboardContent() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [dailyMissions, setDailyMissions] = useState<any[]>([]);
  const [nextMilestone, setNextMilestone] = useState<{ subject: string; date: Date } | null>(null);
  const [targetExamDate, setTargetExamDate] = useState<Date>(new Date(2026, 9, 30));
  const [dailyQuota, setDailyQuota] = useState<number>(50);
  const [focusSubject, setFocusSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const [stats, leadersData, plans, missions, settings] = await Promise.all([
          getUserStats(),
          getLeaderboard(),
          getStudyPlans(),
          generateDailyMissions(),
          getUserSettingsAction().catch(() => null)
        ]);

        setUser(stats);
        setLeaderboard(leadersData.topUsers);
        setUserRank(leadersData.currentUserRank);
        setDailyMissions(missions);

        if (settings?.targetExamDate) {
          setTargetExamDate(new Date(settings.targetExamDate));
        } else {
          try {
            const savedDate = localStorage.getItem('bq_pref_target_exam_date');
            if (savedDate) setTargetExamDate(new Date(savedDate));
          } catch (e) {}
        }

        if (plans && plans.length > 0) {
          const today = new Date();
          const futurePlans = plans.filter(p => new Date(p.targetDate) >= today);
          const activePlan = futurePlans.length > 0 ? futurePlans[0] : plans[plans.length - 1];
          setNextMilestone({ subject: activePlan.subject, date: new Date(activePlan.targetDate) });
        }

        // Load preferences from localStorage
        try {
          const savedQuota = localStorage.getItem('bq_pref_daily_quota');
          if (savedQuota) setDailyQuota(parseInt(savedQuota, 10));

          const savedSubject = localStorage.getItem('bq_pref_focus_subject');
          if (savedSubject) setFocusSubject(savedSubject);
        } catch (e) { }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const handleSync = (e?: any) => {
      if (e?.detail?.targetExamDate) {
        setTargetExamDate(new Date(e.detail.targetExamDate));
      }
      loadData();
    };

    window.addEventListener('bq_settings_updated', handleSync);
    window.addEventListener('bq_stats_updated', handleSync);

    return () => {
      window.removeEventListener('bq_settings_updated', handleSync);
      window.removeEventListener('bq_stats_updated', handleSync);
    };
  }, []);

  const totalMastery = user?.mastery?.length > 0
    ? Math.round(user.mastery.reduce((acc: number, m: any) => acc + m.proficiency, 0) / user.mastery.length)
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
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-widest truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Target Board Exam (MTLE)
                  </p>
                  <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {format(targetExamDate, 'MMMM d, yyyy')}
                  </h3>
                </div>
              </div>

              {(() => {
                const today = startOfDay(new Date());
                const daysLeft = differenceInCalendarDays(startOfDay(targetExamDate), today);

                return (
                  <div className="flex items-center justify-center shrink-0">
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-muted/40 border border-border/80 flex items-baseline gap-1.5 shadow-sm">
                      <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {daysLeft > 0 ? daysLeft : daysLeft === 0 ? '0' : Math.abs(daysLeft)}
                      </span>
                      <span className="text-[9px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {daysLeft > 0 ? 'DAYS LEFT' : daysLeft === 0 ? 'EXAM TODAY' : 'DAYS AGO'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card id="tour-dashboard-studyplan" className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
            <CardContent className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] sm:text-xs font-medium text-primary uppercase tracking-widest" style={{ fontFamily: "'Poppins', sans-serif" }}>Current Course</p>
                <h3 className="text-lg sm:text-xl font-medium text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>MedTech Board Mastery</h3>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-1 sm:gap-0">
                  <span className="text-4xl sm:text-5xl font-bold text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>{totalMastery}%</span>
                  <span className="text-[10px] sm:text-xs font-normal text-muted-foreground uppercase tracking-widest sm:text-right" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {user?._count?.lessonCompletions || 0}/13 MODULES COMPLETED
                  </span>
                </div>
                <div className="w-full h-3 sm:h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalMastery}%` }} />
                </div>
              </div>

              {(() => {
                const continueSubject = focusSubject || nextMilestone?.subject || 'Clinical Chemistry';
                return (
                  <Link href={`/study?subject=${encodeURIComponent(continueSubject)}`} className="block">
                    <Button className="w-full min-h-11 h-auto py-2.5 px-3 sm:px-4 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 leading-snug" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <span className="truncate">
                        {focusSubject ? `⭐ Focus: ${continueSubject}` : `Continue: ${continueSubject}`}
                      </span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </Button>
                  </Link>
                );
              })()}
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

        {/* Right Sidebar - Daily Target & Missions */}
        <div id="tour-dashboard-dailygoal" className="space-y-5 sm:space-y-6">
          {/* Daily Question Target Meter */}
          <Card className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border flex flex-row items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-widest" style={{ fontFamily: "'Poppins', sans-serif" }}>Daily Target</p>
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

          <Card className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border">
              <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-widest" style={{ fontFamily: "'Poppins', sans-serif" }}>Daily Missions</p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {dailyMissions.length > 0 ? (
                dailyMissions.map((mission) => {
                  let MissionIcon = Target;
                  let iconBgColor = 'bg-secondary';
                  let iconColor = 'text-muted-foreground';

                  if (mission.isStreakMission) {
                    MissionIcon = Flame;
                    iconBgColor = 'bg-orange-100 dark:bg-orange-950/30';
                    iconColor = 'text-orange-600 dark:text-orange-400';
                  } else if (mission.priority === 1) {
                    MissionIcon = Trophy;
                    iconBgColor = 'bg-red-100 dark:bg-red-950/30';
                    iconColor = 'text-primary dark:text-red-400';
                  } else if (mission.priority === 2) {
                    MissionIcon = Zap;
                    iconBgColor = 'bg-yellow-100 dark:bg-yellow-950/30';
                    iconColor = 'text-yellow-600 dark:text-yellow-400';
                  }

                  return (
                    <div key={mission.id} className="flex items-start gap-2.5 sm:gap-3 pb-3 sm:pb-4 last:pb-0 border-b border-border last:border-b-0 min-w-0">
                      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}>
                        <MissionIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-normal text-foreground truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{mission.title}</p>
                        <p className="text-[10px] sm:text-xs font-normal text-muted-foreground uppercase mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{mission.proficiency}% Proficiency • +{mission.xp} XP</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 sm:py-6">
                  <p className="text-xs sm:text-sm text-muted-foreground font-normal" style={{ fontFamily: "'Poppins', sans-serif" }}>No active missions yet.</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-normal" style={{ fontFamily: "'Poppins', sans-serif" }}>Set your study targets to generate personalized missions.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm rounded-2xl bg-primary text-white p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>Quest Streak</h4>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{user?.streak || 0}</div>
                <div className="text-[10px] sm:text-xs font-normal uppercase leading-tight opacity-90" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {user?.streak === 0 ? (
                    <>Streak Reset<br/>Start Quest Today</>
                  ) : (
                    <>Days Active<br/>Consistent Review</>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
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
