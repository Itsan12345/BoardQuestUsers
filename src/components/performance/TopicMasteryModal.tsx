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
      <DialogContent className="max-w-3xl w-[95vw] sm:w-[90vw] md:w-[85vw] max-h-[92vh] sm:max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-2 border-primary/20 shadow-2xl rounded-2xl sm:rounded-3xl">
        
        {/* Top Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-border/80 p-3.5 sm:p-5 md:p-6 shrink-0">
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

          {/* Quick Stats Metric Pills */}
          {data && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5 mt-3 sm:mt-4 pt-2.5 sm:pt-3.5 border-t border-border/60">
              <div className="bg-background/80 backdrop-blur-sm border border-border/80 rounded-xl p-1.5 sm:p-2.5 text-center">
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-muted-foreground block truncate">Total Topics</span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-foreground">{data.totalTopics}</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-1.5 sm:p-2.5 text-center">
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block truncate">Mastered</span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{data.masteredCount}</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-1.5 sm:p-2.5 text-center">
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block truncate">Needs Review</span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-amber-600 dark:text-amber-400">{data.needsReviewCount}</span>
              </div>
              <div className="bg-primary/10 border border-primary/25 rounded-xl p-1.5 sm:p-2.5 text-center">
                <span className="text-[8.5px] sm:text-[10px] uppercase font-bold text-primary block truncate">Avg Accuracy</span>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-primary">
                  {data.overallAccuracy > 0 ? `${data.overallAccuracy}%` : (overallMastery ? `${overallMastery}%` : '0%')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Search, Filter Tabs & Sort Dropdown */}
        <div className="p-3 sm:p-4 bg-muted/30 border-b border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
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

          {/* Controls: Sort Dropdown + Refresh Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="flex-1 sm:flex-none">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger className="h-9 w-full sm:w-[200px] md:w-[220px] text-xs font-semibold rounded-xl bg-background border border-border/80 shadow-xs hover:bg-muted/60 hover:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all duration-200 gap-2 cursor-pointer">
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
              className="h-9 w-9 rounded-xl border border-border/80 bg-background hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 shrink-0 cursor-pointer shadow-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-primary")} />
            </Button>
          </div>
        </div>

        {/* Status Filter Tab Pills */}
        <div className="px-3 sm:px-4 py-2 border-b border-border/60 bg-muted/20 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3 min-h-[220px] max-h-[50vh]">
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
        <div className="p-3 sm:p-4 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium text-center sm:text-left order-2 sm:order-1">
            Topic accuracy is updated dynamically as you answer questions in Quest Arena and Practice Exams.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleStudyModule}
              className="flex-1 sm:flex-none h-8 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-border/80 bg-background hover:bg-muted hover:border-border text-foreground transition-all duration-200 active:scale-95 shadow-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Study Hub
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none h-8 text-xs font-bold rounded-xl px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
