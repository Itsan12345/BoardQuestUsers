import { format } from 'date-fns';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GuidanceAssignmentRecord } from '../types';

interface GuidanceBannerProps {
  guidanceList: GuidanceAssignmentRecord[];
  onSelectGuidance: (guidance: GuidanceAssignmentRecord) => void;
}

export function GuidanceBanner({ guidanceList, onSelectGuidance }: GuidanceBannerProps) {
  if (guidanceList.length === 0) return null;

  const activeCount = guidanceList.filter(
    (g) => g.status === 'IN_PROGRESS' || g.status === 'PENDING'
  ).length;

  return (
    <Card className="border border-border shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3 bg-muted/20 border-b border-border/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            Academic Counseling & Faculty Guidance
          </CardTitle>
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
            {activeCount} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3">
        {guidanceList.map((g) => {
          const isResolved = g.status === 'RESOLVED' || g.status === 'COMPLETED';
          return (
            <div
              key={g.id}
              onClick={() => onSelectGuidance(g)}
              className={cn(
                'p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm',
                isResolved
                  ? 'bg-muted/30 border-border/60 hover:bg-muted/50'
                  : 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10'
              )}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={cn(
                      'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5',
                      isResolved
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                    )}
                  >
                    {isResolved ? 'Resolved' : 'Active Counseling'}
                  </Badge>
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {g.subjectCategory}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Advisor: <span className="font-medium text-foreground">{g.advisor.name}</span> (
                  {g.advisor.role}) • Assigned {format(new Date(g.createdAt), 'MMM dd, yyyy')}
                </p>

                {g.guidanceNotes && (
                  <p className="text-xs text-foreground/80 italic line-clamp-1">
                    &ldquo;{g.guidanceNotes}&rdquo;
                  </p>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 border-border/80"
              >
                View Brief <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

