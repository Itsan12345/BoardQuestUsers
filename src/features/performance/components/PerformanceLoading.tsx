import { Loader2 } from 'lucide-react';

export function PerformanceLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );
}

