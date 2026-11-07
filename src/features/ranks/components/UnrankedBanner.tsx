import Link from 'next/link';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function UnrankedBanner() {
  return (
    <Card className="border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-foreground">
                Unranked Aspirant
              </h4>
              <Badge
                variant="secondary"
                className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5"
              >
                0 XP
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              You haven&apos;t claimed any XP yet! Claim your Daily Login reward or complete a quest in the Quest Arena to enter the global rankings and showcase your position.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            asChild
            size="sm"
            className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 shadow-sm font-semibold"
          >
            <Link href="/">
              Claim Daily Login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

