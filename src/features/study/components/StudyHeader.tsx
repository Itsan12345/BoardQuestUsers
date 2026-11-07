import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  BookOpen,
  Search,
  Building2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { calculateRemainingTime } from '@/lib/study-timer';
import { cn } from '@/lib/utils';
import type { CalendarEventData } from '../types';

interface StudyHeaderProps {
  activeTab: 'modules' | 'timeline';
  onTabChange: (tab: 'modules' | 'timeline') => void;
  program: CalendarEventData | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function StudyHeader({
  activeTab,
  onTabChange,
  program,
  searchQuery,
  onSearchChange,
}: StudyHeaderProps) {
  return (
    <header id="tour-study-header" className="bg-background border-b px-4 py-4 sm:px-6 sm:py-6 xl:py-10">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 xl:space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-1.5">
            <h1
              className="text-2xl sm:text-3xl xl:text-4xl font-black text-foreground tracking-tight leading-none uppercase"
              style={{ fontFamily: "'Inter-bold', sans-serif" }}
            >
              Study <span className="text-primary">Subjects</span>
            </h1>
            <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em]">
              Intel Gathering & Concept Mastery
            </p>
          </div>

          {/* Dynamic Review Center Program Deadline - Only displayed in Syllabus Curriculum tab */}
          {activeTab === 'modules' && (
            program ? (
              <div
                id="tour-study-program"
                className="bg-card border-2 border-border/80 hover:border-primary/30 transition-all rounded-2xl p-3.5 sm:p-4 xl:p-5 shadow-xs space-y-2 w-full sm:w-auto min-w-0 sm:min-w-[280px] xl:min-w-[340px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">
                      Final Deadline
                    </span>
                  </div>
                  {(() => {
                    const remaining = calculateRemainingTime(program.endDate);
                    return (
                      <span
                        className={cn(
                          'text-[8px] sm:text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider border shrink-0 transition-colors',
                          remaining.isCritical
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40 animate-pulse font-black'
                            : remaining.isEndingToday
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40 font-black'
                            : remaining.isEndingTomorrow
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'
                            : remaining.isExpired
                            ? 'bg-muted text-muted-foreground border-border'
                            : remaining.calendarDays <= 14
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
                        )}
                      >
                        {remaining.isEndingToday
                          ? `Due Today (${remaining.short})`
                          : remaining.isEndingTomorrow
                          ? 'Ends Tomorrow'
                          : remaining.isExpired
                          ? 'Expired'
                          : `${remaining.calendarDays} days left`}
                      </span>
                    );
                  })()}
                </div>

                <div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-black text-foreground tracking-tight leading-none">
                    {format(new Date(program.endDate), 'MMMM dd, yyyy')}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground truncate pt-0.5 border-t border-border/40">
                  <Building2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-semibold text-foreground/90 capitalize truncate">
                    {program.authorName || program.companyName || 'Super Admin'}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="font-medium truncate">{program.title}</span>
                  {program.labels && program.labels.length > 0 && (
                    <>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="font-medium truncate capitalize">
                        {Array.isArray(program.labels)
                          ? program.labels.join(', ')
                          : String(program.labels)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card border-2 border-border rounded-2xl p-3.5 sm:p-4 lg:p-5 flex items-center gap-3 text-foreground shadow-xs w-full sm:w-auto">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Final Deadline
                  </p>
                  <p className="text-xs font-bold text-foreground">Loading schedule...</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Segmented Tab Switcher: Curriculum vs Study Timeline */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center p-1 bg-muted/80 border border-border/80 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => onTabChange('modules')}
              className={cn(
                'flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer',
                activeTab === 'modules'
                  ? 'bg-card text-foreground shadow-sm border border-border/70'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Syllabus Curriculum</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('timeline')}
              className={cn(
                'flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer relative',
                activeTab === 'timeline'
                  ? 'bg-card text-foreground shadow-sm border border-border/70'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarDays className="w-4 h-4 text-primary" />
              <span>Study Schedule & Timeline</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </button>
          </div>
        </div>

        {/* Search Bar (Only shown in Curriculum tab) */}
        {activeTab === 'modules' && (
          <div className="relative">
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search subjects or modules..."
              className="pl-10 sm:pl-12 pr-10 h-11 sm:h-14 bg-muted border-2 border-border rounded-xl sm:rounded-2xl focus-visible:ring-primary/20 text-xs sm:text-sm font-medium"
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-background transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

