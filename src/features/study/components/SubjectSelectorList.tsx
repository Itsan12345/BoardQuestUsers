import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CurriculumCategory } from '../types';

interface SubjectSelectorListProps {
  displayCurriculum: CurriculumCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  targetDates: Record<string, Date>;
  subjectPlans: Record<string, { startDate: Date; endDate: Date }>;
  focusSubject: string | null;
  mounted: boolean;
  searchQuery: string;
  onClearSearch: () => void;
}

export function SubjectSelectorList({
  displayCurriculum,
  selectedCategoryId,
  onSelectCategory,
  targetDates,
  subjectPlans,
  focusSubject,
  mounted,
  searchQuery,
  onClearSearch,
}: SubjectSelectorListProps) {
  return (
    <aside id="tour-study-subjects" className="lg:col-span-4 space-y-3 sm:space-y-4 min-w-0">
      <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1 sm:px-2">
        Subjects
      </h2>

      {displayCurriculum.length === 0 ? (
        <div className="p-5 sm:p-6 text-center bg-card border-2 border-dashed border-border/80 rounded-3xl space-y-3 shadow-xs">
          <Search className="w-6 h-6 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-bold text-foreground leading-snug">
            No subjects match &quot;{searchQuery}&quot;
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="text-[11px] font-bold rounded-xl h-8 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile Horizontal Carousel (< lg) */}
          <div className="flex lg:hidden overflow-x-auto gap-2.5 pb-2 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 scrollbar-none shrink-0">
            {displayCurriculum.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategoryId === cat.id;
              const uploadedCount = cat.adminModuleCount || 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-2xl transition-all border-2 shrink-0 min-w-[200px] text-left',
                    isActive
                      ? 'bg-background border-primary shadow-md'
                      : 'hover:bg-muted border-border bg-background'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-xl shrink-0 transition-colors',
                      isActive ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'font-bold text-xs uppercase tracking-tight truncate',
                        isActive ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {cat.title}
                    </p>
                    <span className="text-[9px] font-semibold text-muted-foreground">
                      {uploadedCount > 0
                        ? `${uploadedCount} ${uploadedCount === 1 ? 'Module' : 'Modules'}`
                        : '0 Modules'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop Vertical Card Stack (>= lg) */}
          <div className="hidden lg:grid grid-cols-1 gap-2.5 sm:gap-3">
            {displayCurriculum.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategoryId === cat.id;
              const catDate = targetDates[cat.title];
              const catPlan = subjectPlans[cat.title];
              const uploadedCount = cat.adminModuleCount || 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 xl:gap-4 p-3 xl:p-5 rounded-2xl xl:rounded-3xl transition-all text-left border-2 min-w-0',
                    isActive
                      ? 'bg-background border-primary shadow-lg'
                      : 'hover:bg-muted border-border bg-background'
                  )}
                >
                  <div
                    className={cn(
                      'p-2.5 xl:p-3 rounded-xl xl:rounded-2xl shrink-0 transition-colors relative',
                      isActive ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 xl:h-6 xl:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 justify-between min-w-0">
                      <p
                        className={cn(
                          'font-semibold text-xs xl:text-sm uppercase tracking-tight truncate',
                          isActive ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {cat.title}
                      </p>
                      {mounted &&
                        focusSubject &&
                        focusSubject.toLowerCase() === cat.title.toLowerCase() && (
                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[8px] px-1.5 py-0 shrink-0">
                            ⭐ Focus
                          </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 xl:gap-2 mt-1 min-w-0">
                      <div className="flex items-center gap-1 text-[9px] xl:text-[10px] font-semibold text-muted-foreground uppercase min-w-0 truncate">
                        <CalendarIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {mounted && catPlan
                            ? `${format(catPlan.startDate, 'MMM dd')} - ${format(
                                catPlan.endDate,
                                'MMM dd'
                              )}`
                            : mounted && catDate
                            ? format(catDate, 'MMM dd, yyyy')
                            : 'No target set'}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[8.5px] xl:text-[9px] px-1.5 py-0 font-bold shrink-0 whitespace-nowrap',
                          uploadedCount > 0
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-secondary text-muted-foreground border-border'
                        )}
                      >
                        {uploadedCount > 0
                          ? `${uploadedCount} ${uploadedCount === 1 ? 'Module' : 'Modules'}`
                          : '0 Modules'}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
}

