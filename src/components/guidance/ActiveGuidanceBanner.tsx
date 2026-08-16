"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ChevronRight, Sparkles, X } from 'lucide-react';
import { GuidanceCounselingDialog } from './GuidanceCounselingDialog';
import { acknowledgeGuidanceAction, type GuidanceAssignmentRecord } from '@/app/actions/guidance';
import { cn } from '@/lib/utils';

interface ActiveGuidanceBannerProps {
  guidanceList: GuidanceAssignmentRecord[];
  onRefresh?: () => void;
  className?: string;
}

export function ActiveGuidanceBanner({
  guidanceList,
  onRefresh,
  className,
}: ActiveGuidanceBannerProps) {
  const [selectedGuidance, setSelectedGuidance] = useState<GuidanceAssignmentRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('bq_dismissed_guidance_ids');
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {}

    const handleSync = () => {
      try {
        const saved = localStorage.getItem('bq_dismissed_guidance_ids');
        if (saved) {
          setDismissedIds(JSON.parse(saved));
        }
      } catch (e) {}
    };

    window.addEventListener('bq_guidance_updated', handleSync);
    return () => {
      window.removeEventListener('bq_guidance_updated', handleSync);
    };
  }, []);

  if (!mounted || !guidanceList || guidanceList.length === 0) return null;

  // Only display assignments that are ACTIVE or IN_PROGRESS or PENDING and NOT dismissed or acknowledged
  const activeGuidance = guidanceList.find(
    g =>
      (g.status === 'IN_PROGRESS' || g.status === 'PENDING' || g.status === 'ACTIVE') &&
      !g.studentAcknowledged &&
      !dismissedIds.includes(g.id)
  );

  // If there are no active/in-progress guidance assignments or student dismissed it, the banner disappears!
  if (!activeGuidance) return null;

  const advisorName = activeGuidance.advisor?.name || 'Faculty Academic Advisor';
  const advisorRole = activeGuidance.advisor?.role || 'TEACHER';
  const subject = activeGuidance.subjectCategory || 'Medical Technology';

  const handleOpenDialog = () => {
    setSelectedGuidance(activeGuidance);
    setIsDialogOpen(true);
  };

  const handleDismissBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = Array.from(new Set([...dismissedIds, activeGuidance.id]));
      setDismissedIds(updated);
      localStorage.setItem('bq_dismissed_guidance_ids', JSON.stringify(updated));
      window.dispatchEvent(new Event('bq_guidance_updated'));

      // Persist acknowledgment / dismissal to database
      acknowledgeGuidanceAction(activeGuidance.id).catch(() => {});
    } catch (e) {}
  };

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden border-2 rounded-2xl shadow-md transition-all border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-background to-primary/5 hover:border-amber-500/60 animate-in fade-in duration-300',
          className
        )}
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 pr-6 sm:pr-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <GraduationCap className="w-6 h-6" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse">
                  Faculty Counseling Active
                </Badge>
                <span className="text-xs font-bold text-foreground">
                  Focus: {subject}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                Assigned to <span className="font-semibold text-foreground">{advisorName}</span> ({advisorRole}) for academic counseling and board exam remediation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
            <Button
              onClick={handleOpenDialog}
              size="sm"
              className="w-full sm:w-auto h-9 px-4 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Sparkles className="w-3.5 h-3.5" /> View Guidance Brief <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            <button
              onClick={handleDismissBanner}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Dismiss banner permanently"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      <GuidanceCounselingDialog
        guidance={selectedGuidance}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAcknowledged={() => {
          if (onRefresh) onRefresh();
          if (selectedGuidance) {
            try {
              const updated = Array.from(new Set([...dismissedIds, selectedGuidance.id]));
              setDismissedIds(updated);
              localStorage.setItem('bq_dismissed_guidance_ids', JSON.stringify(updated));
              window.dispatchEvent(new Event('bq_guidance_updated'));
            } catch (e) {}
          }
        }}
      />
    </>
  );
}
