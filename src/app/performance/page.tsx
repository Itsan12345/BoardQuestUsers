"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import Link from 'next/link';
import {
  TrendingUp, Target, Award, Sparkles, Loader2, Clock, Calendar as CalendarIcon,
  Zap, BookOpen, GraduationCap, ShieldCheck, BarChart3, Activity, Trophy, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserStats, getUserSettingsAction } from '@/app/actions/user';
import { getStudyPlans } from '@/app/actions/study-plan';
import { getSubjectMetrics, getCategories, getSubjectPerformanceHistoryAction, type SubjectAccuracyHistoryItem } from '@/app/actions/study';
import { StudentPointingCard } from '@/components/performance/StudentPointingCard';
import { AiDiagnosticPrescription } from '@/components/performance/AiDiagnosticPrescription';
import { SubjectTechnicalBreakdown, SubjectMasteryItem } from '@/components/performance/SubjectTechnicalBreakdown';
import { PointScorecardModal } from '@/components/performance/PointScorecardModal';
import { AccountSettingsDialog } from '@/components/profile/AccountSettingsDialog';
import { SUBJECT_AREAS } from '@/lib/game-logic';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

const RADAR_LABELS: Record<string, string> = {
  "Clinical Chemistry": "Chemistry",
  "Hematology": "Hematology",
  "Microbiology": "Microbiology",
  "Immunology & Serology and Immunohematology": "Immunochem",
  "Clinical Microscopy & Parasitology": "Microscopy",
  "Histopathology & MT Laws": "Histopath",
  "Histopathology and Medtech Laws": "Histopath"
};

function PerformanceContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [subjectMetrics, setSubjectMetrics] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [nextObjective, setNextObjective] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<SubjectAccuracyHistoryItem[]>([]);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [stats, plans, metrics, dbCategories, historyData, settings] = await Promise.all([
          getUserStats().catch(() => null),
          getStudyPlans().catch(() => []),
          getSubjectMetrics().catch(() => []),
          getCategories().catch(() => []),
          getSubjectPerformanceHistoryAction().catch(() => []),
          getUserSettingsAction().catch(() => null)
        ]);

        setUser(stats);
        setUserSettings(settings);
        setSubjectMetrics(metrics || []);
        setPerformanceHistory(historyData || []);

        const fetchedCategoryNames = dbCategories && dbCategories.length > 0
          ? dbCategories.map((c: any) => c.name)
          : (metrics && metrics.length > 0 ? metrics.map((m: any) => m.subject) : SUBJECT_AREAS);

        setCategories(fetchedCategoryNames);

        if (plans && plans.length > 0) {
          const today = new Date();
          const futurePlans = plans
            .filter((p: any) => new Date(p.endDate || p.targetDate || p.createdAt) >= today)
            .sort((a: any, b: any) => {
              const dateA = new Date(a.endDate || a.targetDate || a.createdAt).getTime();
              const dateB = new Date(b.endDate || b.targetDate || b.createdAt).getTime();
              return dateA - dateB;
            });

          if (futurePlans.length > 0) {
            setNextObjective(futurePlans[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load performance data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Listen for setting updates across the app
    const handleSettingsUpdated = async () => {
      const settings = await getUserSettingsAction().catch(() => null);
      if (settings) setUserSettings(settings);
    };
    window.addEventListener('bq_settings_updated', handleSettingsUpdated);

    // Refresh metrics every 30 seconds
    const metricsRefreshInterval = setInterval(async () => {
      const [metrics, historyData, settings] = await Promise.all([
        getSubjectMetrics().catch(() => []),
        getSubjectPerformanceHistoryAction().catch(() => []),
        getUserSettingsAction().catch(() => null)
      ]);
      setSubjectMetrics(metrics || []);
      if (historyData) setPerformanceHistory(historyData);
      if (settings) setUserSettings(settings);
    }, 30000);

    return () => {
      window.removeEventListener('bq_settings_updated', handleSettingsUpdated);
      clearInterval(metricsRefreshInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Build mastery data dynamically
  const activeCategories = categories.length > 0
    ? categories
    : (subjectMetrics.length > 0 ? subjectMetrics.map((m: any) => m.subject) : SUBJECT_AREAS);

  const fullMastery: SubjectMasteryItem[] = activeCategories.map(subjectName => {
    const normTarget = subjectName.trim().toLowerCase();
    const metrics = subjectMetrics.find((m: any) => 
      m.subject === subjectName || (m.subject && m.subject.trim().toLowerCase() === normTarget)
    );
    const completionVal = metrics?.completion ?? 0;
    const proficiencyVal = (metrics as any)?.proficiency ?? metrics?.mastery ?? 0;
    const totalCorrect = (metrics as any)?.totalCorrect ?? 0;
    const totalQAnswered = (metrics as any)?.totalQuestionsAnswered ?? 0;

    let status = metrics?.masteryStatus;
    if (!status || status === "Not Started") {
      if (totalQAnswered === 0 && completionVal === 0) status = "Not Started";
      else if (proficiencyVal >= 80 && totalQAnswered >= 25) status = "Mastered";
      else if (proficiencyVal >= 65 && totalQAnswered >= 15) status = "Proficient";
      else if (proficiencyVal >= 35 || totalQAnswered >= 1) status = "In Training";
      else status = "Needs Focus";
    }

    // Points earned = 25 Pts per correct question answered + 6 Pts per % completion (capped at 1200 max)
    const points = Math.min(1200, Math.round(totalCorrect * 25 + completionVal * 6));

    return {
      subject: subjectName,
      shortName: subjectName.split(' ')[0],
      radarLabel: RADAR_LABELS[subjectName] || (subjectName.length > 12 ? subjectName.split(' ')[0] : subjectName),
      completion: completionVal,
      mastery: proficiencyVal,
      status: status,
      points: points
    };
  });

  const radarData = fullMastery.map(m => ({
    subject: m.radarLabel,
    mastery: m.mastery,
    fullMark: 100
  }));

  const avgMasteryNum = fullMastery.length > 0
    ? (fullMastery.reduce((acc: number, m: any) => acc + m.mastery, 0) / fullMastery.length)
    : 0;

  const avgMastery = avgMasteryNum.toFixed(1);

  const avgCompletion = fullMastery.length > 0
    ? (fullMastery.reduce((acc: number, m: any) => acc + m.completion, 0) / fullMastery.length).toFixed(0)
    : "0";

  const masteredCount = fullMastery.filter(m => m.status === "Mastered").length;
  const daysRemaining = nextObjective
    ? differenceInDays(new Date(nextObjective.endDate || nextObjective.targetDate || nextObjective.createdAt), new Date())
    : 0;

  // Total Points Calculation
  const totalEarnedPoints = fullMastery.reduce((acc, m) => acc + (m.points || 0), 0) + (user?.xp || 0);
  const totalQuestionsAttempted = performanceHistory.reduce((acc, p) => acc + p.totalQuestions, 0) || 0;

  return (
    <div className="max-w-6xl mx-auto py-5 sm:py-8 lg:py-10 px-3 sm:px-4 lg:px-6 space-y-6 sm:space-y-8 pb-24 lg:pb-12">
      
      {/* 1. Executive Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-widest text-primary border-primary/30">
            Student Score Analytics
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-headline tracking-tight leading-tight uppercase">
          Performance <span className="text-primary">Mastery</span>
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm lg:text-base font-medium">
          Real-time academic score analytics, technical subject metrics, and mission objectives.
        </p>
      </header>

      {/* 2. Hero Pointing System Strip */}
      <StudentPointingCard
        totalPoints={totalEarnedPoints}
        avgProficiency={avgMasteryNum}
        avgCompletion={parseFloat(avgCompletion)}
        masteredCount={masteredCount}
        totalSubjects={fullMastery.length}
        subjects={fullMastery}
        userName={user?.name}
        onOpenScorecard={() => setScorecardOpen(true)}
      />

      {/* 3. Section I: Full-Width AI Diagnostic & Remediation Prescription Card */}
      <section id="ai-diagnostic-prescription">
        <AiDiagnosticPrescription
          avgMastery={avgMasteryNum}
          avgCompletion={parseFloat(avgCompletion)}
          fullMastery={fullMastery}
          nextObjective={nextObjective}
          userSettings={userSettings}
          onNavigateToStudy={(subjectName) => {
            if (subjectName) {
              router.push(`/study?subject=${encodeURIComponent(subjectName)}`);
            } else {
              router.push('/study');
            }
          }}
          onNavigateToQuest={(subjectName) => {
            if (subjectName) {
              router.push(`/quest?subject=${encodeURIComponent(subjectName)}`);
            } else {
              router.push('/quest');
            }
          }}
          onOpenGoalSettings={() => router.push('/profile?openSettings=true&tab=goals')}
        />
      </section>

      {/* 4. Section II: Subject Technical Breakdown Grid (Dual Progress Bars: Completion & Mastery) */}
      <section id="subject-technical-breakdown">
        <SubjectTechnicalBreakdown
          items={fullMastery}
          onSelectSubject={(subjectName) => {
            router.push(`/study?subject=${encodeURIComponent(subjectName)}`);
          }}
        />
      </section>

      {/* 5. Section III: Competency Diagnostics & Active Objectives */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        
        {/* Left 2-Column: Visual Analytics Tabbed Hub (Radar + Quest History) */}
        <div className="lg:col-span-2">
          <Card className="border border-border shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden bg-background">
            <Tabs defaultValue="radar" className="w-full">
              <CardHeader className="bg-muted/30 border-b border-border p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg sm:text-xl font-bold font-headline text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Competency Analytics
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Multidimensional skill mapping and quest accuracy history.
                  </CardDescription>
                </div>

                <TabsList className="bg-muted p-1 rounded-xl shrink-0 self-start sm:self-auto">
                  <TabsTrigger value="radar" className="text-xs font-bold rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Proficiency Radar
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs font-bold rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Accuracy History
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              {/* Tab 1: Radar Chart */}
              <TabsContent value="radar" className="p-4 sm:p-8 m-0">
                <div className="h-[340px] sm:h-[400px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius={115} data={radarData}>
                      <PolarGrid stroke="currentColor" strokeWidth={1} className="text-muted-foreground/25" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                          fill: 'currentColor',
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "'Poppins', sans-serif"
                        }}
                        className="text-muted-foreground"
                        tickLine={false}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                        className="text-muted-foreground/20"
                      />
                      <Radar
                        name="Mastery"
                        dataKey="mastery"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.45}
                        isAnimationActive={true}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* Tab 2: Quest Accuracy History Bar Chart */}
              <TabsContent value="history" className="p-4 sm:p-8 m-0">
                {performanceHistory.some(p => p.attemptCount > 0 || p.avgAccuracy > 0) ? (
                  <div className="space-y-4">
                    <div className="h-[300px] sm:h-[340px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                          <XAxis
                            dataKey="subject"
                            tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 500 }}
                            className="text-muted-foreground"
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fill: 'currentColor', fontSize: 11 }}
                            className="text-muted-foreground"
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                  <div className="bg-popover border border-border rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[170px]">
                                    <p className="font-bold text-foreground font-headline border-b border-border/50 pb-1">
                                      {item.fullSubjectName || item.subject}
                                    </p>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                      <span>Average Accuracy:</span>
                                      <span className="font-black text-primary font-mono text-sm">{item.avgAccuracy}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                                      <span>Quests / Nodes:</span>
                                      <span className="font-bold text-foreground">{item.attemptCount} completed</span>
                                    </div>
                                    {item.totalQuestions > 0 && (
                                      <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                                        <span>Total Questions:</span>
                                        <span className="font-bold text-foreground">{item.totalQuestions} Qs</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="avgAccuracy"
                            fill="hsl(var(--primary))"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={52}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Summary Footer */}
                    <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        <span>Aggregated from all completed Chapter Quests & Mock Exams</span>
                      </span>
                      <span className="font-semibold text-foreground">
                        Total Recorded Runs: <strong className="text-primary">{performanceHistory.reduce((acc, p) => acc + p.attemptCount, 0)}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[320px] sm:h-[360px] w-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-muted-foreground">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <p className="text-sm font-bold text-foreground">No quest attempt history logged yet</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Complete chapter nodes or boss battles in Quest Arena to populate your historical discipline accuracy chart.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right 1-Column: Active Mission Objective Milestone */}
        <div className="space-y-6">
          <Card className="border-2 border-border shadow-sm rounded-2xl bg-background p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Active Mission Objective
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary shrink-0">
                Curriculum Milestone
              </Badge>
            </div>

            {nextObjective ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Focus Subject</p>
                  <h4 className="text-base sm:text-lg font-bold text-foreground leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {nextObjective.subject}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">Target Date</span>
                    <span className="font-bold text-primary flex items-center gap-1 mt-0.5">
                      <CalendarIcon className="w-3 h-3 shrink-0" />
                      {format(new Date(nextObjective.endDate || nextObjective.targetDate || nextObjective.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">Time Left</span>
                    <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-primary shrink-0" />
                      {Math.max(0, daysRemaining)} Days
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-muted-foreground">Mastery Level</span>
                    <span className="text-primary">
                      {fullMastery.find((m: any) => m.subject === nextObjective.subject)?.mastery || 0}%
                    </span>
                  </div>
                  <Progress
                    value={fullMastery.find((m: any) => m.subject === nextObjective.subject)?.mastery || 0}
                    className="h-2 rounded-full"
                  />
                </div>

                <Link href={`/study?subject=${encodeURIComponent(nextObjective.subject)}`} className="block">
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
        </div>
      </section>

      {/* Printable Scorecard Modal */}
      <PointScorecardModal
        open={scorecardOpen}
        onOpenChange={setScorecardOpen}
        totalPoints={totalEarnedPoints}
        avgAccuracy={avgMasteryNum}
        totalQuestions={totalQuestionsAttempted}
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
            classString: 'Aspirant'
          }}
          onProfileUpdated={(updated) => {
            if (updated) setUser((prev: any) => ({ ...prev, ...updated }));
          }}
        />
      )}
    </div>
  );
}

export default function PerformancePage() {
  return (
    <ProtectedRoute>
      <PerformanceContent />
    </ProtectedRoute>
  );
}
