import Link from 'next/link';
import { format, differenceInCalendarDays, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TargetExamCardProps {
  targetExamDate: Date | null;
}

export function TargetExamCard({ targetExamDate }: TargetExamCardProps) {
  return (
    <Card className="border-2 border-border shadow-sm rounded-2xl bg-background overflow-hidden">
      <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-sm',
              targetExamDate
                ? 'bg-red-50 dark:bg-red-950/40 border-primary/20 text-primary'
                : 'bg-muted/50 border-border text-muted-foreground'
            )}
          >
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p
              className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-widest truncate"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Target Board Exam (MTLE)
            </p>
            <h3
              className="text-sm sm:text-base lg:text-lg font-medium text-foreground truncate"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {targetExamDate ? format(targetExamDate, 'MMMM d, yyyy') : 'No Target Date Set'}
            </h3>
          </div>
        </div>

        {targetExamDate ? (
          (() => {
            const today = startOfDay(new Date());
            const daysLeft = differenceInCalendarDays(startOfDay(targetExamDate), today);

            return (
              <div className="flex items-center justify-center gap-2 shrink-0">
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-muted/40 border border-border/80 flex items-baseline gap-1.5 shadow-sm">
                  <span
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-none"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {daysLeft > 0 ? daysLeft : daysLeft === 0 ? '0' : Math.abs(daysLeft)}
                  </span>
                  <span
                    className="text-[9px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {daysLeft > 0 ? 'DAYS LEFT' : daysLeft === 0 ? 'EXAM TODAY' : 'DAYS AGO'}
                  </span>
                </div>
                <Link href="/profile?openSettings=true&tab=profile&focus=targetExam">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Edit Target MTLE Board Schedule"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center shrink-0">
            <Link href="/profile?openSettings=true&tab=profile&focus=targetExam">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/60 text-xs font-semibold h-9 px-3 transition-colors"
              >
                Set Target Date
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

