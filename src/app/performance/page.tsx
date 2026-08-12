
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  TrendingUp, Target, Award, FlaskConical, Microscope, Database, Stethoscope, ShieldAlert, Sparkles, Loader2, Clock, Calendar as CalendarIcon,
  Zap, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserStats } from '@/app/actions/user';
import { getStudyPlans } from '@/app/actions/study-plan';
import { getSubjectMetrics, getCategories } from '@/app/actions/study';
import { SUBJECT_AREAS } from '@/lib/game-logic';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

const ICON_MAP: Record<string, any> = {
  "Clinical Chemistry": FlaskConical,
  "Hematology": Microscope,
  "Microbiology": Database,
  "Immunology & Serology and Immunohematology": Stethoscope,
  "Clinical Microscopy & Parasitology": FlaskConical,
  "Histopathology & MT Laws": ShieldAlert,
  "Histopathology and Medtech Laws": ShieldAlert
};

const RADAR_LABELS: Record<string, string> = {
  "Clinical Chemistry": "Chemistry",
  "Hematology": "Hematology",
  "Microbiology": "Microbiology",
  "Immunology & Serology and Immunohematology": "Immunochem",
  "Clinical Microscopy & Parasitology": "Microscopy",
  "Histopathology & MT Laws": "Histopath",
  "Histopathology and Medtech Laws": "Histopath"
};

function getSubjectIcon(subject: string) {
  if (ICON_MAP[subject]) return ICON_MAP[subject];
  const lower = subject.toLowerCase();
  if (lower.includes('chem')) return FlaskConical;
  if (lower.includes('hemat')) return Microscope;
  if (lower.includes('microb')) return Database;
  if (lower.includes('immuno') || lower.includes('serolog')) return Stethoscope;
  if (lower.includes('microscop') || lower.includes('parasit')) return FlaskConical;
  if (lower.includes('histo') || lower.includes('law')) return ShieldAlert;
  return Database;
}

const STATUS_COLORS: Record<string, string> = {
  "Mastered": "bg-green-100 text-green-700 border-green-300",
  "Proficient": "bg-blue-100 text-blue-700 border-blue-300",
  "In Training": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "Not Started": "bg-secondary text-foreground border-slate-300"
};

const STATUS_INDICATORS: Record<string, any> = {
  "Mastered": <CheckCircle2 className="w-4 h-4" />,
  "Proficient": <TrendingUp className="w-4 h-4" />,
  "In Training": <Loader2 className="w-4 h-4" />,
  "Not Started": <AlertCircle className="w-4 h-4" />
};

function PerformanceContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subjectMetrics, setSubjectMetrics] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [nextObjective, setNextObjective] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [stats, plans, metrics, dbCategories] = await Promise.all([
          getUserStats(),
          getStudyPlans(),
          getSubjectMetrics(),
          getCategories()
        ]);

        setUser(stats);
        setSubjectMetrics(metrics || []);

        const fetchedCategoryNames = dbCategories && dbCategories.length > 0
          ? dbCategories.map((c: any) => c.name)
          : (metrics && metrics.length > 0 ? metrics.map((m: any) => m.subject) : SUBJECT_AREAS);

        setCategories(fetchedCategoryNames);

        // Process performance history from achievements
        if (stats?.achievements) {
          const performanceData = fetchedCategoryNames.map((subject: string) => {
            const subjectAchievements = stats.achievements.filter((a: any) => a.type === 'quest_completion' && a.subject === subject);
            const accuracyScores = subjectAchievements
              .filter((a: any) => a.accuracy)
              .map((a: any) => a.accuracy);

            return {
              subject: RADAR_LABELS[subject] || (subject.length > 12 ? subject.split(' ')[0] : subject),
              avgAccuracy: accuracyScores.length > 0
                ? Math.round(accuracyScores.reduce((a: number, b: number) => a + b, 0) / accuracyScores.length)
                : 0,
              attemptCount: subjectAchievements.length
            };
          });
          setPerformanceHistory(performanceData);
        }

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
      const metrics = await getSubjectMetrics();
      setSubjectMetrics(metrics || []);
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
    <div className="max-w-6xl mx-auto py-8 lg:py-12 px-4 lg:px-6 space-y-8 lg:space-y-4 pb-24 lg:pb-12">
      <header className="space-y-0">
        <h1 className="text-3xl lg:text-4xl font-black font-headline tracking-tight leading-tight uppercase">Technical <span className="text-primary">Mastery</span></h1>
        <p className="text-muted-foreground text-sm lg:text-lg font-medium">Real-time analytics and mission objectives for your licensure expedition.</p>
      </header>

      {/* Summary Stats */}
      <div id="tour-perf-overview" className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border border-border shadow-md rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-primary/60">Avg Mastery</p>
            <p className="text-3xl font-black text-primary">{avgMastery}%</p>
          </div>
        </Card>
        <Card className="border border-border shadow-md rounded-xl bg-gradient-to-br from-blue-100/40 to-blue-50 dark:from-blue-950/40 dark:to-blue-900/20 p-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-blue-700/60 dark:text-blue-400/60">Completion</p>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{avgCompletion}%</p>
          </div>
        </Card>
        <Card className="border border-border shadow-md rounded-xl bg-gradient-to-br from-green-100/40 to-green-50 dark:from-green-950/40 dark:to-green-900/20 p-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-green-700/60 dark:text-green-400/60">Mastered</p>
            <p className="text-3xl font-black text-green-700 dark:text-green-400">{masteredCount}/{fullMastery.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar Chart */}
        <Card id="tour-perf-radar" className="lg:col-span-2 border border-border shadow-xl rounded-[2rem] overflow-hidden bg-background">
          <CardHeader className="bg-muted border-b px-8 py-6">
            <CardTitle className="font-black text-3xl tracking-tight text-foreground">
              Proficiency Radar
            </CardTitle>
            <CardDescription className="text-xs font-black uppercase tracking-widest text-primary mt-3">
              Target Mission Competency
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12 bg-background">
            <div className="h-[450px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  data={radarData}
                >
                  <PolarGrid
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-muted-foreground/30"
                  />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: 'currentColor',
                      fontSize: 13,
                      fontWeight: 500,
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
          </CardContent>
        </Card>

        {/* Active Objectives */}
        <div className="space-y-6">
          <Card className="border border-border shadow-xl rounded-[2rem] bg-background p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              <Target className="w-24 h-24 text-primary" />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground/90">Dailies / Objectives</h3>
              </div>

              {nextObjective ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Active Objective</p>
                    <p className="text-xl font-black font-headline text-foreground leading-tight">{nextObjective.subject}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Target Date</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(nextObjective.targetDate), "MMM dd")}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Days Left</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Clock className="w-3 h-3 text-primary" />
                        {Math.max(0, daysRemaining)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Objective Progress</p>
                        <div className="flex justify-between items-center text-[9px] font-bold mb-1">
                          <span className="text-foreground">
                            {daysRemaining <= 0
                              ? "Deadline Reached"
                              : daysRemaining === 1
                              ? "1 day remaining"
                              : `${daysRemaining} days remaining`}
                          </span>
                          <span className={cn(
                            daysRemaining <= 3 ? "text-red-600" :
                            daysRemaining <= 7 ? "text-yellow-600" :
                            "text-green-600"
                          )}>
                            {daysRemaining <= 0 ? "Critical" : daysRemaining <= 3 ? "Urgent" : daysRemaining <= 7 ? "On Track" : "Comfortable"}
                          </span>
                        </div>
                        <Progress
                          value={Math.max(0, Math.min(100, 100 - (daysRemaining * 5)))}
                          className="h-2 bg-secondary"
                        />
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Subject Mastery</p>
                        <div className="flex justify-between items-center text-[9px] font-bold mb-1">
                          <span className="text-foreground">
                            {fullMastery.find((m: any) => m.subject === nextObjective.subject)?.mastery || 0}% Mastery
                          </span>
                          <span className="text-primary">
                            {fullMastery.find((m: any) => m.subject === nextObjective.subject)?.status || "Not Started"}
                          </span>
                        </div>
                        <Progress
                          value={fullMastery.find((m: any) => m.subject === nextObjective.subject)?.mastery || 0}
                          className="h-2 bg-secondary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <Target className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                  <p className="text-xs font-medium text-muted-foreground italic">No objectives deployed. Visit the Study Curriculum to set your mission targets.</p>
                </div>
              )}
            </div>
          </Card>

          {/* AI Insight */}
          <Card className="border border-border shadow-xl rounded-[2rem] bg-background p-6">
            <h3 className="font-black font-semibold text-lg flex items-center gap-2 uppercase tracking-tight">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Insight
            </h3>
            <p className="text-sm font-semibold text-muted-foreground italic leading-relaxed mt-2">
              {parseFloat(avgMastery) >= 85
                ? "🎯 Exceptional performance! You're on track for board certification. Maintain this momentum!"
                : parseFloat(avgMastery) >= 60
                ? "📈 Solid progress! Focus on weaker areas to reach mastery level."
                : "⚠️ Increase study intensity. Prioritize your active objectives to accelerate mastery growth."}
            </p>
          </Card>
        </div>
      </div>

      {/* Performance History Chart */}
      {performanceHistory.some(p => p.attemptCount > 0) && (
        <Card className="border border-border shadow-lg rounded-[2rem] bg-background overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-6">
            <CardTitle className="font-headline text-lg font-semibold tracking-wide flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quest Performance History
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Average accuracy across quest attempts by subject.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
                  <XAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fill: 'currentColor' }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--popover-foreground))', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}
                    formatter={(value) => `${value}%`}
                  />
                  <Bar dataKey="avgAccuracy" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Breakdown */}
      <section id="tour-perf-subjects" className="space-y-6">
        <h2 className="text-2xl font-black font-headline flex items-center gap-3 uppercase tracking-tight">
          <Award className="w-6 h-6 text-primary" />
          Technical Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fullMastery.map((item: any) => {
            const Icon = getSubjectIcon(item.subject);
            return (
              <Card
                key={item.subject}
                className={cn(
                  "border-none shadow-md rounded-[2rem] bg-background border-t-4 p-6 space-y-4 hover:shadow-lg transition-all group",
                  `border-t-${item.status === "Mastered" ? "green" : item.status === "Proficient" ? "blue" : item.status === "In Training" ? "yellow" : "slate"}-400`
                )}
              >
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-3 rounded-2xl group-hover:text-white transition-colors",
                    item.status === "Mastered" ? "bg-green-100 text-green-700 group-hover:bg-green-600" :
                    item.status === "Proficient" ? "bg-blue-100 text-blue-700 group-hover:bg-blue-600" :
                    item.status === "In Training" ? "bg-yellow-100 text-yellow-700 group-hover:bg-yellow-600" :
                    "bg-secondary text-foreground group-hover:bg-slate-600"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge className={cn("text-[9px] font-semibold uppercase", STATUS_COLORS[item.status])}>
                    {item.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-tight truncate text-foreground">{item.subject}</h4>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Completion</p>
                      <p className="text-2xl font-bold text-blue-600">{item.completion}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Mastery</p>
                      <p className="text-2xl font-bold text-primary">{item.mastery}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Lessons</span>
                      <span className="text-[9px] font-bold text-primary">{item.completion}%</span>
                    </div>
                    <Progress value={item.completion} className="h-1 bg-secondary" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Quests</span>
                      <span className="text-[9px] font-bold text-primary">{item.mastery}%</span>
                    </div>
                    <Progress value={item.mastery} className="h-1 bg-secondary" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
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

