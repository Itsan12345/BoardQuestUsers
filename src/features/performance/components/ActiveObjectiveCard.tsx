import Link from 'next/link';
import { format } from 'date-fns';
import { Target, Clock, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { NextObjective } from '../types';

interface ActiveObjectiveCardProps {
  nextObjective: NextObjective | null;
  daysRemaining: number;
  subjectMastery: number;
}

export function ActiveObjectiveCard({
  nextObjective,
  daysRemaining,
  subjectMastery,
}: ActiveObjectiveCardProps) {
  return (
    <Card className="border-2 border-border shadow-sm rounded-2xl bg-background p-4 sm:p-5 xl:p-6 space-y-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
          <h3
            className="text-[11px] xl:text-xs font-semibold uppercase tracking-wider xl:tracking-widest text-primary"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Active Mission Objective
          </h3>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] xl:text-[10px] font-bold border-primary/30 text-primary px-2 py-0.5 shrink-0"
        >
          Curriculum Milestone
        </Badge>
      </div>

      {nextObjective ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
              Focus Subject
            </p>
            <h4
              className="text-base sm:text-lg font-bold text-foreground leading-tight"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {nextObjective.subject}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs">
            <div>
              <span className="text-[9px] font-bold uppercase text-muted-foreground block">
                Target Date
              </span>
              <span className="font-bold text-primary flex items-center gap-1 mt-0.5">
                <CalendarIcon className="w-3 h-3 shrink-0" />
                {format(
                  new Date(
                    nextObjective.endDate ||
                      nextObjective.targetDate ||
                      nextObjective.createdAt ||
                      new Date()
                  ),
                  'MMM dd, yyyy'
                )}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase text-muted-foreground block">
                Time Left
              </span>
              <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-primary shrink-0" />
                {Math.max(0, daysRemaining)} Days
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-muted-foreground">Mastery Level</span>
              <span className="text-primary">{subjectMastery}%</span>
            </div>
            <Progress value={subjectMastery} className="h-2 rounded-full" />
          </div>

          <Link
            href={`/study?subject=${encodeURIComponent(nextObjective.subject)}`}
            className="block"
          >
            <Button
              variant="outline"
              className="w-full h-9 rounded-xl text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 flex items-center justify-center gap-1 transition-colors"
            >
              <span>Deploy Target Milestone</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="py-5 text-center space-y-2">
          <Target className="w-8 h-8 text-muted-foreground/30 mx-auto" />
          <p
            className="text-xs font-medium text-muted-foreground leading-relaxed"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            No active objective scheduled.{' '}
            <Link href="/study?tab=timeline" className="text-primary font-semibold hover:underline">
              Visit Study Subjects
            </Link>{' '}
            to deploy target milestones.
          </p>
        </div>
      )}
    </Card>
  );
}

