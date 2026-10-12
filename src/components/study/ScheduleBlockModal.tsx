"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar as CalendarIcon,
  Flame,
  CheckCircle2,
  Trash2,
  Loader2,
  Target,
} from 'lucide-react';
import { format, addDays, startOfDay, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { saveStudyBlock, deleteStudyBlock, type StudyBlockInput } from '@/app/actions/study-plan';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SubjectMetaConfig {
  title: string;
  shortTitle: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  boardWeight: string;
  icon: string;
}

export const MTLE_SUBJECTS: SubjectMetaConfig[] = [
  {
    title: 'Clinical Chemistry',
    shortTitle: 'CC',
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-500',
    boardWeight: '20% of MTLE',
    icon: '🧪',
  },
  {
    title: 'Microbiology',
    shortTitle: 'Micro',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-500',
    boardWeight: '20% of MTLE',
    icon: '🧫',
  },
  {
    title: 'Hematology',
    shortTitle: 'Hema',
    color: '#ef4444',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-500',
    boardWeight: '20% of MTLE',
    icon: '🩸',
  },
  {
    title: 'Immunology & Serology',
    shortTitle: 'IS/BB',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-500',
    boardWeight: '20% of MTLE',
    icon: '🛡️',
  },
  {
    title: 'Clinical Microscopy',
    shortTitle: 'CM/Para',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-500',
    boardWeight: '10% of MTLE',
    icon: '🔬',
  },
  {
    title: 'Histopathology and Medtech Laws',
    shortTitle: 'Histo/Law',
    color: '#f43f5e',
    badgeBg: 'bg-pink-500/15',
    badgeBorder: 'border-pink-500/30',
    badgeText: 'text-pink-500',
    boardWeight: '10% of MTLE',
    icon: '📜',
  },
];

export interface StudyPlanItemSummary {
  id?: string;
  subject: string;
  startDate: string | Date;
  endDate: string | Date;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  goal?: string;
  targetQuestions?: number;
  targetAccuracy?: number;
  notes?: string;
}

export interface ScheduleBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSubject?: string;
  initialStartDate?: Date;
  initialEndDate?: Date;
  existingPlan?: StudyPlanItemSummary | null;
  allPlans?: StudyPlanItemSummary[];
  institutionalDeadline?: Date | null;
  onSaved: () => void;
}

export function ScheduleBlockModal({
  open,
  onOpenChange,
  initialSubject,
  initialStartDate,
  initialEndDate,
  existingPlan,
  allPlans,
  institutionalDeadline,
  onSaved,
}: ScheduleBlockModalProps) {
  const { toast } = useToast();
  const today = startOfDay(new Date());

  // Map of all currently scheduled plans keyed by lowercased subject name
  const plansBySubject = useMemo(() => {
    const map = new Map<string, StudyPlanItemSummary>();
    if (allPlans && Array.isArray(allPlans)) {
      allPlans.forEach((p) => {
        if (p && p.subject) {
          map.set(p.subject.trim().toLowerCase(), p);
        }
      });
    }
    if (existingPlan && existingPlan.subject) {
      map.set(existingPlan.subject.trim().toLowerCase(), existingPlan);
    }
    return map;
  }, [allPlans, existingPlan]);

  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject || MTLE_SUBJECTS[0].title
  );

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [targetQuestions, setTargetQuestions] = useState<number>(100);
  const [targetAccuracy, setTargetAccuracy] = useState<number>(80);
  const [goal, setGoal] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine if the currently selected subject already has an active schedule
  const currentPlanForSubject = plansBySubject.get(selectedSubject.trim().toLowerCase());
  const hasExistingSchedule = Boolean(currentPlanForSubject);

  // Track modal open state and initial subject to prevent unwanted re-synchronization
  const wasOpenRef = useRef(false);
  const prevInitialSubjectRef = useRef(initialSubject);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const isFirstOpen = !wasOpenRef.current && open;
    const isSubjectPropChanged = Boolean(
      initialSubject && initialSubject !== prevInitialSubjectRef.current
    );

    prevInitialSubjectRef.current = initialSubject;

    // ONLY initialize form when the modal transitions from closed to open,
    // or when the parent intentionally passes a new explicit initialSubject prop.
    // This strictly prevents resets back to CC when re-rendering or selecting other subjects!
    if (isFirstOpen || isSubjectPropChanged) {
      wasOpenRef.current = true;
      const todayDate = startOfDay(new Date());
      const maxDateVal = institutionalDeadline ? startOfDay(institutionalDeadline) : null;

      // Prioritize explicit initial subject or existing plan subject, else first MTLE subject
      const sub =
        initialSubject ||
        (existingPlan ? existingPlan.subject : null) ||
        MTLE_SUBJECTS[0].title;

      setSelectedSubject(sub);

      const activePlan =
        existingPlan?.subject.toLowerCase() === sub.toLowerCase()
          ? existingPlan
          : plansBySubject.get(sub.toLowerCase());

      if (activePlan) {
        let s = startOfDay(new Date(activePlan.startDate));
        let e = startOfDay(new Date(activePlan.endDate));
        if (s < todayDate) s = todayDate;
        if (maxDateVal && e > maxDateVal) e = maxDateVal;
        if (s > e) s = e;

        setStartDate(s);
        setEndDate(e);
        setPriority(activePlan.priority || 'HIGH');
        setTargetQuestions(activePlan.targetQuestions || 100);
        setTargetAccuracy(activePlan.targetAccuracy || 80);
        setGoal(activePlan.goal || '');
        setNotes(activePlan.notes || '');
      } else if (initialStartDate) {
        // User explicitly clicked a specific calendar cell
        let s = startOfDay(initialStartDate);
        if (s < todayDate) s = todayDate;
        let e = initialEndDate ? startOfDay(initialEndDate) : addDays(s, 14);
        if (maxDateVal && e > maxDateVal) e = maxDateVal;
        if (s > e) s = e;

        setStartDate(s);
        setEndDate(e);
        setPriority('HIGH');
        setTargetQuestions(100);
        setTargetAccuracy(80);
        setGoal('');
        setNotes('');
      } else {
        // Opened without preselected dates for an unscheduled subject -> Keep dates empty
        setStartDate(null);
        setEndDate(null);
        setPriority('HIGH');
        setTargetQuestions(100);
        setTargetAccuracy(80);
        setGoal('');
        setNotes('');
      }
    }
  }, [
    open,
    initialSubject,
    existingPlan,
    initialStartDate,
    initialEndDate,
    institutionalDeadline,
    plansBySubject,
  ]);

  // When clicking a subject tile, load its existing plan or clear dates if unscheduled
  const handleSelectSubject = (subjectTitle: string) => {
    setSelectedSubject(subjectTitle);
    const plan = plansBySubject.get(subjectTitle.trim().toLowerCase());
    const todayDate = startOfDay(new Date());
    const maxDateVal = institutionalDeadline ? startOfDay(institutionalDeadline) : null;

    if (plan) {
      let s = startOfDay(new Date(plan.startDate));
      let e = startOfDay(new Date(plan.endDate));
      if (s < todayDate) s = todayDate;
      if (maxDateVal && e > maxDateVal) e = maxDateVal;
      if (s > e) s = e;

      setStartDate(s);
      setEndDate(e);
      setPriority(plan.priority || 'HIGH');
      setTargetQuestions(plan.targetQuestions || 100);
      setTargetAccuracy(plan.targetAccuracy || 80);
      setGoal(plan.goal || '');
      setNotes(plan.notes || '');
    } else {
      // Unscheduled subject has NO review period selected yet
      setStartDate(null);
      setEndDate(null);
      setPriority('HIGH');
      setTargetQuestions(100);
      setTargetAccuracy(80);
      setGoal('');
      setNotes('');
    }
  };

  const handleApplyPresetDays = (days: number) => {
    try {
      const todayDate = startOfDay(new Date());
      const baseStart = !startDate || startDate < todayDate ? todayDate : startDate;
      let newEnd = addDays(baseStart, days);

      if (institutionalDeadline && newEnd > startOfDay(institutionalDeadline)) {
        newEnd = startOfDay(institutionalDeadline);
      }

      setStartDate(baseStart);
      setEndDate(newEnd);
    } catch {
      // Fallback
    }
  };

  const handleStartDateChange = (val: string) => {
    if (!val) {
      setStartDate(null);
      return;
    }
    const picked = startOfDay(new Date(val + 'T00:00:00'));
    if (isNaN(picked.getTime())) return;

    const todayDate = startOfDay(new Date());
    const maxDateVal = institutionalDeadline ? startOfDay(institutionalDeadline) : null;

    if (picked < todayDate) {
      toast({
        variant: 'destructive',
        title: 'Past Date Restricted',
        description: `Cannot schedule for past days. Automatically set to today (${format(
          todayDate,
          'MMM dd'
        )}).`,
      });
      setStartDate(todayDate);
      if (endDate && endDate < todayDate) {
        setEndDate(todayDate);
      }
      return;
    }

    if (maxDateVal && picked > maxDateVal) {
      toast({
        variant: 'destructive',
        title: 'Institutional Deadline Exceeded',
        description: `Start date cannot exceed final deadline (${format(maxDateVal, 'MMM dd, yyyy')}).`,
      });
      setStartDate(maxDateVal);
      setEndDate(maxDateVal);
      return;
    }

    setStartDate(picked);
    if (endDate && picked > endDate) {
      setEndDate(picked);
    }
  };

  const handleEndDateChange = (val: string) => {
    if (!val) {
      setEndDate(null);
      return;
    }
    const picked = startOfDay(new Date(val + 'T00:00:00'));
    if (isNaN(picked.getTime())) return;

    const todayDate = startOfDay(new Date());
    const maxDateVal = institutionalDeadline ? startOfDay(institutionalDeadline) : null;

    if (picked < todayDate) {
      toast({
        variant: 'destructive',
        title: 'Past Date Restricted',
        description: 'Review period cannot end on a past date.',
      });
      setEndDate(todayDate);
      return;
    }

    if (maxDateVal && picked > maxDateVal) {
      toast({
        variant: 'destructive',
        title: 'Institutional Deadline Exceeded',
        description: `Cannot schedule past final deadline (${format(
          maxDateVal,
          'MMM dd, yyyy'
        )}). Clamped to deadline.`,
      });
      setEndDate(maxDateVal);
      return;
    }

    if (startDate && picked < startDate) {
      toast({
        variant: 'destructive',
        title: 'Date Order Conflict',
        description: 'End date cannot be earlier than start date.',
      });
      setEndDate(startDate);
      return;
    }

    setEndDate(picked);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    if (!startDate || !endDate) {
      toast({
        variant: 'destructive',
        title: 'Review Period Required',
        description: 'Please select both a start date and an end date before saving.',
      });
      return;
    }

    const todayDate = startOfDay(new Date());
    const cleanStart = startOfDay(startDate);
    const cleanEnd = startOfDay(endDate);

    // 1. Validation: Days that have passed cannot be scheduled
    if (cleanStart < todayDate) {
      toast({
        variant: 'destructive',
        title: 'Past Date Error',
        description: `Cannot schedule for past days. The review block must start today (${format(
          todayDate,
          'MMM dd'
        )}) or a future date.`,
      });
      return;
    }

    if (cleanStart > cleanEnd) {
      toast({
        variant: 'destructive',
        title: 'Date Order Conflict',
        description: 'Start date cannot be after the end date.',
      });
      return;
    }

    // 2. Validation: Cannot overlap or exceed institutional final deadline
    if (institutionalDeadline && cleanEnd > startOfDay(institutionalDeadline)) {
      toast({
        variant: 'destructive',
        title: 'Institutional Deadline Exceeded',
        description: `Your review block cannot exceed the final institutional deadline of ${format(
          institutionalDeadline,
          'MMM dd, yyyy'
        )}.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: StudyBlockInput = {
        subject: selectedSubject,
        startDate: cleanStart.toISOString(),
        endDate: cleanEnd.toISOString(),
        priority,
        targetQuestions: Number(targetQuestions) || 50,
        targetAccuracy: Number(targetAccuracy) || 75,
        goal: goal.trim(),
        notes: notes.trim(),
        status: 'IN_PROGRESS',
      };

      const res = await saveStudyBlock(payload);
      if (res.success) {
        toast({
          title: hasExistingSchedule ? 'Study Schedule Updated' : 'Study Block Scheduled',
          description: `Scheduled ${selectedSubject} from ${format(
            cleanStart,
            'MMM dd'
          )} to ${format(cleanEnd, 'MMM dd, yyyy')}.`,
        });
        onSaved();
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Could Not Save Schedule',
          description: res.error || 'Tactical sync failed.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Unable to communicate with the study planner database.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;
    setIsDeleting(true);
    try {
      const res = await deleteStudyBlock(selectedSubject);
      if (res.success) {
        toast({
          title: 'Schedule Removed',
          description: `Removed study block for ${selectedSubject}.`,
        });
        setStartDate(null);
        setEndDate(null);
        onSaved();
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Removing Block',
          description: res.error || 'Failed to remove block.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete study plan.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const minDateStr = format(today, 'yyyy-MM-dd');
  const maxDateStr = institutionalDeadline
    ? format(startOfDay(institutionalDeadline), 'yyyy-MM-dd')
    : undefined;
  const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  const daysCount = startDate && endDate ? Math.max(1, differenceInDays(endDate, startDate) + 1) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg md:max-w-3xl lg:max-w-4xl max-h-[88dvh] sm:max-h-[90dvh] flex flex-col border-2 border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-5 lg:p-6 overflow-hidden gap-0">
        {/* Pinned Header */}
        <DialogHeader className="space-y-0.5 sm:space-y-1 pb-2 sm:pb-3 shrink-0 border-b border-border/60">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm sm:text-base shrink-0">
              📅
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-headline font-black text-sm sm:text-lg lg:text-xl text-foreground truncate">
                {hasExistingSchedule ? (
                  <>
                    <span className="hidden sm:inline">Edit Schedule: </span>
                    <span className="sm:hidden">Edit: </span>
                    {selectedSubject}
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Schedule Review: </span>
                    <span className="sm:hidden">Schedule: </span>
                    {selectedSubject}
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-[10px] sm:text-xs text-muted-foreground font-semibold truncate">
                {hasExistingSchedule
                  ? `Modify review dates, priority, or actionable targets for ${selectedSubject}.`
                  : `Set review dates, priority, and actionable targets for your MTLE prep.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body - Strictly No Horizontal Overflow */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-2.5 sm:py-3 space-y-3 sm:space-y-3.5 pr-1 sm:pr-1.5">
            {/* 1. Subject Selector with Live Scheduled Indicators (6 cols on desktop, 3 on mobile/tablet) */}
            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  1. Choose Board Subject
                </Label>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold hidden sm:inline">
                  Tap subject to view or adjust schedule
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
                {MTLE_SUBJECTS.map((sub) => {
                  const isSelected = selectedSubject === sub.title;
                  const existingSubPlan = plansBySubject.get(sub.title.toLowerCase());
                  const isSubScheduled = Boolean(existingSubPlan);

                  return (
                    <button
                      key={sub.title}
                      type="button"
                      onClick={() => handleSelectSubject(sub.title)}
                      className={cn(
                        'p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-0.5 sm:gap-1 group cursor-pointer relative min-w-0',
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm sm:shadow-md shadow-primary/10 ring-1 ring-primary'
                          : isSubScheduled
                          ? 'border-emerald-500/40 bg-card hover:border-emerald-500/70 hover:bg-muted/40'
                          : 'border-border/70 bg-card hover:border-slate-400 dark:hover:border-slate-600 hover:bg-muted/40'
                      )}
                    >
                      <div className="flex items-center justify-start w-full">
                        <span className="text-sm sm:text-base">{sub.icon}</span>
                      </div>

                      <div className="min-w-0 w-full">
                        <p className="text-[10px] sm:text-xs font-black text-foreground leading-tight truncate">
                          {sub.shortTitle}
                        </p>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold truncate leading-tight hidden sm:block">
                          {sub.title}
                        </p>
                      </div>

                      {/* Schedule Status Indicator Badge */}
                      <div className="pt-0.5 w-full">
                        {isSubScheduled && existingSubPlan ? (
                          <div className="flex items-center gap-0.5 sm:gap-1 text-[7.5px] sm:text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 sm:px-1.5 py-0.5 rounded-md border border-emerald-500/25 w-full truncate">
                            <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0" />
                            <span className="truncate">
                              {format(new Date(existingSubPlan.startDate), 'MMM dd')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 sm:gap-1 text-[7.5px] sm:text-[9px] font-semibold text-muted-foreground/70 bg-muted/60 px-1 sm:px-1.5 py-0.5 rounded-md border border-border/50 w-full truncate">
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                            <span className="truncate">None</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two-Column Responsive Layout on md+ (Dates & Priority on Left, Targets on Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
              {/* Left Column: Dates & Priority */}
              <div className="space-y-3">
                {/* 2. Review Period Dates */}
                <div className="space-y-2 sm:space-y-2.5 bg-muted/20 border border-border/70 rounded-2xl p-2.5 sm:p-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                        2. Review Period Dates
                      </Label>
                      {hasExistingSchedule ? (
                        <span className="text-[8.5px] sm:text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                          Scheduled
                        </span>
                      ) : (
                        <span className="text-[8.5px] sm:text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full border border-border/60">
                          Not Scheduled
                        </span>
                      )}
                    </div>
                    {institutionalDeadline && (
                      <span className="text-[8.5px] sm:text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 truncate">
                        Deadline: {format(institutionalDeadline, 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>

                  {/* Range Preview Summary Card or Empty Prompt */}
                  {startDate && endDate ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/80 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          🗓️
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8.5px] sm:text-[9px] font-bold text-muted-foreground uppercase block leading-none">
                            Selected Review Period
                          </span>
                          <span className="text-[11px] sm:text-xs font-black text-foreground truncate block leading-tight mt-0.5">
                            {format(startDate, 'MMM dd, yyyy')} – {format(endDate, 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9.5px] sm:text-[10px] font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 ml-1.5">
                        {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-dashed border-border/90 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                          🗓️
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8.5px] sm:text-[9px] font-bold text-amber-500 uppercase block leading-none">
                            No Review Period Selected Yet
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground truncate block leading-tight mt-0.5">
                            Set dates below or tap a quick preset.
                          </span>
                        </div>
                      </div>
                      <span className="text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 shrink-0 ml-1.5">
                        Unscheduled
                      </span>
                    </div>
                  )}

                  {/* Two Calendar Selection Inputs (Start Date & End Date) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Start Date
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] font-semibold text-emerald-500">
                          Today ({format(today, 'MMM dd')})
                        </span>
                      </div>
                      <Input
                        type="date"
                        value={startDateStr}
                        min={minDateStr}
                        max={maxDateStr}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="rounded-xl border-border/80 bg-card font-semibold text-xs h-9 px-2.5 dark:[color-scheme:dark] [color-scheme:light] cursor-pointer"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          End Date
                        </span>
                        {institutionalDeadline && (
                          <span className="text-[8.5px] sm:text-[9px] font-semibold text-amber-500 truncate">
                            Max {format(institutionalDeadline, 'MMM dd')}
                          </span>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={endDateStr}
                        min={startDateStr || minDateStr}
                        max={maxDateStr}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="rounded-xl border-border/80 bg-card font-semibold text-xs h-9 px-2.5 dark:[color-scheme:dark] [color-scheme:light] cursor-pointer"
                        required
                      />
                    </div>
                  </div>

                  {/* Quick Presets (Clamped to Institutional Deadline) */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    <span className="text-[8.5px] sm:text-[9px] font-bold text-muted-foreground uppercase mr-1">
                      Presets:
                    </span>
                    {[
                      { label: '1 Week', days: 7 },
                      { label: '2 Weeks', days: 14 },
                      { label: '3 Weeks', days: 21 },
                      {
                        label: 'Until Deadline',
                        days: institutionalDeadline
                          ? Math.max(
                              1,
                              differenceInDays(
                                startOfDay(institutionalDeadline),
                                startDate || today
                              )
                            )
                          : 30,
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyPresetDays(preset.days)}
                        className="text-[8.5px] sm:text-[9px] font-bold px-2 py-0.5 rounded-lg bg-card border border-border/80 hover:border-primary/50 text-foreground/80 hover:text-primary transition-all cursor-pointer"
                      >
                        +{preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Priority Level (What to Prioritize) */}
                <div className="space-y-1 sm:space-y-1.5">
                  <Label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-primary" />
                    3. Study Priority (What to Prioritize)
                  </Label>
                  <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                    {[
                      {
                        id: 'HIGH',
                        label: 'High Priority',
                        shortLabel: 'High',
                        sub: 'Critical Weak Area',
                        shortSub: 'Critical Weak',
                        color: 'border-red-500 bg-red-500/10 text-red-500',
                        dot: 'bg-red-500',
                      },
                      {
                        id: 'MEDIUM',
                        label: 'Medium Priority',
                        shortLabel: 'Medium',
                        sub: 'Standard Review',
                        shortSub: 'Standard',
                        color: 'border-amber-500 bg-amber-500/10 text-amber-500',
                        dot: 'bg-amber-500',
                      },
                      {
                        id: 'LOW',
                        label: 'Reinforcement',
                        shortLabel: 'Reinforce',
                        sub: 'Maintenance Only',
                        shortSub: 'Maintenance',
                        color: 'border-blue-500 bg-blue-500/10 text-blue-500',
                        dot: 'bg-blue-500',
                      },
                    ].map((p) => {
                      const isSelected = priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id as any)}
                          className={cn(
                            'p-1.5 sm:p-2 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer min-w-0',
                            isSelected
                              ? `${p.color} ring-1 ring-primary/40 font-bold shadow-xs`
                              : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                          )}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', p.dot)} />
                            <span className="text-[9.5px] sm:text-[10px] font-bold leading-tight truncate">
                              <span className="sm:hidden">{p.shortLabel}</span>
                              <span className="hidden sm:inline">{p.label}</span>
                            </span>
                          </div>
                          <span className="text-[7.5px] sm:text-[8px] text-muted-foreground font-semibold mt-0.5 truncate">
                            <span className="sm:hidden">{p.shortSub}</span>
                            <span className="hidden sm:inline">{p.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: 4. Actionable Targets (What to Achieve) */}
              <div className="space-y-2 sm:space-y-2.5 bg-muted/20 border border-border/70 rounded-2xl p-2.5 sm:p-3.5">
                <Label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  4. Target Quotas (What to Achieve)
                </Label>

                <div className="grid grid-cols-2 gap-2 items-start">
                  <div className="space-y-1">
                    <div className="h-4 sm:h-4.5 flex items-center justify-between">
                      <span className="text-[9.5px] sm:text-[10px] font-bold text-foreground leading-none">
                        Daily Question Target
                      </span>
                      {daysCount > 0 ? (
                        <span className="text-[8.5px] sm:text-[9px] font-semibold text-muted-foreground truncate leading-none">
                          ~{targetQuestions * daysCount} Total
                        </span>
                      ) : (
                        <span className="text-[8.5px] sm:text-[9px] font-semibold text-muted-foreground/60 leading-none">
                          Per Day
                        </span>
                      )}
                    </div>
                    <Select
                      value={String(targetQuestions)}
                      onValueChange={(val) => setTargetQuestions(Number(val))}
                    >
                      <SelectTrigger className="h-9 w-full text-xs font-bold rounded-xl bg-card border-border/80 focus:ring-1 focus:ring-primary/40 cursor-pointer">
                        <SelectValue placeholder="Daily Target" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-card shadow-2xl z-[100]">
                        <SelectItem value="20" className="text-xs font-bold cursor-pointer">
                          20Qs / day
                        </SelectItem>
                        <SelectItem value="50" className="text-xs font-bold cursor-pointer">
                          50Qs / day
                        </SelectItem>
                        <SelectItem value="100" className="text-xs font-bold cursor-pointer">
                          100Qs / day
                        </SelectItem>
                        <SelectItem value="150" className="text-xs font-bold cursor-pointer">
                          150Qs / day
                        </SelectItem>
                        {![20, 50, 100, 150].includes(targetQuestions) && (
                          <SelectItem
                            value={String(targetQuestions)}
                            className="text-xs font-bold cursor-pointer"
                          >
                            {targetQuestions}Qs / day (Custom)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="h-4 sm:h-4.5 flex items-center justify-between">
                      <span className="text-[9.5px] sm:text-[10px] font-bold text-foreground leading-none">
                        Accuracy Goal
                      </span>
                      <span className="text-[8.5px] sm:text-[9px] font-semibold text-muted-foreground/60 leading-none">
                        Target %
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={50}
                        max={100}
                        step={5}
                        value={targetAccuracy}
                        onChange={(e) => setTargetAccuracy(Number(e.target.value))}
                        className="rounded-xl border-border bg-card font-bold text-xs h-9 pr-8"
                        required
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-foreground">
                    Key Focus Goals / High-Yield Topics
                  </span>
                  <Input
                    placeholder="e.g., Master Carbohydrates, Lipids, Enzymes & Quality Control"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="rounded-xl border-border bg-card text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-muted-foreground">
                    Study Notes & Strategy (Optional)
                  </span>
                  <Textarea
                    placeholder="e.g., Dedicate 1 hour daily to review summary slides before doing Quest Arena drills."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="rounded-xl border-border bg-card text-xs resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Pinned Footer: Fully Responsive on Mobile & Desktop */}
          <div className="pt-2 sm:pt-3 shrink-0 border-t border-border/60 mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {hasExistingSchedule ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="order-last sm:order-first text-destructive hover:text-destructive hover:bg-destructive/10 h-8 sm:h-9 px-2 text-xs font-bold rounded-xl w-full sm:w-auto cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 shrink-0" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                )}
                <span>Remove Schedule</span>
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isDeleting}
                className="w-20 sm:w-24 h-9 text-xs font-bold rounded-xl shrink-0 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!startDate || !endDate || isSubmitting || isDeleting}
                className="flex-1 sm:flex-none h-9 px-4 sm:px-5 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl cursor-pointer truncate disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 shrink-0" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="truncate">
                      {hasExistingSchedule ? 'Update Schedule' : 'Save Schedule'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
