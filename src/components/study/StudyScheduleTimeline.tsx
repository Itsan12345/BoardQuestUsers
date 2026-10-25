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
  differenceInDays,
  startOfDay,
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

  const scheduledCount = plans.length;
  const totalSubjectCount = availableSubjectMetas.length;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Overview & Active Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Active Review Focus */}
        <div className="bg-card border-2 border-border/80 hover:border-primary/40 transition-all rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Review Focus
            </span>
            {activeFocusPlan && (
              <Badge className="bg-emerald-500/15 border-emerald-500/30 text-emerald-500 text-[9px] font-bold uppercase tracking-wider">
                In Progress
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
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {format(new Date(activeFocusPlan.startDate), 'MMM dd')} –{' '}
                  {format(new Date(activeFocusPlan.endDate), 'MMM dd, yyyy')}
                  <span className="text-foreground/80 font-bold ml-1.5">
                    (
                    {Math.max(
                      0,
                      differenceInDays(new Date(activeFocusPlan.endDate), new Date())
                    )}{' '}
                    days remaining)
                  </span>
                </p>
                {activeFocusPlan.goal && (
                  <p className="text-[11px] text-foreground/80 font-medium italic mt-1 line-clamp-1">
                    🎯 {activeFocusPlan.goal}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-foreground">No Active Block Today</p>
                <p className="text-xs text-muted-foreground">
                  Schedule a review period (e.g. Oct 14 – Oct 30) to track your daily progress.
                </p>
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
            ) : (
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Schedule Now →
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Institutional Final Deadline */}
        <div className="bg-card border-2 border-border/80 hover:border-primary/40 transition-all rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Institutional Target Deadline
            </span>
            {program?.endDate && (
              <Badge className="bg-primary/10 border-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider">
                {differenceInDays(new Date(program.endDate), new Date())} Days Left
              </Badge>
            )}
          </div>

          <div className="my-2.5">
            <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {program?.endDate
                ? format(new Date(program.endDate), 'MMMM dd, yyyy')
                : 'November 30, 2026'}
            </p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {program?.authorName || program?.companyName || 'Super Admin'} • {program?.title || 'Game Deadline'}
              {program?.labels && program.labels.length > 0 && ` • ${Array.isArray(program.labels) ? program.labels.join(', ') : String(program.labels)}`}
            </p>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-bold">
            <span>All subject study blocks must conclude before this date.</span>
          </div>
        </div>

        {/* Card 3: Prioritization & Quick Actions */}
        <div className="bg-gradient-to-br from-card via-card to-primary/5 border-2 border-border/80 hover:border-primary/40 transition-all rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Study Roadmap Actions
              </span>
              <span className="text-[10px] font-mono text-muted-foreground font-bold">
                MTLE Syllabus
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Designate review dates, prioritize critical focus areas, and align daily question targets.
            </p>
          </div>

          <div className="pt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleOpenAddModal()}
              className="flex-1 rounded-2xl h-10 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Subject Block
            </Button>
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
                const metric = subjectMetrics.find((m) => m.name === sub.title);

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
                        ? 'border-border/80 hover:border-primary/50 shadow-xs'
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
                      <div className="space-y-2 sm:space-y-2.5 bg-muted/20 border border-border/60 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
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
                            {metric?.questionsAnswered !== undefined && (
                              <span className="text-[9px] text-muted-foreground block font-mono">
                                ({metric.questionsAnswered} answered)
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-muted-foreground block truncate">
                              Target Accuracy:
                            </span>
                            <span className="font-black text-foreground text-[11px] sm:text-xs block mt-0.5 truncate">
                              ⚡ ≥ {plan.targetAccuracy || 75}%
                            </span>
                            {metric?.accuracy !== undefined && (
                              <span className="text-[9px] text-muted-foreground block font-mono">
                                (Current: {Math.round(metric.accuracy)}%)
                              </span>
                            )}
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
