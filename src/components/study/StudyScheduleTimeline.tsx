"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addDays,
  startOfDay,
  differenceInCalendarDays,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  Sword,
  CalendarDays,
  Layers,
  Pencil,
  BookOpen,
  Target,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ScheduleBlockModal,
  resolveSubjectMeta,
  type SubjectMetaConfig,
  type SubjectOption,
} from '@/components/study/ScheduleBlockModal';
import { calculateRemainingTime } from '@/lib/study-timer';
import { getCategories } from '@/app/actions/study';
import type { ReviewCenterProgramData } from '@/app/actions/study-plan';
import { useToast } from '@/hooks/use-toast';

export interface StudyPlanRecord {
  id: string;
  userId: string;
  subject: string;
  startDate: string;
  endDate: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  goal?: string;
  targetQuestions?: number;
  targetAccuracy?: number;
  notes?: string;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface StudyScheduleTimelineProps {
  initialPlans: StudyPlanRecord[];
  program: ReviewCenterProgramData | null;
  availableSubjects?: SubjectOption[];
  subjectMetrics?: any[];
  onRefreshPlans?: () => Promise<void>;
  onSelectSubjectInCurriculum?: (subjectTitle: string) => void;
}

export function findSubjectMetric(subjectName: string, metrics: any[]): any | undefined {
  if (!subjectName || !Array.isArray(metrics)) return undefined;
  const target = subjectName.trim().toLowerCase();
  return metrics.find((m: any) => {
    const s = (m.subject || m.name || '').trim().toLowerCase();
    if (s === target) return true;
    if (target.includes('chem') && s.includes('chem')) return true;
    if (target.includes('micro') && s.includes('micro')) return true;
    if (target.includes('hema') && s.includes('hema') && !target.includes('immuno') && !s.includes('immuno')) return true;
    if ((target.includes('immuno') || target.includes('serology')) && (s.includes('immuno') || s.includes('serology'))) return true;
    if ((target.includes('microscopy') || target.includes('parasit')) && (s.includes('microscopy') || s.includes('parasit'))) return true;
    if ((target.includes('histo') || target.includes('law')) && (s.includes('histo') || s.includes('law'))) return true;
    return false;
  });
}

export function StudyScheduleTimeline({
  initialPlans = [],
  program,
  availableSubjects,
  subjectMetrics = [],
  onRefreshPlans,
  onSelectSubjectInCurriculum,
}: StudyScheduleTimelineProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<StudyPlanRecord[]>(initialPlans);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'roadmap'>('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<StudyPlanRecord | null>(null);
  const [selectedSubjectForModal, setSelectedSubjectForModal] = useState<string | undefined>(undefined);
  const [clickedDateForSchedule, setClickedDateForSchedule] = useState<Date | undefined>(undefined);

  const [subjects, setSubjects] = useState<SubjectOption[]>(availableSubjects || []);

  useEffect(() => {
    if (availableSubjects && availableSubjects.length > 0) {
      setSubjects(availableSubjects);
      return;
    }
    let isMounted = true;
    getCategories()
      .then((cats) => {
        if (isMounted && cats && Array.isArray(cats)) {
          setSubjects(cats);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories in StudyScheduleTimeline:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [availableSubjects]);

  const availableSubjectMetas: SubjectMetaConfig[] = useMemo(() => {
    return subjects.map((s) => resolveSubjectMeta(s));
  }, [subjects]);

  // Sync internal plans when initialPlans prop changes
  React.useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  const institutionalDeadline = useMemo(() => {
    return program?.endDate ? new Date(program.endDate) : null;
  }, [program]);

  // Map of plans by subject
  const planBySubject = useMemo(() => {
    const map = new Map<string, StudyPlanRecord>();
    plans.forEach((p) => {
      map.set(p.subject, p);
    });
    return map;
  }, [plans]);

  // Current active subject block (if today is within its range)
  const activeFocusPlan = useMemo(() => {
    const today = startOfDay(new Date());
    return plans.find((p) => {
      try {
        const start = startOfDay(new Date(p.startDate));
        const end = startOfDay(new Date(p.endDate));
        return isWithinInterval(today, { start, end });
      } catch {
        return false;
      }
    });
  }, [plans]);

  // Next upcoming subject block if no active plan today
  const upcomingFocusPlan = useMemo(() => {
    if (activeFocusPlan) return null;
    const today = startOfDay(new Date());
    const futurePlans = plans
      .filter((p) => {
        try {
          return startOfDay(new Date(p.startDate)) > today;
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return futurePlans[0] || null;
  }, [activeFocusPlan, plans]);

  // Live timer tick for accurate, real-time countdown updates
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Progressive countdown for active study block
  const focusPlanRemaining = useMemo(() => {
    if (!activeFocusPlan) return null;
    return calculateRemainingTime(activeFocusPlan.endDate, currentTime);
  }, [activeFocusPlan, currentTime]);

  // Effective Institutional Target Deadline
  const effectiveDeadlineEndDate = useMemo(() => {
    return program?.endDate || new Date(2026, 10, 30, 23, 59, 59).toISOString();
  }, [program?.endDate]);

  const effectiveDeadlineStartDate = useMemo(() => {
    return program?.startDate || new Date(2026, 9, 1, 0, 0, 0).toISOString();
  }, [program?.startDate]);

  // Progressive countdown for institutional final deadline (always calculated and reactive)
  const institutionalRemaining = useMemo(() => {
    return calculateRemainingTime(effectiveDeadlineEndDate, currentTime);
  }, [effectiveDeadlineEndDate, currentTime]);

  // Horizon Progress % (from startDate to endDate)
  const institutionalHorizonPercent = useMemo(() => {
    try {
      const startMs = new Date(effectiveDeadlineStartDate).getTime();
      const endMs = new Date(effectiveDeadlineEndDate).getTime();
      const currentMs = currentTime.getTime();
      if (endMs <= startMs) return 100;
      const elapsed = currentMs - startMs;
      const total = endMs - startMs;
      return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    } catch {
      return 50;
    }
  }, [effectiveDeadlineStartDate, effectiveDeadlineEndDate, currentTime]);

  // Dynamic Schedule Alignment vs Institutional Target Deadline
  const scheduleAlignment = useMemo(() => {
    if (plans.length === 0) {
      return {
        bufferDays: institutionalRemaining?.calendarDays ?? 30,
        isOnTrack: true,
        message: 'No study schedule set yet',
        subtext: 'Finish all review before this date',
      };
    }

    let latestEndDate = new Date(plans[0].endDate);
    for (const p of plans) {
      const d = new Date(p.endDate);
      if (d > latestEndDate) {
        latestEndDate = d;
      }
    }
    const deadlineDate = new Date(effectiveDeadlineEndDate);
    const bufferDays = differenceInCalendarDays(deadlineDate, latestEndDate);
    const isOnTrack = bufferDays >= 0;

    return {
      bufferDays,
      isOnTrack,
      latestEndDate,
      message: isOnTrack
        ? `Review ends ${format(latestEndDate, 'MMM dd')} (${bufferDays} days ahead)`
        : `⚠️ Ends ${Math.abs(bufferDays)} days after deadline`,
      subtext: isOnTrack
        ? `${bufferDays} days ahead of deadline`
        : 'Please adjust your dates',
    };
  }, [plans, effectiveDeadlineEndDate, institutionalRemaining]);

  // Counts and Coverage
  const scheduledCount = plans.length;
  const totalSubjectCount = availableSubjectMetas.length;

  // Card 3: Roadmap Unscheduled Subjects & Planning Dynamics
  const unscheduledSubjects = useMemo(() => {
    const scheduledTitles = new Set(plans.map((p) => p.subject.toLowerCase()));
    return availableSubjectMetas.filter((s) => !scheduledTitles.has(s.title.toLowerCase()));
  }, [plans, availableSubjectMetas]);

  const unscheduledCount = unscheduledSubjects.length;
  const coveragePercent = totalSubjectCount > 0
    ? Math.min(100, Math.round((scheduledCount / totalSubjectCount) * 100))
    : 0;

  const nextRecommendedSubject = unscheduledSubjects[0] || null;

  const totalDailyTargetSum = useMemo(() => {
    return plans.reduce((acc, p) => acc + (p.targetQuestions || 0), 0);
  }, [plans]);

  // Active Focus Plan live quota and accuracy metrics
  const activeMetric = useMemo(() => {
    if (!activeFocusPlan) return null;
    return findSubjectMetric(activeFocusPlan.subject, subjectMetrics);
  }, [activeFocusPlan, subjectMetrics]);

  const activeTargetQuestions = activeFocusPlan?.targetQuestions || 50;
  const activeTargetAccuracy = activeFocusPlan?.targetAccuracy || 75;
  const activeQuestionsAnswered = activeMetric
    ? Number(activeMetric.totalQuestionsAnswered ?? activeMetric.questionsAnswered ?? 0)
    : 0;
  const activeAccuracy = activeMetric
    ? Math.round(
        Number(
          activeMetric.proficiency !== undefined
            ? activeMetric.proficiency
            : activeMetric.mastery ?? activeMetric.accuracy ?? 0
        )
      )
    : 0;
  const activeQuotaProgressPercent = Math.min(
    100,
    Math.round((activeQuestionsAnswered / activeTargetQuestions) * 100)
  );
  const isActiveQuotaAchieved = activeQuestionsAnswered >= activeTargetQuestions;
  const isActiveAccuracyAchieved = activeAccuracy >= activeTargetAccuracy;
  const isActiveFullyAchieved =
    isActiveQuotaAchieved && (activeQuestionsAnswered === 0 ? false : isActiveAccuracyAchieved);

  // Calendar Day Grid Computation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Helper to find plans spanning a specific date
  const getPlansForDate = (date: Date) => {
    const checkDate = startOfDay(date);
    return plans.filter((p) => {
      try {
        const start = startOfDay(new Date(p.startDate));
        const end = startOfDay(new Date(p.endDate));
        return isWithinInterval(checkDate, { start, end });
      } catch {
        return false;
      }
    });
  };

  const handleOpenAddModal = (date?: Date, subject?: string) => {
    const todayDate = startOfDay(new Date());
    const targetDate = date && startOfDay(date) >= todayDate ? date : undefined;
    setSelectedPlanForEdit(null);
    setSelectedSubjectForModal(subject);
    setClickedDateForSchedule(targetDate);
    setModalOpen(true);
  };

  const handleOpenEditModal = (plan: StudyPlanRecord) => {
    setSelectedPlanForEdit(plan);
    setSelectedSubjectForModal(plan.subject);
    setClickedDateForSchedule(undefined);
    setModalOpen(true);
  };

  const handleSavedPlan = async () => {
    if (onRefreshPlans) {
      await onRefreshPlans();
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Overview & Active Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Active Review Focus */}
        <div
          className={cn(
            "bg-card border-2 transition-all rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden",
            isActiveFullyAchieved
              ? "border-emerald-500/80 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-500/[0.02]"
              : "border-border/80 hover:border-primary/40"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Review Focus
            </span>
            {activeFocusPlan ? (
              <Badge
                className={cn(
                  "text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all",
                  focusPlanRemaining?.isExpired
                    ? isActiveQuotaAchieved
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground border-border"
                    : isActiveFullyAchieved
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse"
                    : isActiveQuotaAchieved
                    ? "bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-400"
                    : "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400"
                )}
              >
                {focusPlanRemaining?.isExpired ? (
                  isActiveQuotaAchieved ? (
                    <>
                      <Check className="w-3 h-3" /> Completed
                    </>
                  ) : (
                    'Concluded'
                  )
                ) : isActiveFullyAchieved ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Target Achieved
                  </>
                ) : isActiveQuotaAchieved ? (
                  <>
                    <Check className="w-3 h-3" /> Quota Met
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    In Progress
                  </>
                )}
              </Badge>
            ) : upcomingFocusPlan ? (
              <Badge className="bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Upcoming
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                Not Scheduled
              </Badge>
            )}
          </div>

          <div className="my-2.5">
            {activeFocusPlan ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {availableSubjectMetas.find((s) => s.title.toLowerCase() === activeFocusPlan.subject.toLowerCase())?.icon || '📚'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                    {activeFocusPlan.subject}
                  </h3>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span>
                    {format(new Date(activeFocusPlan.startDate), 'MMM dd')} –{' '}
                    {format(new Date(activeFocusPlan.endDate), 'MMM dd, yyyy')}
                  </span>
                  {focusPlanRemaining && (
                    <span
                      className={cn(
                        "text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border transition-colors",
                        focusPlanRemaining.isCritical
                          ? "bg-red-500/15 text-red-500 border-red-500/30 animate-pulse font-extrabold"
                          : focusPlanRemaining.isEndingToday
                          ? "bg-amber-500/15 text-amber-500 border-amber-500/30 font-extrabold"
                          : focusPlanRemaining.isEndingTomorrow
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : focusPlanRemaining.isExpired
                          ? "bg-muted text-muted-foreground border-border"
                          : "bg-muted/40 text-foreground/85 border-border/60"
                      )}
                    >
                      {focusPlanRemaining.isEndingToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      )}
                      {focusPlanRemaining.isCritical && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                      )}
                      {focusPlanRemaining.formatted}
                    </span>
                  )}
                </p>
                {activeFocusPlan.goal && (
                  <p className="text-[11px] text-foreground/80 font-medium italic mt-1 line-clamp-1">
                    🎯 {activeFocusPlan.goal}
                  </p>
                )}

                {/* Target Quota & Accuracy Live Tracker */}
                <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5 bg-muted/20 -mx-1 px-2.5 py-2 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                      <Target className="w-3 h-3 text-primary" />
                      Target Quota:
                    </span>
                    <span className="font-black text-foreground truncate">
                      {activeQuestionsAnswered} / {activeTargetQuestions} Qs ({activeQuotaProgressPercent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden border border-border/60 flex">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        isActiveQuotaAchieved
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.55)]"
                          : "bg-primary"
                      )}
                      style={{ width: `${activeQuotaProgressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 gap-2">
                    <span className="flex items-center gap-1 truncate">
                      ⚡ Subject Proficiency:
                      <strong
                        className={cn(
                          "font-black",
                          activeQuestionsAnswered === 0
                            ? "text-muted-foreground"
                            : isActiveAccuracyAchieved
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {activeQuestionsAnswered > 0 ? `${activeAccuracy}%` : '0%'}
                      </strong>
                    </span>
                    <span className="shrink-0 font-semibold">
                      Target: ≥{activeTargetAccuracy}%
                    </span>
                  </div>
                </div>
              </div>
            ) : upcomingFocusPlan ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {availableSubjectMetas.find((s) => s.title.toLowerCase() === upcomingFocusPlan.subject.toLowerCase())?.icon || '📚'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                    {upcomingFocusPlan.subject}
                  </h3>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5 truncate">
                  Starts {format(new Date(upcomingFocusPlan.startDate), 'MMMM dd, yyyy')}
                </p>

                {/* Upcoming Plan Tracker */}
                <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5 bg-muted/20 -mx-1 px-2.5 py-2 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-primary" />
                      Next Review Block:
                    </span>
                    <span className="font-black text-foreground truncate">
                      {differenceInCalendarDays(new Date(upcomingFocusPlan.startDate), currentTime)} Days Until Start
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden border border-border/60 flex">
                    <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full w-full" />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 gap-2">
                    <span className="flex items-center gap-1 truncate text-muted-foreground">
                      Planned: {format(new Date(upcomingFocusPlan.startDate), 'MMM dd')} – {format(new Date(upcomingFocusPlan.endDate), 'MMM dd')}
                    </span>
                    <span className="shrink-0 font-semibold text-foreground">
                      {upcomingFocusPlan.targetQuestions || 50} Qs / day
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                    No Active Review Today
                  </h3>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5 truncate">
                  Set your review dates to track your daily question targets
                </p>

                {/* Getting Started Tracker Box */}
                <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5 bg-muted/20 -mx-1 px-2.5 py-2 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                      <Target className="w-3 h-3 text-primary" />
                      Daily Review Goal:
                    </span>
                    <span className="font-semibold text-muted-foreground truncate">
                      Not set yet
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden border border-border/60 flex">
                    <div className="h-full bg-muted-foreground/15 rounded-full w-full" />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 gap-2">
                    <span className="flex items-center gap-1 truncate text-muted-foreground">
                      👉 Tap Schedule Now to pick your first subject
                    </span>
                    <span className="shrink-0 font-semibold text-primary">
                      Target: ≥75%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Coverage: {scheduledCount} / {totalSubjectCount} Subjects Scheduled
            </span>
            {activeFocusPlan ? (
              <button
                type="button"
                onClick={() => handleOpenEditModal(activeFocusPlan)}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Modify Block →
              </button>
            ) : upcomingFocusPlan ? (
              <button
                type="button"
                onClick={() => handleOpenEditModal(upcomingFocusPlan)}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                View Block →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenAddModal(undefined, nextRecommendedSubject?.title)}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Schedule Now →
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Institutional Final Deadline */}
        <div className="bg-card border-2 border-border/80 hover:border-primary/40 transition-all rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Institutional Target Deadline
            </span>
            {institutionalRemaining && (
              <Badge
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wider transition-colors shrink-0",
                  institutionalRemaining.isCritical
                    ? "bg-red-500/15 text-red-500 border-red-500/30 animate-pulse font-extrabold"
                    : institutionalRemaining.isEndingToday
                    ? "bg-amber-500/15 text-amber-500 border-amber-500/30 font-extrabold"
                    : institutionalRemaining.isEndingTomorrow
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : institutionalRemaining.isExpired
                    ? "bg-muted text-muted-foreground border-border"
                    : "bg-primary/10 border-primary/20 text-primary"
                )}
              >
                {institutionalRemaining.isEndingToday
                  ? `Due Today (${institutionalRemaining.short})`
                  : institutionalRemaining.isEndingTomorrow
                  ? 'Ends Tomorrow'
                  : institutionalRemaining.isExpired
                  ? 'Expired'
                  : `${institutionalRemaining.calendarDays} Days Left`}
              </Badge>
            )}
          </div>

          <div className="my-2.5">
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {format(new Date(effectiveDeadlineEndDate), 'MMMM dd, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5 truncate">
                {program?.companyName || 'SWU PHINMA'} • Final Review Deadline
              </p>
            </div>

            {/* Target Horizon & Schedule Alignment Tracker */}
            <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5 bg-muted/20 -mx-1 px-2.5 py-2 rounded-xl border border-border/50">
              <div className="flex items-center justify-between text-[11px] gap-2">
                <span className="font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-primary" />
                  Time Remaining:
                </span>
                <span className="font-black text-foreground truncate">
                  {institutionalRemaining?.isExpired
                    ? 'Deadline Passed'
                    : `${institutionalRemaining?.calendarDays || 0} Days Left`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden border border-border/60 flex">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    institutionalRemaining?.isExpired
                      ? "bg-muted-foreground"
                      : institutionalRemaining?.isCritical
                      ? "bg-red-500 animate-pulse"
                      : "bg-gradient-to-r from-primary via-indigo-500 to-emerald-500"
                  )}
                  style={{ width: `${institutionalHorizonPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 gap-2">
                <span className="flex items-center gap-1 truncate">
                  {scheduleAlignment.isOnTrack ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      {scheduleAlignment.message}
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold flex items-center gap-1 truncate">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {scheduleAlignment.message}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-semibold">
                  {scheduleAlignment.isOnTrack ? '✓ On Track' : 'Needs Review'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
              Finish all review before this date
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              On Track
            </span>
          </div>
        </div>

        {/* Card 3: Study Roadmap Actions */}
        <div className="bg-gradient-to-br from-card via-card to-primary/5 border-2 border-border/80 hover:border-primary/40 transition-all rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Study Roadmap Actions
            </span>
            <Badge
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider shrink-0 transition-colors",
                unscheduledCount === 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-extrabold"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
              )}
            >
              {unscheduledCount === 0 ? (
                <span className="flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> All Scheduled
                </span>
              ) : (
                `${unscheduledCount} Left to Schedule`
              )}
            </Badge>
          </div>

          <div className="my-2.5">
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {scheduledCount} of {totalSubjectCount} Subjects Scheduled
              </p>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5 truncate">
                {unscheduledCount > 0
                  ? `${unscheduledCount} subject${unscheduledCount > 1 ? 's' : ''} left to plan`
                  : 'All board exam subjects planned'}
              </p>
            </div>

            {/* Syllabus Coverage & Next Subject Tracker */}
            <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5 bg-muted/20 -mx-1 px-2.5 py-2 rounded-xl border border-border/50">
              <div className="flex items-center justify-between text-[11px] gap-2">
                <span className="font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                  <Layers className="w-3 h-3 text-amber-500" />
                  Study Plan Progress:
                </span>
                <span className="font-black text-foreground truncate">
                  {scheduledCount} of {totalSubjectCount} ({coveragePercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden border border-border/60 flex">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    coveragePercent === 100
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.55)]"
                      : "bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500"
                  )}
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 gap-2">
                <span className="flex items-center gap-1 min-w-0 truncate">
                  {nextRecommendedSubject ? (
                    <span className="truncate flex items-center gap-1 text-muted-foreground">
                      👉 Next:{' '}
                      <strong className="text-foreground font-bold truncate" title={nextRecommendedSubject.title}>
                        {nextRecommendedSubject.shortTitle || nextRecommendedSubject.title}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      All subjects scheduled
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-semibold">
                  {totalDailyTargetSum > 0 ? `${totalDailyTargetSum} questions / day` : 'No targets yet'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => handleOpenAddModal(undefined, nextRecommendedSubject?.title)}
              className="w-full rounded-xl sm:rounded-2xl h-9 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Subject Block
            </Button>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold px-0.5">
              <span className="uppercase truncate">4 Board Exam Subjects</span>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'calendar' ? 'roadmap' : 'calendar')}
                className="text-primary hover:underline cursor-pointer shrink-0 ml-1"
              >
                {viewMode === 'calendar' ? 'View All Subjects →' : 'View Calendar →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Header with View Toggle + Content */}
      <div className="bg-card border-2 border-border/80 rounded-2xl sm:rounded-3xl p-3 sm:p-6 lg:p-7 shadow-sm space-y-5 sm:space-y-6">
        {/* Controls Bar: View Toggle + Month Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-muted/50 p-1 rounded-xl sm:rounded-2xl border border-border w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center',
                  viewMode === 'calendar'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Month Calendar Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('roadmap')}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center',
                  viewMode === 'roadmap'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Subject Roadmap & Targets</span>
              </button>
            </div>
          </div>

          {/* Month Navigator (visible in calendar view) */}
          {viewMode === 'calendar' && (
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-9 w-9 p-0 rounded-xl border-border"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm sm:text-base font-black text-foreground uppercase tracking-wide min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-9 w-9 p-0 rounded-xl border-border"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl h-9 px-3"
              >
                Today
              </Button>
            </div>
          )}
        </div>

        {/* VIEW 1: MONTH CALENDAR GRID */}
        {viewMode === 'calendar' && (
          <div className="space-y-2 sm:space-y-3">
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="text-[9px] sm:text-xs font-black uppercase text-muted-foreground tracking-wider py-0.5 sm:py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((date, idx) => {
                const isCurrent = isSameMonth(date, currentMonth);
                const isToday = isSameDay(date, new Date());
                const dayPlans = getPlansForDate(date);
                const isDeadline = institutionalDeadline && isSameDay(date, institutionalDeadline);
                const isPast = startOfDay(date) < startOfDay(new Date());
                const isPastDeadline = institutionalDeadline && startOfDay(date) > startOfDay(institutionalDeadline);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (dayPlans.length > 0) {
                        handleOpenEditModal(dayPlans[0]);
                      } else if (isPast) {
                        toast({
                          variant: 'destructive',
                          title: 'Cannot Schedule Past Dates',
                          description: `You cannot schedule for ${format(
                            date,
                            'MMMM d'
                          )} because this date has already passed. Please select today or an upcoming date.`,
                        });
                      } else if (isPastDeadline) {
                        toast({
                          variant: 'destructive',
                          title: 'Institutional Deadline Passed',
                          description: `Cannot schedule after the final institutional deadline of ${format(
                            institutionalDeadline!,
                            'MMMM d, yyyy'
                          )}.`,
                        });
                      } else {
                        handleOpenAddModal(date);
                      }
                    }}
                    className={cn(
                      'aspect-square rounded-[4px] sm:rounded-[8px] p-1 sm:p-2 border transition-all flex flex-col justify-between group relative overflow-hidden',
                      (isPast || isPastDeadline) && dayPlans.length === 0
                        ? 'bg-muted/10 border-border/30 opacity-40 hover:opacity-60 cursor-not-allowed'
                        : isCurrent
                        ? 'bg-card border-border/70 hover:border-primary/60 hover:shadow-md cursor-pointer'
                        : 'bg-muted/15 border-border/30 opacity-30 hover:opacity-70 cursor-pointer',
                      isToday && 'ring-2 ring-primary border-primary bg-primary/[0.04] shadow-xs'
                    )}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-center justify-between w-full leading-none">
                      <span
                        className={cn(
                          'text-[9px] sm:text-xs font-black px-1 sm:px-1.5 py-0.5 rounded-[2px] sm:rounded-md leading-none',
                          isToday
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : isPast
                            ? 'text-muted-foreground/80'
                            : 'text-foreground'
                        )}
                      >
                        {format(date, 'd')}
                      </span>

                      {isDeadline && (
                        <span
                          className="text-[6.5px] sm:text-[8px] bg-red-500 text-white font-black px-1 py-0.5 rounded-[2px] uppercase tracking-tighter shrink-0"
                          title="Institutional Deadline"
                        >
                          <span className="sm:hidden">D-Day</span>
                          <span className="hidden sm:inline">Deadline</span>
                        </span>
                      )}
                    </div>

                    {/* Middle: Active Subject Blocks on this date */}
                    <div className="flex-1 my-0.5 sm:my-1 space-y-0.5 sm:space-y-1 overflow-hidden w-full">
                      {/* On mobile show up to 2 chips; on desktop show up to 3 */}
                      {dayPlans.slice(0, 2).map((plan) => {
                        const meta =
                          availableSubjectMetas.find(
                            (s) => s.title.toLowerCase() === plan.subject.toLowerCase()
                          ) ||
                          availableSubjectMetas[0] ||
                          resolveSubjectMeta(plan.subject);

                        return (
                          <div
                            key={plan.subject}
                            className={cn(
                              'text-[7px] sm:text-[9.5px] font-bold px-1 py-0.5 rounded-[2px] sm:rounded-md border flex items-center justify-between truncate transition-transform hover:scale-[1.02] leading-tight',
                              meta.badgeBg,
                              meta.badgeBorder,
                              meta.badgeText
                            )}
                            title={`${plan.subject}: ${format(
                              new Date(plan.startDate),
                              'MMM dd'
                            )} - ${format(new Date(plan.endDate), 'MMM dd')} (${plan.priority || 'HIGH'} Priority)`}
                          >
                            <span className="truncate flex items-center gap-0.5 sm:gap-1 font-extrabold min-w-0">
                              <span className="shrink-0">{meta.icon}</span>
                              <span className="hidden sm:inline truncate">{plan.subject}</span>
                              <span className="sm:hidden truncate">{meta.shortTitle}</span>
                            </span>

                            {plan.priority === 'HIGH' && (
                              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 shrink-0 ml-0.5" />
                            )}
                          </div>
                        );
                      })}

                      {/* Desktop 3rd plan if available */}
                      {dayPlans.length > 2 && (
                        (() => {
                          const thirdMeta =
                            availableSubjectMetas.find(
                              (s) => s.title.toLowerCase() === dayPlans[2].subject.toLowerCase()
                            ) ||
                            availableSubjectMetas[0] ||
                            resolveSubjectMeta(dayPlans[2].subject);

                          return (
                            <>
                              <div
                                key={dayPlans[2].subject}
                                className={cn(
                                  'hidden sm:flex text-[9.5px] font-bold px-1 py-0.5 rounded-md border items-center justify-between truncate transition-transform hover:scale-[1.02] leading-tight',
                                  thirdMeta.badgeBg,
                                  thirdMeta.badgeBorder,
                                  thirdMeta.badgeText
                                )}
                              >
                                <span className="truncate flex items-center gap-1 font-extrabold min-w-0">
                                  <span>{thirdMeta.icon}</span>
                                  <span className="truncate">{dayPlans[2].subject}</span>
                                </span>
                              </div>

                              <div className="text-[6.5px] sm:text-[8px] font-black text-muted-foreground text-center bg-muted/40 rounded-[2px] py-0.2 leading-none">
                                +{dayPlans.length - 2} more
                              </div>
                            </>
                          );
                        })()
                      )}
                    </div>

                    {/* Bottom: Quick Add prompt or status on hover (desktop only) */}
                    <div className="hidden sm:block text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-bold text-center">
                      {dayPlans.length > 0
                        ? 'Edit Block'
                        : isPast
                        ? 'Passed'
                        : isPastDeadline
                        ? 'Closed'
                        : '+ Schedule'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-card/60 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] sm:text-xs text-muted-foreground font-semibold">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="font-bold text-foreground">Subjects:</span>
                {availableSubjectMetas.map((sub) => (
                  <span key={sub.title} className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded-md border border-border/30">
                    <span>{sub.icon}</span>
                    <span>{sub.shortTitle}</span>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" /> High Priority
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" /> Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" /> Maintenance
                </span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SUBJECT ROADMAP & TARGETS (ROADMAP LIST) */}
        {viewMode === 'roadmap' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {availableSubjectMetas.map((sub) => {
                const plan = planBySubject.get(sub.title);
                const isScheduled = !!plan;
                const metric = findSubjectMetric(sub.title, subjectMetrics);
                const subAnswered = metric
                  ? Number(metric.totalQuestionsAnswered ?? metric.questionsAnswered ?? 0)
                  : 0;
                const subAccuracy = metric
                  ? Math.round(
                      Number(
                        metric.proficiency !== undefined
                          ? metric.proficiency
                          : metric.mastery ?? metric.accuracy ?? 0
                      )
                    )
                  : null;
                const subTargetQuestions = plan?.targetQuestions || 50;
                const subTargetAccuracy = plan?.targetAccuracy || 75;
                const isSubQuotaMet = subAnswered >= subTargetQuestions;
                const isSubAccuracyMet = subAccuracy !== null && subAccuracy >= subTargetAccuracy;
                const isSubFullyAchieved =
                  isSubQuotaMet && (subAnswered === 0 ? false : isSubAccuracyMet);

                const isTodayActive =
                  plan &&
                  isWithinInterval(startOfDay(new Date()), {
                    start: startOfDay(new Date(plan.startDate)),
                    end: startOfDay(new Date(plan.endDate)),
                  });

                return (
                  <div
                    key={sub.title}
                    className={cn(
                      'p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all flex flex-col justify-between gap-3 relative overflow-hidden bg-card',
                      isScheduled
                        ? isSubFullyAchieved
                          ? 'border-emerald-500/80 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.18)] bg-emerald-500/[0.02]'
                          : 'border-border/80 hover:border-primary/50 shadow-xs'
                        : 'border-dashed border-border/60 bg-muted/10'
                    )}
                  >
                    {/* Top Row: Icon, Subject Title, Board Weight & Priority Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl shrink-0"
                          style={{ backgroundColor: `${sub.color}20` }}
                        >
                          {sub.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-black text-foreground leading-snug line-clamp-2 break-words">
                            {sub.title}
                          </h4>
                        </div>
                      </div>

                      {/* Status / Priority Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isScheduled ? (
                          <>
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                              {isSubFullyAchieved ? (
                                <Badge className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Target Met
                                </Badge>
                              ) : isSubQuotaMet ? (
                                <Badge className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Quota Met
                                </Badge>
                              ) : null}

                              <Badge
                                className={cn(
                                  'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5',
                                  plan.priority === 'HIGH'
                                    ? 'bg-red-500/15 text-red-500 border-red-500/30'
                                    : plan.priority === 'MEDIUM'
                                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                                )}
                              >
                                <span className="sm:hidden">{plan.priority || 'HIGH'}</span>
                                <span className="hidden sm:inline">{plan.priority || 'HIGH'} Priority</span>
                              </Badge>
                            </div>

                            {isTodayActive && (
                              <span className="text-[8px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active Focus
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-bold uppercase text-muted-foreground px-2 py-0.5">
                            Not Scheduled
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Middle: Scheduled Review Period & Targets */}
                    {isScheduled ? (
                      <div
                        className={cn(
                          'space-y-2 sm:space-y-2.5 border rounded-xl sm:rounded-2xl p-2.5 sm:p-3 transition-colors',
                          isSubFullyAchieved
                            ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                            : 'bg-muted/20 border-border/60'
                        )}
                      >
                        {/* Dates */}
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between text-xs gap-1">
                          <span className="font-bold text-muted-foreground flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs">
                            <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                            Review Period:
                          </span>
                          <span className="font-black text-foreground text-[11px] sm:text-xs">
                            {format(new Date(plan.startDate), 'MMM dd')} –{' '}
                            {format(new Date(plan.endDate), 'MMM dd, yyyy')}
                          </span>
                        </div>

                        {/* What to Achieve: Target Quota & Accuracy */}
                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border/40 text-[11px]">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-muted-foreground block truncate">
                              Daily Question Target:
                            </span>
                            <span className="font-black text-foreground text-[11px] sm:text-xs block mt-0.5 truncate">
                              🎯 {plan.targetQuestions || 50} Qs / day
                            </span>
                            <span
                              className={cn(
                                "text-[9px] block font-mono font-bold mt-0.5 truncate",
                                isSubQuotaMet
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              ({subAnswered} answered){isSubQuotaMet ? ' ✓' : ''}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-muted-foreground block truncate">
                              Target Subject Proficiency:
                            </span>
                            <span className="font-black text-foreground text-[11px] sm:text-xs block mt-0.5 truncate">
                              ⚡ ≥ {plan.targetAccuracy || 75}%
                            </span>
                            <span
                              className={cn(
                                "text-[9px] block font-mono font-bold mt-0.5 truncate",
                                subAccuracy !== null && isSubAccuracyMet
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              {subAccuracy !== null ? `(Current: ${subAccuracy}%)` : '(No attempts yet)'}
                            </span>
                          </div>
                        </div>

                        {/* Goal note */}
                        {plan.goal && (
                          <p className="text-[10px] font-medium text-foreground/80 italic pt-1 border-t border-border/40 line-clamp-1">
                            Focus: {plan.goal}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="py-3 text-center space-y-1">
                        <p className="text-xs font-bold text-muted-foreground">
                          No review block set for {sub.shortTitle}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80">
                          Set a date range (e.g. Oct 14 - Oct 30) and assign target questions.
                        </p>
                      </div>
                    )}

                    {/* Bottom Row: Actions */}
                    <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      {isScheduled ? (
                        <>
                          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(plan)}
                              className="rounded-xl h-8 text-[11px] font-bold border-border flex-1 sm:flex-initial px-2.5 sm:px-3 truncate"
                            >
                              <Pencil className="w-3 h-3 mr-1 shrink-0 sm:hidden" />
                              <span className="sm:hidden">Edit Targets</span>
                              <span className="hidden sm:inline">Edit Dates & Targets</span>
                            </Button>
                            {onSelectSubjectInCurriculum && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSelectSubjectInCurriculum(sub.title)}
                                className="rounded-xl h-8 text-[11px] font-bold text-primary hover:bg-primary/10 flex-1 sm:flex-initial px-2.5 sm:px-3 truncate"
                              >
                                <BookOpen className="w-3 h-3 mr-1 shrink-0 sm:hidden" />
                                <span className="sm:hidden">Modules</span>
                                <span className="hidden sm:inline">View Modules</span>
                              </Button>
                            )}
                          </div>
                          <Link href={`/quest?subject=${encodeURIComponent(sub.title)}`} className="w-full sm:w-auto">
                            <Button
                              size="sm"
                              className="w-full sm:w-auto rounded-xl h-8 px-3 text-[11px] font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <Sword className="w-3 h-3" />
                              Quest Drill
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPlanForEdit(null);
                            setSelectedSubjectForModal(sub.title);
                            setClickedDateForSchedule(undefined);
                            setModalOpen(true);
                          }}
                          className="w-full rounded-xl sm:rounded-2xl h-8 sm:h-9 text-[11px] sm:text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border"
                        >
                          + Set Schedule for {sub.shortTitle}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Schedule / Edit Block Modal */}
      <ScheduleBlockModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        availableSubjects={subjects}
        initialSubject={selectedSubjectForModal || selectedPlanForEdit?.subject}
        initialStartDate={
          selectedPlanForEdit
            ? new Date(selectedPlanForEdit.startDate)
            : clickedDateForSchedule
        }
        initialEndDate={
          selectedPlanForEdit
            ? new Date(selectedPlanForEdit.endDate)
            : clickedDateForSchedule
            ? addDays(clickedDateForSchedule, 14)
            : undefined
        }
        existingPlan={selectedPlanForEdit}
        allPlans={plans}
        institutionalDeadline={institutionalDeadline}
        onSaved={handleSavedPlan}
      />
    </div>
  );
}
