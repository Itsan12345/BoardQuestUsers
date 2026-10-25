"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical,
  Microscope,
  Droplet,
  Dna,
  Eye,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Sword,
  BookOpen,
  ArrowUpDown,
  Sparkles,
  BarChart3,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  getSubjectTopicMasteryAction,
  type SubjectTopicMasteryResponse
} from '@/app/actions/study';

interface TopicMasteryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectName: string | null;
  overallMastery?: number;
  overallCompletion?: number;
  onNavigateToQuest?: (subjectName: string, topicName?: string) => void;
  onNavigateToStudy?: (subjectName: string) => void;
}

const SUBJECT_ICONS: Record<string, any> = {
  "Clinical Chemistry": FlaskConical,
  "Microbiology": Microscope,
  "Hematology": Droplet,
  "Immunology & Serology and Immunohematology": Dna,
  "Clinical Microscopy & Parasitology": Eye,
  "Histopathology & MT Laws": FileText,
  "Histopathology and Medtech Laws": FileText,
};

type FilterStatus = 'ALL' | 'NEEDS_REVIEW' | 'PROFICIENT' | 'MASTERED' | 'UNATTEMPTED';
type SortOption = 'PRIORITY' | 'ACCURACY_DESC' | 'ACCURACY_ASC' | 'QUESTIONS_DESC' | 'NAME_ASC';

export function TopicMasteryModal({
  open,
  onOpenChange,
  subjectName,
  overallMastery,
  overallCompletion: _overallCompletion,
  onNavigateToQuest,
  onNavigateToStudy,
}: TopicMasteryModalProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SubjectTopicMasteryResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('PRIORITY');

  // Fetch topic breakdown data whenever modal opens for a subject
  useEffect(() => {
    if (!open || !subjectName) return;

    let isMounted = true;
    setLoading(true);
    setSearchQuery('');
    setStatusFilter('ALL');

    getSubjectTopicMasteryAction(subjectName)
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load topic mastery:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, subjectName]);

  const refreshData = () => {
    if (!subjectName) return;
    setLoading(true);
    getSubjectTopicMasteryAction(subjectName)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const IconComponent = subjectName ? SUBJECT_ICONS[subjectName] || FlaskConical : FlaskConical;

  // Filter and sort topics
  const filteredTopics = useMemo(() => {
    if (!data?.topics) return [];

    let list = [...data.topics];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    // Status tab filter
    if (statusFilter === 'NEEDS_REVIEW') {
      list = list.filter((t) => t.status === 'Needs Review');
    } else if (statusFilter === 'PROFICIENT') {
      list = list.filter((t) => t.status === 'Proficient');
    } else if (statusFilter === 'MASTERED') {
      list = list.filter((t) => t.status === 'Mastered');
    } else if (statusFilter === 'UNATTEMPTED') {
      list = list.filter((t) => t.status === 'Unattempted');
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'PRIORITY') {
        const statusPriority: Record<string, number> = {
          'Needs Review': 1,
          'Proficient': 2,
          'Unattempted': 3,
          'Mastered': 4,
        };
        const pDiff = statusPriority[a.status] - statusPriority[b.status];
        if (pDiff !== 0) return pDiff;
        if (a.status === 'Needs Review' || a.status === 'Proficient') {
          return a.accuracy - b.accuracy;
        }
        return b.totalQuestions - a.totalQuestions;
      }
      if (sortBy === 'ACCURACY_DESC') return b.accuracy - a.accuracy;
      if (sortBy === 'ACCURACY_ASC') return a.accuracy - b.accuracy;
      if (sortBy === 'QUESTIONS_DESC') return b.totalQuestions - a.totalQuestions;
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [data, searchQuery, statusFilter, sortBy]);

  const handleDrillQuest = (topicName: string) => {
    onOpenChange(false);
    if (onNavigateToQuest && subjectName) {
      onNavigateToQuest(subjectName, topicName);
    } else if (subjectName) {
      router.push(`/quest?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topicName)}`);
    } else {
      router.push(`/quest?topic=${encodeURIComponent(topicName)}`);
    }
  };

  const handleStudyModule = () => {
    onOpenChange(false);
    if (onNavigateToStudy && subjectName) {
      onNavigateToStudy(subjectName);
    } else if (subjectName) {
      router.push(`/study?subject=${encodeURIComponent(subjectName)}`);
    } else {
      router.push('/study');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-[90vw] md:w-[85vw] h-[90dvh] sm:h-[85dvh] max-h-[92dvh] sm:max-h-[88dvh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-2 border-primary/20 shadow-2xl rounded-2xl sm:rounded-3xl">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-border/80 p-3 sm:p-5 md:p-6 shrink-0">
          <div className="flex items-start justify-between gap-3 sm:gap-4 relative z-10 pr-9 sm:pr-10">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm shrink-0">
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Topic Mastery Breakdown
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground whitespace-nowrap hidden xs:inline sm:inline">
                    Licensure Board Syllabus
                  </span>
                </div>
                <DialogTitle className="text-base sm:text-xl md:text-2xl font-black font-headline tracking-tight text-foreground uppercase break-words leading-tight">
                  {subjectName || 'Discipline Topics'}
                </DialogTitle>
                <DialogDescription className="text-[10.5px] sm:text-xs text-muted-foreground font-medium line-clamp-2 sm:line-clamp-none">
                  Granular student performance, question accuracy, and targeted drill recommendations.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick Stats Metric Pills Skeleton when loading initially */}
          {loading && !data && (
            <div className="grid grid-cols-6 sm:grid-cols-5 gap-1.5 sm:gap-2.5 mt-2.5 sm:mt-4 pt-2 sm:pt-3.5 border-t border-border/60">
              <div className="col-span-2 sm:col-span-1 h-12 sm:h-14 rounded-xl bg-muted/50 border border-border/40 animate-pulse" />
              <div className="col-span-2 sm:col-span-1 h-12 sm:h-14 rounded-xl bg-emerald-500/5 border border-emerald-500/15 animate-pulse" />
              <div className="col-span-2 sm:col-span-1 h-12 sm:h-14 rounded-xl bg-blue-500/5 border border-blue-500/15 animate-pulse" />
              <div className="col-span-3 sm:col-span-1 h-12 sm:h-14 rounded-xl bg-amber-500/5 border border-amber-500/15 animate-pulse" />
              <div className="col-span-3 sm:col-span-1 h-12 sm:h-14 rounded-xl bg-primary/5 border border-primary/15 animate-pulse" />
            </div>
          )}

          {/* Quick Stats Metric Pills */}
          {data && (
            <div className="grid grid-cols-6 sm:grid-cols-5 gap-1.5 sm:gap-2.5 mt-2.5 sm:mt-4 pt-2 sm:pt-3.5 border-t border-border/60">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={cn(
                  "col-span-2 sm:col-span-1 bg-background/80 backdrop-blur-sm border rounded-xl p-1.5 sm:p-2.5 text-center transition-all duration-200 cursor-pointer hover:border-primary/50 active:scale-[0.98]",
                  statusFilter === 'ALL'
                    ? "border-primary/60 ring-1 ring-primary/40 shadow-xs"
                    : "border-border/80"
                )}
                title="Filter: All Topics"
              >
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-muted-foreground block truncate">
                  Total Topics
                </span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-foreground">
                  {data.totalTopics}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('MASTERED')}
                className={cn(
                  "col-span-2 sm:col-span-1 bg-emerald-500/10 border rounded-xl p-1.5 sm:p-2.5 text-center transition-all duration-200 cursor-pointer hover:border-emerald-500/60 active:scale-[0.98]",
                  statusFilter === 'MASTERED'
                    ? "border-emerald-500/70 ring-1 ring-emerald-500/50 shadow-xs"
                    : "border-emerald-500/25"
                )}
                title="Filter: Mastered Topics"
              >
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                  Mastered
                </span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {data.masteredCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PROFICIENT')}
                className={cn(
                  "col-span-2 sm:col-span-1 bg-blue-500/10 border rounded-xl p-1.5 sm:p-2.5 text-center transition-all duration-200 cursor-pointer hover:border-blue-500/60 active:scale-[0.98]",
                  statusFilter === 'PROFICIENT'
                    ? "border-blue-500/70 ring-1 ring-blue-500/50 shadow-xs"
                    : "border-blue-500/25"
                )}
                title="Filter: Proficient Topics"
              >
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block truncate">
                  Proficient
                </span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-blue-600 dark:text-blue-400">
                  {data.proficientCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('NEEDS_REVIEW')}
                className={cn(
                  "col-span-3 sm:col-span-1 bg-amber-500/10 border rounded-xl p-1.5 sm:p-2.5 text-center transition-all duration-200 cursor-pointer hover:border-amber-500/60 active:scale-[0.98]",
                  statusFilter === 'NEEDS_REVIEW'
                    ? "border-amber-500/70 ring-1 ring-amber-500/50 shadow-xs"
                    : "border-amber-500/25"
                )}
                title="Filter: Needs Review Topics"
              >
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block truncate">
                  Needs Review
                </span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                  {data.needsReviewCount}
                </span>
              </button>

              <div
                className="col-span-3 sm:col-span-1 bg-primary/10 border border-primary/25 rounded-xl p-1.5 sm:p-2.5 text-center select-none"
              >
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-primary block truncate">
                  Avg Accuracy
                </span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-primary">
                  {data.overallAccuracy > 0 ? `${data.overallAccuracy}%` : (overallMastery ? `${overallMastery}%` : '0%')}
                </span>
              </div>
            </div>
          )}

          {/* Topic Coverage Gate Notice */}
          {data && (
            <div className="mt-2 sm:mt-2.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-background/80 border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground font-medium text-[11px]">Subject Topic Mastery:</span>
                <span className="font-bold text-foreground font-mono text-xs">
                  {data.totalTopics > 0 ? (
                    <>
                      {Math.round(((data.masteredCount + data.proficientCount) / data.totalTopics) * 100)}%
                      <span className="text-muted-foreground font-normal ml-1 text-[11px]">
                        ({data.masteredCount + data.proficientCount}/{data.totalTopics} Passing)
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground font-normal text-[11px]">
                      0% (No Topics Available Yet)
                    </span>
                  )}
                </span>
              </div>
              {data.totalTopics > 0 ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9.5px] font-bold uppercase py-0.5 px-2 rounded-lg shrink-0",
                    ((data.masteredCount + data.proficientCount) / data.totalTopics) >= 0.75
                      ? "text-emerald-500 border-emerald-500/40 bg-emerald-500/10"
                      : "text-amber-500 border-amber-500/40 bg-amber-500/10"
                  )}
                >
                  {((data.masteredCount + data.proficientCount) / data.totalTopics) >= 0.75
                    ? "✓ Goal Met (≥75%)"
                    : `Goal: Need ${Math.max(1, Math.ceil(data.totalTopics * 0.75) - (data.masteredCount + data.proficientCount))} more for Proficient`}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[9.5px] font-medium uppercase py-0.5 px-2 rounded-lg shrink-0 text-muted-foreground border-border bg-muted/40"
                >
                  Syllabus In Preparation
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Toolbar: Search, Filter Tabs & Sort Dropdown */}
        <div className="p-2.5 sm:p-3.5 bg-muted/30 border-b border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g., Enzymes, Cocci, Urinalysis)..."
              className="pl-9 h-8 sm:h-9 text-xs rounded-xl bg-background border-border focus-visible:ring-primary/30"
            />
          </div>

          {/* Controls: Sort Dropdown + Refresh Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="flex-1 sm:flex-none">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger className="h-8 sm:h-9 w-full sm:w-[200px] md:w-[220px] text-xs font-semibold rounded-xl bg-background border border-border/80 shadow-xs hover:bg-muted/60 hover:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all duration-200 gap-2 cursor-pointer">
                  <div className="flex items-center gap-2 truncate">
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Sort topics..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card shadow-xl z-[70]">
                  <SelectItem value="PRIORITY" className="text-xs font-semibold cursor-pointer">
                    Priority (Weakest First)
                  </SelectItem>
                  <SelectItem value="ACCURACY_DESC" className="text-xs font-semibold cursor-pointer">
                    Highest Accuracy
                  </SelectItem>
                  <SelectItem value="ACCURACY_ASC" className="text-xs font-semibold cursor-pointer">
                    Lowest Accuracy
                  </SelectItem>
                  <SelectItem value="QUESTIONS_DESC" className="text-xs font-semibold cursor-pointer">
                    Most Questions
                  </SelectItem>
                  <SelectItem value="NAME_ASC" className="text-xs font-semibold cursor-pointer">
                    Topic Name (A-Z)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="icon"
              variant="outline"
              onClick={refreshData}
              disabled={loading}
              title="Refresh Topic Analytics"
              className="h-8 sm:h-9 w-8 sm:w-9 rounded-xl border border-border/80 bg-background hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 shrink-0 cursor-pointer shadow-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-primary")} />
            </Button>
          </div>
        </div>

        {/* Status Filter Tab Pills */}
        <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-border/60 bg-muted/20 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatusFilter('ALL')}
            className={cn(
              "h-7 px-2.5 text-[10.5px] sm:text-[11px] rounded-lg font-bold shrink-0 transition-all duration-200",
              statusFilter === 'ALL'
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                : "border border-border/80 bg-background/60 text-foreground hover:bg-muted hover:border-border"
            )}
          >
            All ({data?.totalTopics || 0})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatusFilter('NEEDS_REVIEW')}
            className={cn(
              "h-7 px-2.5 text-[10.5px] sm:text-[11px] rounded-lg font-bold shrink-0 flex items-center gap-1 transition-all duration-200",
              statusFilter === 'NEEDS_REVIEW'
                ? "bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                : "border border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60 hover:text-amber-900 dark:hover:text-amber-200"
            )}
          >
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Needs Review ({data?.needsReviewCount || 0})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatusFilter('PROFICIENT')}
            className={cn(
              "h-7 px-2.5 text-[10.5px] sm:text-[11px] rounded-lg font-bold shrink-0 flex items-center gap-1 transition-all duration-200",
              statusFilter === 'PROFICIENT'
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                : "border border-blue-500/35 bg-blue-500/10 text-blue-800 dark:text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/60 hover:text-blue-900 dark:hover:text-blue-200"
            )}
          >
            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Proficient ({data?.proficientCount || 0})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatusFilter('MASTERED')}
            className={cn(
              "h-7 px-2.5 text-[10.5px] sm:text-[11px] rounded-lg font-bold shrink-0 flex items-center gap-1 transition-all duration-200",
              statusFilter === 'MASTERED'
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                : "border border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 hover:text-emerald-900 dark:hover:text-emerald-200"
            )}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Mastered ({data?.masteredCount || 0})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatusFilter('UNATTEMPTED')}
            className={cn(
              "h-7 px-2.5 text-[10.5px] sm:text-[11px] rounded-lg font-bold shrink-0 flex items-center gap-1 transition-all duration-200",
              statusFilter === 'UNATTEMPTED'
                ? "bg-foreground text-background hover:bg-foreground/90 shadow-xs"
                : "border border-border/80 bg-background/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
            )}
          >
            <HelpCircle className="w-3 h-3" />
            Unattempted ({data?.unattemptedCount || 0})
          </Button>
        </div>

        {/* Scrollable Topics Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-semibold">Aggregating topic metrics from question bank...</p>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h4 className="text-sm font-bold text-foreground">No topics found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? `No topics match "${searchQuery}". Try a different keyword.`
                  : "No topic metrics recorded for this filter category."}
              </p>
              {searchQuery && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs rounded-xl border border-border/80 bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-200 cursor-pointer"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isMastered = topic.status === 'Mastered';
              const isProficient = topic.status === 'Proficient';
              const isNeedsReview = topic.status === 'Needs Review';
              const isUnattempted = topic.status === 'Unattempted';

              return (
                <div
                  key={topic.name}
                  className="p-3 sm:p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all duration-200 space-y-2.5 sm:space-y-3 group"
                >
                  {/* Topic Title & Status Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm md:text-base text-foreground font-headline break-words leading-snug">
                        {topic.name}
                      </h4>
                      <div className="text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span>
                          <strong className="text-foreground font-mono">{topic.totalQuestions}</strong> {topic.totalQuestions === 1 ? 'question' : 'questions'}
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span>
                          <strong className="text-primary font-mono">{topic.attemptedQuestions}</strong> answered
                        </span>
                        {topic.totalAttempts > 0 && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span>
                              <strong className="text-foreground font-mono">{topic.totalAttempts}</strong> {topic.totalAttempts === 1 ? 'drill' : 'drills'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] sm:text-[9.5px] font-extrabold uppercase px-2 sm:px-2.5 py-0.5 rounded-lg shrink-0 flex items-center gap-1 whitespace-nowrap",
                        isMastered && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                        isProficient && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
                        isNeedsReview && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                        isUnattempted && "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {isMastered && <ShieldCheck className="w-3 h-3" />}
                      {isProficient && <CheckCircle2 className="w-3 h-3" />}
                      {isNeedsReview && <AlertTriangle className="w-3 h-3" />}
                      {isUnattempted && <HelpCircle className="w-3 h-3" />}
                      {topic.status}
                    </Badge>
                  </div>

                  {/* Accuracy Bar & Performance Percentage */}
                  <div className="space-y-1.5 pt-1 border-t border-border/40">
                    <div className="flex justify-between items-center text-[10.5px] sm:text-[11px] font-semibold gap-2">
                      <span className="text-muted-foreground truncate">
                        {isUnattempted ? 'Drill Accuracy (Untested)' : 'Diagnostic Accuracy'}
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold text-[11px] sm:text-xs shrink-0",
                          isMastered && "text-emerald-600 dark:text-emerald-400",
                          isProficient && "text-blue-600 dark:text-blue-400",
                          isNeedsReview && "text-amber-600 dark:text-amber-400",
                          isUnattempted && "text-muted-foreground"
                        )}
                      >
                        {isUnattempted ? '0%' : `${topic.accuracy}% (${topic.totalCorrect}/${topic.totalAttempts} correct)`}
                      </span>
                    </div>

                    <Progress
                      value={isUnattempted ? 0 : topic.accuracy}
                      className={cn(
                        "h-1.5 sm:h-2 rounded-full bg-muted",
                        isMastered && "[&>div]:bg-emerald-500",
                        isProficient && "[&>div]:bg-blue-500",
                        isNeedsReview && "[&>div]:bg-amber-500"
                      )}
                    />
                  </div>

                  {/* Bottom Action Drill Button */}
                  <div className="flex items-center justify-end pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDrillQuest(topic.name)}
                      className="w-full sm:w-auto h-8 px-3.5 text-xs font-bold rounded-xl border border-primary/40 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-md cursor-pointer"
                    >
                      <Sword className="w-3.5 h-3.5" />
                      Drill Topic in Quest
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-2.5 sm:p-4 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 shrink-0">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium text-center sm:text-left order-2 sm:order-1 line-clamp-1 sm:line-clamp-none">
            Topic accuracy is updated dynamically as you answer questions in Quest Arena and Practice Exams.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleStudyModule}
              className="flex-1 sm:flex-none h-8 sm:h-9 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-border/80 bg-background hover:bg-muted hover:border-border text-foreground transition-all duration-200 active:scale-95 shadow-xs cursor-pointer px-3 sm:px-4"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Study Hub
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none h-8 sm:h-9 text-xs font-bold rounded-xl px-4 sm:px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
