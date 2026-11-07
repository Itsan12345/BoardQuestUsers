import { Badge } from '@/components/ui/badge';

export function PerformanceHeader() {
  return (
    <header className="space-y-1">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="text-[10px] font-extrabold uppercase tracking-widest text-primary border-primary/30"
        >
          Student Score Analytics
        </Badge>
      </div>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-headline tracking-tight leading-tight uppercase">
        Performance <span className="text-primary">Mastery</span>
      </h1>
      <p className="text-muted-foreground text-xs sm:text-sm lg:text-base font-medium">
        Real-time academic score analytics, technical subject metrics, and mission objectives.
      </p>
    </header>
  );
}

