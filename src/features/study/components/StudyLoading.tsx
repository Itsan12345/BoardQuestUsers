import { Loader2 } from 'lucide-react';

export function StudyLoading() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Loading Study Subjects...
      </p>
    </div>
  );
}

