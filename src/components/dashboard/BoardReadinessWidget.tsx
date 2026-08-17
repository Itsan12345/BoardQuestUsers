"use client";

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { MtleReadinessResult } from '@/lib/mtle-predictor-engine';

interface BoardReadinessWidgetProps {
  data: MtleReadinessResult | null;
  loading?: boolean;
}

export function BoardReadinessWidget({ data, loading }: BoardReadinessWidgetProps) {
  if (loading) {
    return (
      <Card className="border border-border/80 shadow-md rounded-2xl p-5 bg-background animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="h-10 w-24 bg-muted rounded mb-2" />
        <div className="h-3 w-48 bg-muted rounded" />
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const isPassing = data.prcStatus === 'PASSED';
  const isConditional = data.prcStatus === 'CONDITIONAL';

  // SVG Gauge calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, data.predictedGwa)) / 100) * circumference;

  let strokeColor = '#3B82F6';
  if (data.predictedGwa >= 90 && isPassing) strokeColor = '#EAB308';
  else if (isPassing) strokeColor = '#10B981';
  else if (isConditional) strokeColor = '#F59E0B';
  else strokeColor = '#EF4444';

  return (
    <Card className="border border-border shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-muted/20 hover:border-primary/40 transition-all duration-300">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          
          {/* Header & Meta */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                PRC MTLE Readiness
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold font-headline text-foreground">
              Board Rating Forecast
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Statutory 6-subject weighted prediction
            </p>
          </div>

          {/* Mini Circular Gauge */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-muted-foreground/15"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke={strokeColor}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs sm:text-sm font-black font-headline text-foreground">
                {data.predictedGwa.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Status Pill & Tier */}
        <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 border ${
            isPassing
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : isConditional
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}>
            {isPassing ? <CheckCircle2 className="w-3 h-3" /> : isConditional ? <AlertTriangle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {data.statusTitle}
          </div>

          <Link href="/performance" className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
            <span>Forecast & Simulator</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
