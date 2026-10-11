"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
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
  ShieldCheck,
  Sparkles,
  Calendar,
  Copy,
  Check,
  Quote,
  Loader2,
  Phone,
  MapPin,
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
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!guidance) return null;

  const isResolved = guidance.status === 'RESOLVED' || guidance.status === 'COMPLETED';
  const advisorName = guidance.advisor?.name || 'Faculty Academic Advisor';
  const advisorEmail = guidance.advisor?.email || '';
  const advisorRole = guidance.advisor?.role || 'TEACHER';
  const advisorPhone = guidance.advisor?.phoneNumber || '';
  const advisorLocation = guidance.advisor?.location || '';
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

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!advisorEmail) return;
    try {
      await navigator.clipboard.writeText(advisorEmail);
      setCopiedEmail(true);
      toast({
        title: 'Email Copied',
        description: `${advisorEmail} copied to clipboard.`,
      });
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      toast({
        title: 'Advisor Contact',
        description: advisorEmail,
      });
    }
  };

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
      <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[92vh] sm:max-h-[88vh] p-0 border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden gap-0 focus:outline-none">
        {/* Sophisticated Header Banner with safe right clearance */}
        <div className="shrink-0 relative overflow-hidden p-5 sm:p-6 pr-14 sm:pr-16 border-b border-border/60 bg-gradient-to-br from-amber-500/15 via-background to-primary/10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-52 h-52 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start gap-3.5 sm:gap-4 relative z-10 min-w-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md shrink-0">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={cn(
                    'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border shadow-xs',
                    isResolved
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse'
                  )}
                >
                  {isResolved ? 'Guidance Resolved' : 'Active Faculty Counseling'}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" /> Assigned {formattedDate}
                </span>
              </div>

              <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-foreground leading-snug break-words">
                Academic Counseling Brief
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-normal line-clamp-2">
                Institutional mentorship and diagnostic remediation program
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Faculty Advisor Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-border transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border-2 border-primary/20 shrink-0 shadow-sm ring-2 ring-primary/10">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${advisorEmail || advisorName}`} />
                <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                  {advisorName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    Assigned Faculty Advisor
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-foreground break-words leading-tight">
                  {advisorName}
                </h4>
                <p className="text-xs text-muted-foreground font-medium break-words">
                  {roleDisplay}
                </p>

                {(advisorPhone || advisorLocation) && (
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground/80 flex-wrap">
                    {advisorLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary/70 shrink-0" /> {advisorLocation}
                      </span>
                    )}
                    {advisorPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-primary/70 shrink-0" /> {advisorPhone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {advisorEmail && (
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <a
                  href={mailtoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto h-9 px-3.5 rounded-xl border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Email Advisor</span>
                  </Button>
                </a>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyEmail}
                  className="h-9 px-2.5 rounded-xl border border-border/60 hover:bg-muted text-xs text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  title="Copy advisor email address"
                  aria-label="Copy email address"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Subject & Reason Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Target Subject Domain */}
            <div className="p-4 sm:p-4.5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-2 flex flex-col justify-between shadow-xs">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 shrink-0" /> Focus Domain
                </div>
                <h5 className="text-base sm:text-lg font-bold text-foreground break-words [overflow-wrap:anywhere] leading-snug">
                  {subject}
                </h5>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                Prioritized academic remediation to boost diagnostic scores and ensure board licensure readiness.
              </p>
            </div>

            {/* Referral Reason */}
            <div className="p-4 sm:p-4.5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-2 flex flex-col justify-between shadow-xs">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Referral Trigger
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug break-words [overflow-wrap:anywhere]">
                  {guidance.reason || 'Diagnostic score improvement intervention'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                Authorized by institutional academic assessment protocol.
              </p>
            </div>
          </div>

          {/* Faculty Guidance Instructions & Action Plan */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500/25 bg-amber-500/5 space-y-3.5 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h5 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Faculty Guidance Instructions & Action Plan</span>
              </h5>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 shrink-0">
                Instructor Note
              </Badge>
            </div>

            {guidance.guidanceNotes ? (
              <div className="relative p-3.5 sm:p-4 rounded-xl bg-background/85 border border-amber-500/25 text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed italic break-words shadow-xs">
                <Quote className="w-4 h-4 text-amber-500/40 absolute top-2 right-2 pointer-events-none" />
                "{guidance.guidanceNotes}"
              </div>
            ) : (
              <div className="p-3.5 sm:p-4 rounded-xl bg-background/80 border border-border/60 text-xs text-muted-foreground leading-relaxed break-words">
                Please complete daily review quests in <strong className="text-foreground">{subject}</strong>, review chapter summaries, and consult with your advisor to track score improvements.
              </div>
            )}

            {/* Recommended Remedial Protocol */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Mandatory Remedial Protocol:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-background/70 border border-border/60 flex items-start gap-2.5 min-w-0 shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-primary/15 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug break-words min-w-0">
                    Complete 25+ daily review questions in <span className="font-semibold text-foreground/90">{subject}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background/70 border border-border/60 flex items-start gap-2.5 min-w-0 shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-primary/15 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug break-words min-w-0">
                    Review diagnostic flashcards & high-yield summaries
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background/70 border border-border/60 flex items-start gap-2.5 min-w-0 shadow-xs">
                  <div className="w-5 h-5 rounded-full bg-primary/15 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug break-words min-w-0">
                    Schedule 1-on-1 check-in consultation with advisor
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution Notes if Resolved */}
          {isResolved && guidance.resolutionNotes && (
            <div className="p-4 sm:p-4.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Resolution Summary
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed break-words">
                "{guidance.resolutionNotes}"
              </p>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-border/60 bg-muted/20 backdrop-blur-md flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <Link href="/quest" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              <Button
                size="sm"
                className="w-full sm:w-auto h-10 px-4 sm:px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current shrink-0" />
                <span>Start Practice Quest</span>
              </Button>
            </Link>

            <Link href="/study" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto h-10 px-4 rounded-xl border-border/80 hover:bg-muted font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Study Modules</span>
              </Button>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="w-full sm:w-auto h-10 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {acknowledging ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Acknowledging...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Acknowledge & Close</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
