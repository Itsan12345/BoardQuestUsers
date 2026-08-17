"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calculator,
  Scale,
  BookOpen,
  Zap,
  Swords,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { MtleReadinessResult } from '@/lib/mtle-predictor-engine';

interface MtleFormulaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MtleReadinessResult;
}

export function MtleFormulaModal({ open, onOpenChange, data }: MtleFormulaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[365px] sm:max-w-3xl max-h-[86vh] overflow-y-auto overflow-x-hidden p-3 xs:p-4 sm:p-6 bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl">
        
        {/* Modal Header */}
        <DialogHeader className="border-b border-border pb-2.5 sm:pb-4 text-left">
          <div className="flex items-start justify-between gap-2 pr-6 sm:pr-8">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <div className="p-1 sm:p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
                <Calculator className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <DialogTitle className="text-[11px] xs:text-xs sm:text-lg lg:text-xl font-black font-headline tracking-tight text-foreground truncate">
                  Grading Transparency &amp; Calculation Proof
                </DialogTitle>
                <DialogDescription className="text-[8px] xs:text-[9px] sm:text-xs text-muted-foreground leading-tight truncate">
                  Official PRC RA 5527 statutory calculation formulas.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-6 pt-1 sm:pt-2">
          
          {/* Section 1: The 2 Core Formulas */}
          <div className="space-y-1.5 sm:space-y-3">
            <h3 className="text-[9px] xs:text-[9.5px] sm:text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Scale className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              1. Mathematical Derivation Formulas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              
              {/* Formula Card A: Subject Proficiency */}
              <Card className="p-2 xs:p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-border/80 bg-muted/20 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[8px] xs:text-[8.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                    Formula A: Subject Proficiency
                  </span>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[9px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/25 px-1 py-0.5 rounded shrink-0">
                    0–100%
                  </span>
                </div>

                <div className="p-1.5 xs:p-2 rounded-xl bg-background border border-border text-center space-y-0.5">
                  <div className="text-[8px] xs:text-[9px] sm:text-xs font-bold font-mono text-primary">
                    Subject Proficiency =
                  </div>
                  <div className="flex items-center justify-center gap-0.5 xs:gap-1 flex-wrap text-[7.5px] xs:text-[8px] sm:text-xs font-mono font-bold text-foreground">
                    <span className="px-1 py-0.5 rounded bg-muted/80">Arena 50%</span>
                    <span>+</span>
                    <span className="px-1 py-0.5 rounded bg-muted/80">Mastery 30%</span>
                    <span>+</span>
                    <span className="px-1 py-0.5 rounded bg-muted/80">Syllabus 20%</span>
                  </div>
                </div>

                <div className="text-[7.5px] xs:text-[8px] sm:text-[10px] text-muted-foreground space-y-0.5 pt-0.5">
                  <div className="flex items-center gap-1">
                    <Swords className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 shrink-0" />
                    <span><strong>Arena (50%)</strong>: Quest tests &amp; boss runs.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                    <span><strong>Mastery (30%)</strong>: Retention consistency.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 shrink-0" />
                    <span><strong>Syllabus (20%)</strong>: Completed checklist.</span>
                  </div>
                </div>
              </Card>

              {/* Formula Card B: Weighted GWA */}
              <Card className="p-2 xs:p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-border/80 bg-muted/20 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[8px] xs:text-[8.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                    Formula B: Statutory GWA
                  </span>
                  <span className="text-[7px] xs:text-[7.5px] sm:text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.5 rounded shrink-0">
                    RA 5527
                  </span>
                </div>

                <div className="p-1.5 xs:p-2 rounded-xl bg-background border border-border text-center space-y-0.5">
                  <div className="text-[8px] xs:text-[9px] sm:text-xs font-bold font-mono text-primary">
                    Weighted Points =
                  </div>
                  <div className="flex items-center justify-center gap-0.5 xs:gap-1 flex-wrap text-[7.5px] xs:text-[8px] sm:text-xs font-mono font-bold text-foreground">
                    <span className="px-1 py-0.5 rounded bg-muted/80">Proficiency</span>
                    <span>×</span>
                    <span className="px-1 py-0.5 rounded bg-muted/80">PRC Weight</span>
                  </div>
                </div>

                <div className="p-1 rounded-lg bg-background/80 border border-border/80 font-mono text-[7.5px] xs:text-[8px] sm:text-[10px] text-primary font-bold text-center">
                  Predicted GWA = Sum of All 6 Weighted Points
                </div>

                <p className="text-[7.5px] xs:text-[8px] sm:text-[9.5px] text-muted-foreground leading-tight pt-0.5">
                  4 Majors: <strong>20% (0.20)</strong> &bull; 2 Minors: <strong>10% (0.10)</strong>.
                </p>
              </Card>
            </div>
          </div>

          {/* Section 2: Live Step-by-Step Student Audit */}
          <div className="space-y-1.5 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
              <h3 className="text-[9px] xs:text-[9.5px] sm:text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Percent className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                2. Live Audit of Your Current Grade
              </h3>
              <span className="text-[7.5px] xs:text-[8px] sm:text-[9px] font-medium text-muted-foreground">
                Plug these numbers into a calculator to verify
              </span>
            </div>

            {/* Desktop Table View (sm and above) */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 border-b border-border text-[10px] font-extrabold uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Subject Area</th>
                    <th className="p-3 text-center">Arena (50%)</th>
                    <th className="p-3 text-center">Mastery (30%)</th>
                    <th className="p-3 text-center">Syllabus (20%)</th>
                    <th className="p-3 text-right">Proficiency</th>
                    <th className="p-3 text-center">PRC Weight</th>
                    <th className="p-3 text-right">Weighted Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-background font-medium">
                  {data.subjects.map((sub) => {
                    const weightPct = Math.round(sub.weight * 100);
                    const weightedPts = (sub.score * sub.weight).toFixed(2);
                    const examAccuracy = sub.examScore || 0;
                    const mastery = sub.masteryScore || 0;
                    const syllabus = sub.lessonCompletion || 0;

                    return (
                      <tr key={sub.subject} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground truncate max-w-[170px]">{sub.subject}</div>
                          <span className="text-[9px] text-muted-foreground font-normal">{weightPct}% PRC Weight</span>
                        </td>
                        <td className="p-3 text-center font-mono text-muted-foreground">
                          {examAccuracy}%
                        </td>
                        <td className="p-3 text-center font-mono text-muted-foreground">
                          {mastery}%
                        </td>
                        <td className="p-3 text-center font-mono text-muted-foreground">
                          {syllabus}%
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-foreground">
                          {sub.score.toFixed(1)}%
                        </td>
                        <td className="p-3 text-center font-mono text-primary font-bold">
                          × {sub.weight.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-primary">
                          {weightedPts} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-primary/5 border-t-2 border-primary/20 font-bold">
                  <tr>
                    <td colSpan={6} className="p-3 text-right uppercase text-foreground text-xs font-black">
                      Total Calculated GWA (Sum of Points):
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm sm:text-base text-primary">
                      {data.predictedGwa.toFixed(2)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile-Friendly Structured Card Breakdown (strictly non-scrollable, fits 100% width) */}
            <div className="block sm:hidden space-y-1 xs:space-y-1.5">
              {data.subjects.map((sub) => {
                const weightPct = Math.round(sub.weight * 100);
                const weightedPts = (sub.score * sub.weight).toFixed(2);
                const examAccuracy = sub.examScore || 0;
                const mastery = sub.masteryScore || 0;
                const syllabus = sub.lessonCompletion || 0;

                return (
                  <div key={sub.subject} className="p-1.5 xs:p-2 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-bold text-[9.5px] xs:text-[10px] sm:text-xs text-foreground truncate flex-1 min-w-0">
                        {sub.subject}
                      </div>
                      <span className="text-[7px] xs:text-[7.5px] sm:text-[9px] font-bold font-mono bg-background border border-border px-1.5 py-0.5 rounded shrink-0">
                        {weightPct}% Weight
                      </span>
                    </div>

                    {/* 3 Formula Components in a 3-column micro grid */}
                    <div className="grid grid-cols-3 gap-0.5 xs:gap-1 text-[7.5px] xs:text-[8px] sm:text-[9px] font-mono text-center bg-background/90 p-1 rounded-lg border border-border/60">
                      <div className="px-0.5">
                        <span className="text-[6.5px] xs:text-[7px] text-muted-foreground block uppercase font-sans">Arena 50%</span>
                        <span className="font-bold text-foreground">{examAccuracy}%</span>
                      </div>
                      <div className="px-0.5">
                        <span className="text-[6.5px] xs:text-[7px] text-muted-foreground block uppercase font-sans">Mastery 30%</span>
                        <span className="font-bold text-foreground">{mastery}%</span>
                      </div>
                      <div className="px-0.5">
                        <span className="text-[6.5px] xs:text-[7px] text-muted-foreground block uppercase font-sans">Syllabus 20%</span>
                        <span className="font-bold text-foreground">{syllabus}%</span>
                      </div>
                    </div>

                    {/* Calculated Proficiency & Weighted Points Result */}
                    <div className="flex items-center justify-between text-[8.5px] xs:text-[9px] sm:text-[10px] pt-0.5 border-t border-border/40 font-mono">
                      <span className="text-muted-foreground font-sans text-[7.5px] xs:text-[8px] sm:text-[9px]">
                        Proficiency: <strong className="text-foreground">{sub.score.toFixed(1)}%</strong> × {sub.weight.toFixed(2)}
                      </span>
                      <span className="font-black text-primary text-[9.5px] xs:text-[10px] sm:text-xs">
                        = {weightedPts} pts
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Total GWA Sum Card */}
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between">
                <span className="text-[9px] xs:text-[9.5px] font-black uppercase tracking-wider text-foreground">
                  Total Calculated GWA:
                </span>
                <span className="text-xs xs:text-sm font-black font-mono text-primary">
                  {data.predictedGwa.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: PRC Licensure Examination Rules (RA 5527) */}
          <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border space-y-1 sm:space-y-2 text-xs">
            <h4 className="font-extrabold uppercase text-[8.5px] xs:text-[9px] sm:text-[11px] text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              Statutory PRC Passing Rules (Republic Act 5527)
            </h4>
            <div className="space-y-1 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-2.5 text-[8px] xs:text-[8.5px] sm:text-[11px]">
              <div className="p-1.5 sm:p-2.5 rounded-xl bg-background border border-border">
                <span className="text-emerald-600 font-extrabold block text-[8.5px] xs:text-[9px] sm:text-xs">✓ PASSED</span>
                <span className="text-muted-foreground text-[7.5px] xs:text-[8px] sm:text-[10px] leading-tight block mt-0.5">
                  General Average &ge; 75.00% and <strong>no subject below 50.00%</strong>.
                </span>
              </div>
              <div className="p-1.5 sm:p-2.5 rounded-xl bg-background border border-border">
                <span className="text-amber-600 font-extrabold block text-[8.5px] xs:text-[9px] sm:text-xs">⚠ CONDITIONAL</span>
                <span className="text-muted-foreground text-[7.5px] xs:text-[8px] sm:text-[10px] leading-tight block mt-0.5">
                  General Average &ge; 75.00%, but 1+ subjects fall below 50.00%.
                </span>
              </div>
              <div className="p-1.5 sm:p-2.5 rounded-xl bg-background border border-border">
                <span className="text-rose-600 font-extrabold block text-[8.5px] xs:text-[9px] sm:text-xs">✕ FAILED</span>
                <span className="text-muted-foreground text-[7.5px] xs:text-[8px] sm:text-[10px] leading-tight block mt-0.5">
                  General Average &lt; 75.00% or multiple major subject deficiencies.
                </span>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end pt-0.5 pb-0.5">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 sm:px-5 rounded-xl text-[11px] xs:text-xs h-7 xs:h-8 sm:h-9 shadow-md"
            >
              Got It, Close Guide
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
