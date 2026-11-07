import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeaderboardPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function LeaderboardPagination({
  page,
  totalPages,
  onPageChange,
}: LeaderboardPaginationProps) {
  return (
    <div className="flex items-center justify-between pt-2 sm:pt-4 gap-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-full px-3 sm:px-5 text-xs sm:text-sm h-9 sm:h-10 hover:bg-primary/5 hover:text-primary transition-colors shrink-0 gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>

      <div className="flex items-center gap-1 sm:gap-2 bg-muted/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border/50 text-center truncate shadow-xs">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          Page <span className="text-foreground font-bold">{page}</span> of{' '}
          <span className="text-foreground font-bold">{totalPages}</span>
        </span>
      </div>

      <Button
        variant="outline"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-full px-3 sm:px-5 text-xs sm:text-sm h-9 sm:h-10 hover:bg-primary/5 hover:text-primary transition-colors shrink-0 gap-1"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

