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
      router.push(`/quest?subject=${encodeURIComponent(subjectName)}`);
    } else {
      router.push('/quest');
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
      <DialogContent className="max-w-3xl w-[95vw] sm:w-[90vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-2 border-primary/20 shadow-2xl rounded-2xl sm:rounded-3xl">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-border/80 p-5 sm:p-6 shrink-0">
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm shrink-0">
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Topic Mastery Breakdown
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Licensure Board Syllabus
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black font-headline tracking-tight text-foreground uppercase">
                  {subjectName || 'Discipline Topics'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-medium">
                  Granular student performance, question accuracy, and targeted drill recommendations.
                </DialogDescription>
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={refreshData}
              disabled={loading}
              title="Refresh Topic Analytics"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground shrink-0 hidden sm:flex"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-primary")} />
            </Button>
          </div>

          {/* Quick Stats Metric Pills */}
          {data && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-border/60">
              <div className="bg-background/80 backdrop-blur-sm border border-border/80 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Topics</span>
                <span className="text-base sm:text-lg font-black font-mono text-foreground">{data.totalTopics}</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Mastered</span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{data.masteredCount}</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Needs Review</span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-400">{data.needsReviewCount}</span>
              </div>
              <div className="bg-primary/10 border border-primary/25 rounded-xl p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-primary block">Avg Accuracy</span>
                <span className="text-base sm:text-lg font-black font-mono text-primary">
                  {data.overallAccuracy > 0 ? `${data.overallAccuracy}%` : (overallMastery ? `${overallMastery}%` : '0%')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Search, Filter Tabs & Sort Dropdown */}
        <div className="p-3.5 sm:p-4 bg-muted/30 border-b border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g., Enzymes, Cocci, Urinalysis)..."
              className="pl-9 h-9 text-xs rounded-xl bg-background border-border focus-visible:ring-primary/30"
            />
          </div>

          {/* Sort Selector */}
          <div className="shrink-0 w-full sm:w-auto">
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="h-9 w-full sm:w-[210px] text-xs font-semibold rounded-xl bg-background border-border shadow-xs focus:ring-1 focus:ring-primary/40 gap-2">
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
        </div>

        {/* Status Filter Tab Pills */}
        <div className="px-4 py-2 border-b border-border/60 bg-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <Button
            size="sm"
            variant={statusFilter === 'ALL' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('ALL')}
            className={cn("h-7 px-2.5 text-[11px] rounded-lg font-bold shrink-0", statusFilter === 'ALL' && "shadow-xs")}
          >
            All ({data?.totalTopics || 0})
          </Button>

          <Button
            size="sm"
            variant={statusFilter === 'NEEDS_REVIEW' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('NEEDS_REVIEW')}
            className={cn(
              "h-7 px-2.5 text-[11px] rounded-lg font-bold shrink-0 flex items-center gap-1",
              statusFilter === 'NEEDS_REVIEW'
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            Needs Review ({data?.needsReviewCount || 0})
          </Button>

          <Button
            size="sm"
            variant={statusFilter === 'PROFICIENT' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('PROFICIENT')}
            className={cn(
              "h-7 px-2.5 text-[11px] rounded-lg font-bold shrink-0 flex items-center gap-1",
              statusFilter === 'PROFICIENT'
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
            )}
          >
            <CheckCircle2 className="w-3 h-3" />
            Proficient ({data?.proficientCount || 0})
          </Button>

          <Button
            size="sm"
            variant={statusFilter === 'MASTERED' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('MASTERED')}
            className={cn(
              "h-7 px-2.5 text-[11px] rounded-lg font-bold shrink-0 flex items-center gap-1",
              statusFilter === 'MASTERED'
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            )}
          >
            <ShieldCheck className="w-3 h-3" />
            Mastered ({data?.masteredCount || 0})
          </Button>

          <Button
            size="sm"
            variant={statusFilter === 'UNATTEMPTED' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('UNATTEMPTED')}
            className={cn(
              "h-7 px-2.5 text-[11px] rounded-lg font-bold shrink-0 flex items-center gap-1",
              statusFilter === 'UNATTEMPTED'
                ? "bg-muted-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <HelpCircle className="w-3 h-3" />
            Unattempted ({data?.unattemptedCount || 0})
          </Button>
        </div>

        {/* Scrollable Topics Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-[260px] max-h-[50vh]">
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
                  className="mt-2 text-xs rounded-xl"
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
                  className="p-3.5 sm:p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-all duration-150 space-y-3 group"
                >
                  {/* Topic Title & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-foreground font-headline truncate">
                        {topic.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2 flex-wrap">
                        <span>
                          <strong className="text-foreground font-mono">{topic.totalQuestions}</strong> questions in bank
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-primary font-mono">{topic.attemptedQuestions}</strong> answered
                        </span>
                        {topic.totalAttempts > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              <strong className="text-foreground font-mono">{topic.totalAttempts}</strong> total drills
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg shrink-0 flex items-center gap-1",
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
                    <div className="flex justify-between items-center text-[11px] font-semibold">
                      <span className="text-muted-foreground">
                        {isUnattempted ? 'Drill Accuracy (Untested)' : 'Diagnostic Accuracy'}
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold text-xs",
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
                        "h-2 rounded-full bg-muted",
                        isMastered && "[&>div]:bg-emerald-500",
                        isProficient && "[&>div]:bg-blue-500",
                        isNeedsReview && "[&>div]:bg-amber-500"
                      )}
                    />
                  </div>

                  {/* Bottom Action Drill Button */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDrillQuest(topic.name)}
                      className="h-8 px-3 text-xs font-bold rounded-lg border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-1.5 transition-all shadow-xs"
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
        <div className="p-3.5 sm:p-4 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-muted-foreground font-medium text-center sm:text-left">
            Topic accuracy is updated dynamically as you answer questions in Quest Arena and Practice Exams.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleStudyModule}
              className="h-8 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Study Hub
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs font-bold rounded-xl px-4"
            >
              Close
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
