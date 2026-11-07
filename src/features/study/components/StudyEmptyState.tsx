import { BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StudyEmptyState() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-background text-center">
      <div className="max-w-lg space-y-6 flex flex-col items-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-lg">
          <BookMarked className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight font-headline">
            No Subjects Available
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium max-w-md mx-auto">
            There are currently no board exam subjects or learning modules uploaded in the database.
            Please contact your review center administrator to publish study materials.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase px-7 py-3 rounded-2xl shadow-lg transition-all"
          >
            Refresh Study Subjects
          </Button>
        </div>
      </div>
    </div>
  );
}

