import { BookMarked, Search, FileText, Clock, Eye, Check, PlayCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CurriculumCategory, CurriculumLesson } from '../types';

interface SubjectLessonsListProps {
  selectedCategory: CurriculumCategory;
  filteredLessons: CurriculumLesson[];
  searchQuery: string;
  onClearSearch: () => void;
  onOpenViewer: (lesson: CurriculumLesson) => void;
}

export function SubjectLessonsList({
  selectedCategory,
  filteredLessons,
  searchQuery,
  onClearSearch,
  onOpenViewer,
}: SubjectLessonsListProps) {
  return (
    <Card className="border border-border shadow-xs rounded-2xl sm:rounded-[2rem] bg-background border-2 border-border overflow-hidden">
      <CardHeader className="bg-muted border-b p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <CardTitle className="font-headline text-base sm:text-lg font-semibold uppercase tracking-tight flex items-center gap-2.5 sm:gap-3">
            <BookMarked className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            Learning Modules & Materials
          </CardTitle>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
            Tap any module to view attached PDF study materials and mark complete.
          </p>
        </div>

        {filteredLessons.length > 0 ? (
          <Badge
            variant="outline"
            className="self-start sm:self-auto bg-primary/10 text-primary border-primary/30 font-bold text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-xl whitespace-nowrap shrink-0"
          >
            {filteredLessons.length} {filteredLessons.length === 1 ? 'Module' : 'Modules'}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="self-start sm:self-auto bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-xl whitespace-nowrap shrink-0"
          >
            0 Modules Available
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={filteredLessons.length === 0 ? 'h-auto' : 'h-[450px]'}>
          {filteredLessons.length === 0 ? (
            <div className="p-10 sm:p-14 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-xs">
                {searchQuery.trim() ? (
                  <Search className="w-7 h-7" />
                ) : (
                  <FileText className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-tight font-headline">
                  {searchQuery.trim()
                    ? 'No matching modules found'
                    : 'No Learning Modules Available Yet'}
                </h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {searchQuery.trim()
                    ? `No learning modules in ${
                        selectedCategory?.title || 'this subject'
                      } match "${searchQuery}".`
                    : `Learning modules and study materials for ${
                        selectedCategory?.title || 'this subject'
                      } are currently being prepared by the review center admin team.`}
                </p>
              </div>

              <div className="pt-1">
                {searchQuery.trim() ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearSearch}
                    className="text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    Clear Search Filter
                  </Button>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 px-3 py-1 rounded-xl"
                  >
                    Awaiting Upload
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredLessons.map((lesson, idx) => {
                const isCompleted = lesson.status === 'completed';
                const pdfCount = lesson.fileUrls ? lesson.fileUrls.length : 0;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => onOpenViewer(lesson)}
                    className="p-4 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-5 hover:bg-muted/60 transition-all cursor-pointer group min-w-0"
                  >
                    {/* Index Badge */}
                    <div
                      className={cn(
                        'flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all shadow-xs',
                        isCompleted
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-background border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary'
                      )}
                    >
                      {lesson.order || idx + 1}
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm lg:text-base text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                          {lesson.title}
                        </h4>
                        {isCompleted && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0 font-bold">
                            ✓ Done
                          </Badge>
                        )}
                      </div>

                      {lesson.description && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                          {lesson.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight pt-0.5">
                        {pdfCount > 0 ? (
                          <span className="flex items-center gap-1 text-primary font-bold">
                            <FileText className="h-3 w-3" />
                            {pdfCount} PDF Study {pdfCount === 1 ? 'Doc' : 'Docs'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duration || '45m Intel'}
                          </span>
                        )}

                        <span className="text-muted-foreground/40">•</span>
                        <span className="flex items-center gap-1 group-hover:underline">
                          <Eye className="h-3 w-3 text-primary" />
                          Open Viewer
                        </span>
                      </div>
                    </div>

                    {/* Open PDF Viewer Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenViewer(lesson);
                      }}
                      className={cn(
                        'h-9 w-9 sm:h-11 sm:w-11 shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all shadow-xs border-2',
                        isCompleted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-background border-border text-muted-foreground hover:bg-primary hover:text-white hover:border-primary'
                      )}
                      aria-label="Open PDF study module"
                      title={
                        isCompleted ? 'Completed - Click to Open PDF' : 'Click to Open PDF'
                      }
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 stroke-[3]" />
                      ) : (
                        <PlayCircle className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

