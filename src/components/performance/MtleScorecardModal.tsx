"use client";

import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle2, AlertTriangle, XCircle, Sparkles, GraduationCap, ShieldCheck } from 'lucide-react';
import { MtleReadinessResult } from '@/lib/mtle-predictor-engine';
import { format } from 'date-fns';

interface MtleScorecardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MtleReadinessResult;
  userName?: string;
}

export function MtleScorecardModal({ open, onOpenChange, data, userName = "MedTech Candidate" }: MtleScorecardModalProps) {
  const scorecardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isPassing = data.prcStatus === 'PASSED';
  const isConditional = data.prcStatus === 'CONDITIONAL';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-y-auto p-3.5 sm:p-8 bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>MTLE Official Readiness Scorecard</DialogTitle>
          <DialogDescription>Predicted Board Rating Transcript</DialogDescription>
        </DialogHeader>

        {/* Printable Scorecard Container */}
        <div ref={scorecardRef} className="space-y-4 sm:space-y-6 print:m-0 print:p-0">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#800000] via-[#5b0000] to-[#2b0000] text-white p-4 sm:p-8 shadow-lg border border-amber-500/30">
            {/* Background Watermark/Pattern */}
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-96 h-24 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                  <span className="text-[9px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-amber-300">
                    Republic of the Philippines • PRC Syllabus Spec
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black font-headline tracking-tight leading-tight">
                  MTLE Readiness Transcript
                </h2>
                <p className="text-[11px] sm:text-xs text-white/80">
                  Medical Technology Licensure Examination Diagnostic Assessment
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 self-start sm:self-auto">
                <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-[11px] sm:text-sm tracking-wider uppercase flex items-center gap-1.5 sm:gap-2 shadow-md border ${
                  isPassing 
                    ? 'bg-emerald-500 text-white border-emerald-300' 
                    : isConditional
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : 'bg-rose-600 text-white border-rose-400'
                }`}>
                  {isPassing ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> : isConditional ? <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> : <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                  <span>{data.statusTitle}</span>
                </div>
              </div>
            </div>

            {/* Candidate Sub-bar */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
              <div>
                <span className="text-white/60 block text-[9px] sm:text-[10px] uppercase font-semibold">Candidate</span>
                <span className="font-bold text-white truncate block text-[11px] sm:text-xs">{userName}</span>
              </div>
              <div>
                <span className="text-white/60 block text-[9px] sm:text-[10px] uppercase font-semibold">Assessment Date</span>
                <span className="font-bold text-white block text-[11px] sm:text-xs">{format(new Date(), 'MMM dd, yyyy')}</span>
              </div>
              <div>
                <span className="text-white/60 block text-[9px] sm:text-[10px] uppercase font-semibold">Confidence Rating</span>
                <span className="font-bold text-amber-300 block text-[11px] sm:text-xs">{data.confidenceRating} ({data.confidenceScore}%)</span>
              </div>
              <div>
                <span className="text-white/60 block text-[9px] sm:text-[10px] uppercase font-semibold">Questions Evaluated</span>
                <span className="font-bold text-white block text-[11px] sm:text-xs">{data.totalQuestionsAttempted} Questions</span>
              </div>
            </div>
          </div>

          {/* Primary GWA Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-1 p-3.5 sm:p-5 rounded-2xl bg-muted/40 border border-border flex flex-col items-center justify-center text-center">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Predicted General Average
              </span>
              <div className="text-3xl sm:text-5xl font-black font-headline text-primary mt-1 tracking-tight">
                {data.predictedGwa.toFixed(2)}<span className="text-xl sm:text-2xl font-bold text-muted-foreground">%</span>
              </div>
              <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>PRC Benchmark: <strong className="text-foreground">75.00%</strong></span>
              </div>
            </div>

            <div className="sm:col-span-2 p-3.5 sm:p-5 rounded-2xl bg-muted/40 border border-border flex flex-col justify-center space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">National Standing Tier</span>
                <Badge variant="outline" className="border-primary/30 text-primary font-bold text-[10px] sm:text-xs shrink-0">
                  {data.tierInfo.badge}
                </Badge>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{data.tierInfo.title}</span>
              </h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                {data.statusDescription}
              </p>
            </div>
          </div>

          {/* Detailed Subject Matrix Table */}
          <div className="rounded-2xl border border-border overflow-hidden bg-background">
            <div className="p-3 sm:p-4 bg-muted/50 border-b border-border flex justify-between items-center">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground">
                Official MTLE Subject Breakdown & Weights (RA 5527)
              </h4>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold">100% Weight</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold text-[10px] uppercase">
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4">Subject Area</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">PRC Weight</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">Predicted Score</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">Weighted Pts</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.subjects.map((s) => {
                    const isSubjectCritical = s.score < 50;
                    const isSubjectPassing = s.score >= 75;
                    const weightedPoints = (s.score * s.weight).toFixed(2);

                    return (
                      <tr key={s.subject} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 sm:px-4 font-semibold text-foreground">
                          {s.subject}
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center font-bold text-muted-foreground">
                          <span className="inline-block px-1.5 py-0.5 rounded-md bg-muted text-[10px] sm:text-[11px]">
                            {Math.round(s.weight * 100)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center font-mono font-bold text-xs sm:text-sm text-foreground">
                          {s.score.toFixed(1)}%
                        </td>
                        <td className="py-3 px-2 sm:px-3 text-center font-mono font-semibold text-primary text-xs sm:text-sm">
                          {weightedPoints} pts
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                            isSubjectCritical 
                              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              : isSubjectPassing
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}>
                            {isSubjectCritical ? 'Below 50% Cutoff' : isSubjectPassing ? 'Passing' : 'Needs Review'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5 font-bold border-t-2 border-primary/20 text-foreground">
                    <td className="py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-headline uppercase">
                      General Weighted Average
                    </td>
                    <td className="py-3 px-2 sm:px-3 text-center text-xs">100%</td>
                    <td className="py-3 px-2 sm:px-3 text-center text-xs sm:text-sm font-mono text-primary">
                      {data.predictedGwa.toFixed(2)}%
                    </td>
                    <td className="py-3 px-2 sm:px-3 text-center text-xs sm:text-sm font-mono text-primary">
                      {data.predictedGwa.toFixed(2)} pts
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <span className="text-[11px] sm:text-xs font-bold text-primary">{data.statusTitle}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Statutory PRC Licensure Note */}
          <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>
                <strong className="text-foreground">Official PRC MTLE Guidelines (RA 5527):</strong> To pass the licensure examination, a candidate must obtain a general weighted average of at least <strong>75.00%</strong> with <strong>no rating below 50.00%</strong> in any subject.
              </div>
              <div className="text-[10px] text-muted-foreground/80 font-mono">
                Formula: Weighted Points = [(Exam × 50%) + (Mastery × 30%) + (Syllabus × 20%)] × PRC Weight. Predicted GWA = Sum of Weighted Points.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs h-9 sm:h-10">
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs h-9 sm:h-10 flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
