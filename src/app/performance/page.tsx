"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  TrendingUp, Target, Award, Sparkles, Loader2, Clock, Calendar as CalendarIcon,
  Zap, BookOpen, GraduationCap, ShieldCheck, BarChart3, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserStats } from '@/app/actions/user';
import { getStudyPlans } from '@/app/actions/study-plan';
import { getSubjectMetrics, getCategories, getSubjectPerformanceHistoryAction, type SubjectAccuracyHistoryItem } from '@/app/actions/study';
import { getMtleReadinessData } from '@/app/actions/mtle-predictor';
import { MtleReadinessResult } from '@/lib/mtle-predictor-engine';
import { MtlePredictorCard } from '@/components/performance/MtlePredictorCard';
import { MtleWhatIfSimulator } from '@/components/performance/MtleWhatIfSimulator';
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
  const [subjectMetrics, setSubjectMetrics] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [nextObjective, setNextObjective] = useState<any>(null);
  const [mtleData, setMtleData] = useState<MtleReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<SubjectAccuracyHistoryItem[]>([]);

  const scrollToSimulator = () => {
    document.getElementById('what-if-simulator')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [stats, plans, metrics, dbCategories, mtleRes, historyData] = await Promise.all([
          getUserStats().catch(() => null),
          getStudyPlans().catch(() => []),
          getSubjectMetrics().catch(() => []),
          getCategories().catch(() => []),
          getMtleReadinessData().catch(() => null),
          getSubjectPerformanceHistoryAction().catch(() => [])
        ]);

        setUser(stats);
        setSubjectMetrics(metrics || []);
        setMtleData(mtleRes);
        setPerformanceHistory(historyData || []);

        const fetchedCategoryNames = dbCategories && dbCategories.length > 0
          ? dbCategories.map((c: any) => c.name)
          : (metrics && metrics.length > 0 ? metrics.map((m: any) => m.subject) : SUBJECT_AREAS);

        setCategories(fetchedCategoryNames);

        if (plans && plans.length > 0) {
          const today = new Date();
          const futurePlans = plans
            .filter((p: any) => new Date(p.targetDate) >= today)
            .sort((a: any, b: any) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

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

    // Refresh metrics every 30 seconds to keep them in sync across pages
    const metricsRefreshInterval = setInterval(async () => {
      const [metrics, mtleRes, historyData] = await Promise.all([
        getSubjectMetrics().catch(() => []),
        getMtleReadinessData().catch(() => null),
        getSubjectPerformanceHistoryAction().catch(() => [])
      ]);
      setSubjectMetrics(metrics || []);
      if (mtleRes) setMtleData(mtleRes);
      if (historyData) setPerformanceHistory(historyData);
    }, 30000);

    return () => clearInterval(metricsRefreshInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Build mastery data dynamically with real metrics fetched from MongoDB Category collection
  const activeCategories = categories.length > 0
    ? categories
    : (subjectMetrics.length > 0 ? subjectMetrics.map((m: any) => m.subject) : SUBJECT_AREAS);

  const fullMastery = activeCategories.map(subjectName => {
    const metrics = subjectMetrics.find((m: any) => m.subject === subjectName);
    return {
      subject: subjectName,
      shortName: subjectName.split(' ')[0],
      radarLabel: RADAR_LABELS[subjectName] || (subjectName.length > 12 ? subjectName.split(' ')[0] : subjectName),
      completion: metrics?.completion || 0,
      mastery: metrics?.mastery || 0,
      status: metrics?.masteryStatus || "Not Started",
      fullMark: 100
    };
  });

  const radarData = fullMastery.map(m => ({
    subject: m.radarLabel,
    mastery: m.mastery,
    fullMark: 100
  }));

  const avgMastery = fullMastery.length > 0
    ? (fullMastery.reduce((acc: number, m: any) => acc + m.mastery, 0) / fullMastery.length).toFixed(1)
    : "0.0";

  const avgCompletion = fullMastery.length > 0
    ? (fullMastery.reduce((acc: number, m: any) => acc + m.completion, 0) / fullMastery.length).toFixed(0)
    : "0";

  const masteredCount = fullMastery.filter(m => m.status === "Mastered").length;
  const daysRemaining = nextObjective
    ? differenceInDays(new Date(nextObjective.targetDate), new Date())
    : 0;

  return (
    <div className="max-w-6xl mx-auto py-5 sm:py-8 lg:py-10 px-3 sm:px-4 lg:px-6 space-y-6 sm:space-y-8 pb-24 lg:pb-12">
      
      {/* 1. Executive Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-widest text-primary border-primary/30">
            PRC Licensure Expedition
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-headline tracking-tight leading-tight uppercase">
          Performance <span className="text-primary">Mastery</span>
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm lg:text-base font-medium">
          Real-time MTLE licensure forecasting, statutory subject analytics, and mission objectives.
        </p>
      </header>

      {/* 2. Executive KPI Overview Strip */}
      <div id="tour-perf-overview" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Metric 1: Predicted GWA */}
        <Card className="border border-border shadow-sm rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3.5 sm:p-4">
          <div className="space-y-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              Predicted GWA
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-primary font-headline">
                {mtleData ? mtleData.predictedGwa.toFixed(1) : avgMastery}%
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium block truncate">
              {mtleData ? mtleData.statusTitle : "Pass Target: 75%"}
            </span>
          </div>
        </Card>

        {/* Metric 2: Syllabus Completion */}
        <Card className="border border-border shadow-sm rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-3.5 sm:p-4">
          <div className="space-y-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Syllabus Coverage
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-headline">
                {avgCompletion}%
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium block truncate">
              Core Modules Done
            </span>
          </div>
        </Card>

        {/* Metric 3: Average Mastery */}
        <Card className="border border-border shadow-sm rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3.5 sm:p-4">
          <div className="space-y-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Quest Mastery
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-headline">
                {avgMastery}%
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium block truncate">
              Attempt Accuracy
            </span>
          </div>
        </Card>

        {/* Metric 4: Mastered Subjects */}
        <Card className="border border-border shadow-sm rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-3.5 sm:p-4">
          <div className="space-y-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Disciplines Mastered
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-headline">
                {masteredCount}
              </span>
              <span className="text-xs text-muted-foreground font-bold">/ {fullMastery.length} Subjects</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium block truncate">
              {masteredCount >= 6 ? "All Disciplines Ready" : `${6 - masteredCount} In Training`}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Section I: MTLE Board Rating & Statutory Readiness (Hero Module) */}
      {mtleData && (
        <section id="mtle-readiness-predictor" className="space-y-2">
          <MtlePredictorCard
            data={mtleData}
            userName={user?.name}
            onScrollToSimulator={scrollToSimulator}
          />
        </section>
      )}

      {/* 4. Section II: Competency Diagnostics & Examination Objectives (2-Column Grid) */}
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

        {/* Right 1-Column: Active Objectives & AI Diagnostic Insight */}
        <div className="space-y-6">
          
          {/* Active Objective Milestone */}
          <Card className="border border-border shadow-xl rounded-2xl sm:rounded-3xl bg-background p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Active Mission Objective
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                Curriculum Milestone
              </Badge>
            </div>

            {nextObjective ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-primary/70">Focus Subject</p>
                  <h4 className="text-lg font-black font-headline text-foreground leading-tight">
                    {nextObjective.subject}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">Target Date</span>
                    <span className="font-bold text-primary flex items-center gap-1 mt-0.5">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(nextObjective.targetDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground block">Time Left</span>
                    <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-primary" />
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
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <Target className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs font-medium text-muted-foreground">
                  No active objective scheduled. Visit Study Curriculum to deploy target milestones.
                </p>
              </div>
            )}
          </Card>

          {/* AI Study Prescription */}
          <Card className="border border-border shadow-xl rounded-2xl sm:rounded-3xl bg-background p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                AI Diagnostic Prescription
              </h3>
            </div>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {parseFloat(avgMastery) >= 85
                ? "🎯 Exceptional mastery! You are performing in the top percentile. Reinforce retention with daily rapid-fire quizzes."
                : parseFloat(avgMastery) >= 60
                ? "📈 Strong foundation! Direct your study quota toward your lowest-weighted subject to push your overall GWA beyond 75%."
                : "⚠️ Critical intervention: Focus intensely on high-yield 20% weight subjects (Clinical Chemistry & Microbiology) to quickly bridge your score deficit."}
            </p>
          </Card>
        </div>
      </section>

      {/* 5. Section III: Interactive "What-If" Scenario Simulator */}
      {mtleData && (
        <section id="what-if-simulator" className="scroll-mt-6">
          <MtleWhatIfSimulator
            subjects={mtleData.subjects}
            currentGwa={mtleData.predictedGwa}
          />
        </section>
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
