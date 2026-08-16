"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  GraduationCap,
  Mail,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { acknowledgeGuidanceAction, type GuidanceAssignmentRecord } from '@/app/actions/guidance';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GuidanceCounselingDialogProps {
  guidance: GuidanceAssignmentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcknowledged?: () => void;
}

export function GuidanceCounselingDialog({
  guidance,
  open,
  onOpenChange,
  onAcknowledged,
}: GuidanceCounselingDialogProps) {
  const { toast } = useToast();
  const [acknowledging, setAcknowledging] = useState(false);

  if (!guidance) return null;

  const isResolved = guidance.status === 'RESOLVED' || guidance.status === 'COMPLETED';
  const advisorName = guidance.advisor?.name || 'Faculty Academic Advisor';
  const advisorEmail = guidance.advisor?.email || '';
  const advisorRole = guidance.advisor?.role || 'TEACHER';
  const subject = guidance.subjectCategory || 'Medical Technology Domain';

  const roleDisplay =
    advisorRole === 'TEAMLEAD'
      ? 'Academic Team Lead • Faculty Advisor'
      : advisorRole === 'SUPERADMIN' || advisorRole === 'ADMIN'
      ? 'Academic Dean / Department Head'
      : 'Faculty Advisor • Subject Specialist';

  const formattedDate = (() => {
    try {
      return format(new Date(guidance.createdAt), 'MMMM d, yyyy');
    } catch (e) {
      return 'Recent';
    }
  })();

  const mailSubject = encodeURIComponent(`[BoardQuest Academic Guidance] Consultation Request - ${subject}`);
  const mailBody = encodeURIComponent(
    `Dear ${advisorName},\n\nI am writing to consult with you regarding my academic guidance assignment in ${subject} on BoardQuest.\n\nGuidance ID: ${guidance.id}\nTarget Subject: ${subject}\n\nI would appreciate your advice on recommended study materials, question drills, and consultation hours.\n\nBest regards,\nStudent`
  );
  const mailtoLink = `mailto:${advisorEmail}?subject=${mailSubject}&body=${mailBody}`;

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      try {
        const dismissedIds = JSON.parse(localStorage.getItem('bq_dismissed_guidance_ids') || '[]');
        if (!dismissedIds.includes(guidance.id)) {
          dismissedIds.push(guidance.id);
          localStorage.setItem('bq_dismissed_guidance_ids', JSON.stringify(dismissedIds));
        }
      } catch (e) {}

      await acknowledgeGuidanceAction(guidance.id);
      window.dispatchEvent(new Event('bq_guidance_updated'));

      toast({
        title: 'Guidance Acknowledged',
        description: `You have successfully acknowledged the academic guidance plan for ${subject}.`,
      });
      if (onAcknowledged) onAcknowledged();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Notice',
        description: 'Guidance marked as reviewed.',
      });
      onOpenChange(false);
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border border-border/80 bg-background shadow-2xl rounded-3xl gap-0">
        {/* Sophisticated Header Banner */}
        <div className="relative overflow-hidden p-6 sm:p-7 border-b border-border/60 bg-gradient-to-br from-amber-500/10 via-background to-primary/5">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={cn(
                      'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border',
                      isResolved
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse'
                    )}
                  >
                    {isResolved ? 'Guidance Resolved' : 'Active Faculty Counseling'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Assigned {formattedDate}
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1.5">
                  Academic Counseling Brief
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Institutional mentorship and diagnostic remediation program
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          {/* Faculty Advisor Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="h-13 w-13 sm:h-14 sm:w-14 rounded-2xl border-2 border-primary/20 shrink-0 shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${advisorEmail || advisorName}`} />
                <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                  {advisorName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-primary uppercase tracking-widest">
                    Assigned Faculty Advisor
                  </p>
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {advisorName}
                </h4>
                <p className="text-xs text-muted-foreground truncate font-medium">
                  {roleDisplay}
                </p>
              </div>
            </div>

            {advisorEmail && (
              <a
                href={mailtoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto h-9 rounded-xl border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Mail className="w-4 h-4 text-primary" /> Contact Advisor
                </Button>
              </a>
            )}
          </div>

          {/* Subject & Reason Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Subject Domain */}
            <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4" /> Focus Domain
              </div>
              <p className="text-base font-bold text-foreground">
                {subject}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Prioritized academic remediation to boost diagnostic scores and ensure board licensure readiness.
              </p>
            </div>

            {/* Referral Reason */}
            <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" /> Referral Trigger
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {guidance.reason || 'Diagnostic score improvement intervention'}
              </p>
              <p className="text-xs text-muted-foreground">
                Authorized by administrative assessment protocol.
              </p>
            </div>
          </div>

          {/* Faculty Guidance Instructions & Recommended Action */}
          <div className="p-5 rounded-2xl border-2 border-amber-500/25 bg-amber-500/5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h5 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Faculty Guidance Instructions & Action Plan
              </h5>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
                Instructor Note
              </Badge>
            </div>

            {guidance.guidanceNotes ? (
              <div className="p-3.5 rounded-xl bg-background/80 border border-amber-500/20 text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed italic">
                "{guidance.guidanceNotes}"
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-background/80 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                Please complete daily review quests in <strong>{subject}</strong>, review chapter summaries, and consult with your advisor to track score improvements.
              </div>
            )}

            {/* Recommended Remedial Steps */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Mandatory Remedial Protocol:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Complete 25+ daily questions in {subject}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Review diagnostic flashcards & cheat sheets
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Schedule check-in consultation with advisor
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Notes if Resolved */}
          {isResolved && guidance.resolutionNotes && (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" /> Resolution Summary
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                "{guidance.resolutionNotes}"
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link href="/quest" className="flex-1 sm:flex-initial" onClick={() => onOpenChange(false)}>
                <Button
                  size="sm"
                  className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-current" /> Start {subject} Quest
                </Button>
              </Link>

              <Link href="/study" className="flex-1 sm:flex-initial" onClick={() => onOpenChange(false)}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto h-10 px-4 rounded-xl border-border/80 hover:bg-muted font-bold text-xs flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" /> Study Modules
                </Button>
              </Link>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full sm:w-auto text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              {acknowledging ? 'Acknowledging...' : 'Acknowledge & Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
