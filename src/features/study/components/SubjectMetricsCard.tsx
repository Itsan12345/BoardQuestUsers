import { format } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2, Brain, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSubjectVolumeBenchmark } from '@/lib/game-logic';
import { cn } from '@/lib/utils';
import type { SubjectMetrics, CurriculumCategory } from '../types';

interface SubjectMetricsCardProps {
  selectedCategory: CurriculumCategory;
  subjectPlan?: { startDate: Date; endDate: Date };
  metric?: SubjectMetrics;
  mounted: boolean;
  onOpenTimeline: () => void;
}

export function SubjectMetricsCard({
  selectedCategory,
  subjectPlan,
  metric,
  mounted,
  onOpenTimeline,
}: SubjectMetricsCardProps) {
  const currentProficiency = metric?.proficiency ?? metric?.mastery ?? 0;
  const currentCompletion = metric?.completion ?? 0;
  const currentMasteryStatus = metric?.masteryStatus || 'Not Started';

  return (
    <Card
      id="tour-study-metrics"
      className="border border-border shadow-xs rounded-2xl sm:rounded-[2rem] bg-muted border-2 border-border overflow-hidden"
    >
      <CardHeader className="p-4 sm:p-6 pb-4 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1">
            <CardTitle className="font-headline font-semibold text-lg sm:text-xl lg:text-2xl text-foreground uppercase">
              {selectedCategory.title}
            </CardTitle>
            <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Subject Parameters
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenTimeline}
            className={cn(
              'group rounded-2xl border-2 px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer text-left',
              subjectPlan
                ? 'border-primary/40 bg-primary/10 hover:bg-primary/15 hover:border-primary/60 text-primary shadow-xs'
                : 'border-dashed border-border hover:border-primary/50 bg-card/60 hover:bg-primary/5 text-muted-foreground hover:text-foreground'
            )}
            title="Manage schedule in Study Schedule & Timeline"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                subjectPlan
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
              )}
            >
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground leading-none">
                  Study Period Target
                </p>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-xs sm:text-[13px] font-black leading-tight text-foreground mt-0.5 truncate">
                {mounted && subjectPlan ? (
                  `${format(subjectPlan.startDate, 'MMM dd')} - ${format(
                    subjectPlan.endDate,
                    'MMM dd, yyyy'
                  )}`
                ) : (
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    + Schedule in Timeline
                  </span>
                )}
              </p>
            </div>
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4 pt-2">
          {/* Completion Metric */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[11px] sm:text-xs font-semibold uppercase text-foreground flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                Completion
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-foreground">
                {currentCompletion}%
              </span>
            </div>
            <Progress value={currentCompletion} className="h-2 sm:h-2.5 bg-secondary" />
          </div>

          {/* Mastery Metric */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[11px] sm:text-xs font-semibold uppercase text-primary flex items-center gap-1.5 sm:gap-2">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                Subject Proficiency (Quest Avg)
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-xs font-semibold text-foreground">
                  {currentProficiency}%
                </span>
                <span
                  title={
                    currentMasteryStatus === 'Mastered'
                      ? 'Mastered: ≥90% Proficiency, ≥85% Topic Mastery, and ≥75% Syllabus Completion'
                      : currentMasteryStatus === 'Proficient'
                      ? 'Proficient: ≥75% Proficiency, ≥75% Topic Mastery, and ≥25% Syllabus Completion'
                      : 'In Training: Reach ≥75% Proficiency, ≥75% Topic Mastery, and ≥25% Syllabus Completion to unlock Proficient'
                  }
                  className={cn(
                    'text-[8px] sm:text-[9px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full uppercase cursor-help',
                    currentMasteryStatus === 'Mastered'
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                      : currentMasteryStatus === 'Proficient'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      : currentMasteryStatus === 'In Training'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                      : 'bg-secondary text-slate-600 dark:text-slate-400'
                  )}
                >
                  {currentMasteryStatus}
                </span>
              </div>
            </div>
            <Progress value={currentProficiency} className="h-2 sm:h-2.5 bg-secondary" />
            <p className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold">
              {metric && metric.totalQuestionsAnswered > 0
                ? `Based on Quest Arena performance (${metric.mastery}% accuracy • ${
                    metric.totalQuestionsAnswered
                  }/${
                    metric.volumeBenchmark ||
                    getSubjectVolumeBenchmark(
                      selectedCategory?.title || metric.subject,
                      metric.totalAvailableQuestions
                    )
                  } volume weight)`
                : 'Based on your average performance in Quest Arena for this subject'}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

