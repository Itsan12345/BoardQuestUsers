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

  const isPassing = data.prcStatus === 'PASSED';
  const isConditional = data.prcStatus === 'CONDITIONAL';

  const handlePrint = () => {
    // Create an isolated hidden iframe specifically formatted for a full, prominent 1-page A4 PDF layout
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const subjectsHtml = data.subjects.map(s => {
      const isCritical = s.score < 50;
      const isSubPassing = s.score >= 75;
      const weightedPts = (s.score * s.weight).toFixed(2);
      const statusText = isCritical ? 'Below 50% Cutoff' : isSubPassing ? 'Passing' : 'Needs Review';
      const statusStyle = isCritical 
        ? 'background:#ffe4e6; color:#be123c; border:1px solid #fecdd3;' 
        : isSubPassing 
        ? 'background:#d1fae5; color:#047857; border:1px solid #a7f3d0;' 
        : 'background:#fef3c7; color:#b45309; border:1px solid #fde68a;';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; font-size: 10.5pt;">${s.subject}</td>
          <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #475569;">
            <span style="background: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-size: 9pt; border: 1px solid #cbd5e1;">${Math.round(s.weight * 100)}%</span>
          </td>
          <td style="padding: 10px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 800; font-size: 11pt; color: #0f172a;">${s.score.toFixed(1)}%</td>
          <td style="padding: 10px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 800; font-size: 11pt; color: #800000;">${weightedPts} pts</td>
          <td style="padding: 10px 14px; text-align: right;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 14px; font-size: 8.5pt; font-weight: 800; ${statusStyle}">${statusText}</span>
          </td>
        </tr>
      `;
    }).join('');

    const statusBg = isPassing ? '#10b981' : isConditional ? '#f59e0b' : '#dc2626';

    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MTLE Readiness Transcript - ${userName}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 0; font-size: 10.5pt; line-height: 1.5; }
          
          .banner { background: linear-gradient(135deg, #800000 0%, #4a0000 100%); color: #ffffff; padding: 22px 26px; border-radius: 14px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(128,0,0,0.15); }
          .banner-title { font-size: 18pt; font-weight: 900; margin: 2px 0; letter-spacing: -0.5px; text-transform: uppercase; color: #ffffff; }
          .banner-sub { font-size: 9pt; color: #fde68a; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
          .banner-desc { font-size: 9.5pt; color: rgba(255,255,255,0.85); font-weight: 500; }
          .status-badge { background: ${statusBg}; color: #ffffff; padding: 7px 16px; border-radius: 10px; font-weight: 900; font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
          
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; margin-top: 14px; font-size: 8.5pt; }
          .meta-label { opacity: 0.75; text-transform: uppercase; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
          .meta-val { font-size: 9.5pt; font-weight: 800; color: #ffffff; }
          
          .hero-grid { display: grid; grid-template-columns: 1fr 2.2fr; gap: 14px; margin-bottom: 16px; }
          .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px 18px; }
          .gwa-val { font-size: 34pt; font-weight: 900; color: #800000; font-family: 'Consolas', monospace; text-align: center; margin: 4px 0; letter-spacing: -1px; }
          
          .table-box { border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background: #f1f5f9; padding: 10px 14px; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; letter-spacing: 0.5px; }
          tfoot tr { background: #fff5f5; border-top: 2.5px solid #fecdd3; font-weight: 900; }
          
          .rule-note { background: #fffbeb; border: 1.5px solid #fef08a; border-radius: 12px; padding: 12px 16px; font-size: 9pt; color: #78350f; line-height: 1.5; }
          .footer-line { border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 16px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="banner">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="banner-sub">REPUBLIC OF THE PHILIPPINES &bull; PRC SYLLABUS SPEC</div>
              <div class="banner-title">MTLE Readiness Transcript</div>
              <div class="banner-desc">Medical Technology Licensure Examination Diagnostic Assessment</div>
            </div>
            <div>
              <span class="status-badge">${data.statusTitle}</span>
            </div>
          </div>
          <div class="meta-grid">
            <div><span class="meta-label">CANDIDATE</span><span class="meta-val">${userName}</span></div>
            <div><span class="meta-label">ASSESSMENT DATE</span><span class="meta-val">${format(new Date(), 'MMM dd, yyyy')}</span></div>
            <div><span class="meta-label">CONFIDENCE RATING</span><span class="meta-val" style="color:#fde68a;">${data.confidenceRating} (${data.confidenceScore}%)</span></div>
            <div><span class="meta-label">QUESTIONS EVALUATED</span><span class="meta-val">${data.totalQuestionsAttempted} Questions</span></div>
          </div>
        </div>

        <div class="hero-grid">
          <div class="card" style="text-align: center; display: flex; flex-col; justify-content: center; align-items: center;">
            <div style="font-size: 8.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Predicted General Average</div>
            <div class="gwa-val">${data.predictedGwa.toFixed(2)}%</div>
            <div style="font-size: 8.5pt; color: #334155; font-weight: 700;">PRC Benchmark: <strong style="color:#0f172a;">75.00%</strong></div>
          </div>
          <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 8.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">National Standing Tier</span>
              <span style="background: #e2e8f0; color: #0f172a; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 8.5pt; border: 1px solid #cbd5e1;">${data.tierInfo.badge}</span>
            </div>
            <div style="font-size: 12pt; font-weight: 800; color: #800000; margin-bottom: 4px;">${data.tierInfo.title}</div>
            <div style="font-size: 8.5pt; color: #475569; line-height: 1.45;">${data.statusDescription}</div>
          </div>
        </div>

        <div class="table-box">
          <table>
            <thead>
              <tr>
                <th>Subject Area</th>
                <th style="text-align:center;">PRC Weight</th>
                <th style="text-align:center;">Predicted Score</th>
                <th style="text-align:center;">Weighted Pts</th>
                <th style="text-align:right;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 12px 14px; font-weight: 900; text-transform: uppercase; font-size: 10pt;">General Weighted Average</td>
                <td style="padding: 12px 14px; text-align: center; font-weight: 900; font-size: 10pt;">100%</td>
                <td style="padding: 12px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 900; color: #800000; font-size: 12pt;">${data.predictedGwa.toFixed(2)}%</td>
                <td style="padding: 12px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 900; color: #800000; font-size: 12pt;">${data.predictedGwa.toFixed(2)} pts</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 900; color: #800000; font-size: 10pt;">${data.statusTitle}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="rule-note">
          <strong style="color: #78350f;">Official PRC MTLE Guidelines (RA 5527):</strong> To pass the licensure examination, a candidate must obtain a general weighted average of at least <strong>75.00%</strong> with <strong>no rating below 50.00%</strong> in any subject.
          <br><span style="font-family: 'Consolas', monospace; font-size: 8pt; opacity: 0.9; margin-top: 3px; display: block;">Formula: Weighted Points = [(Exam &times; 50%) + (Mastery &times; 30%) + (Syllabus &times; 20%)] &times; PRC Weight. Predicted GWA = Sum of Weighted Points.</span>
        </div>

        <div class="footer-line">
          <span>BoardQuest Academic Analytics Platform</span>
          <span>Confidential &bull; Prepared for College of Medical Technology</span>
          <span>Official MTLE Readiness Transcript</span>
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1000);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] overflow-y-auto p-3.5 sm:p-7 bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>MTLE Official Readiness Scorecard</DialogTitle>
          <DialogDescription>Predicted Board Rating Transcript</DialogDescription>
        </DialogHeader>

        {/* Modal UI Display */}
        <div id="mtle-printable-scorecard" ref={scorecardRef} className="space-y-3.5 sm:space-y-4">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#800000] via-[#5b0000] to-[#2b0000] text-white p-4 sm:p-5 shadow-md border border-amber-500/30">
            {/* Background Watermark/Pattern */}
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-96 h-24 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[9px] sm:text-xs font-bold tracking-[0.15em] uppercase text-amber-300">
                    Republic of the Philippines • PRC Syllabus Spec
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black font-headline tracking-tight leading-tight">
                  MTLE Readiness Transcript
                </h2>
                <p className="text-[10px] sm:text-xs text-white/80">
                  Medical Technology Licensure Examination Diagnostic Assessment
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 self-start sm:self-auto">
                <div className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl font-black text-[10px] sm:text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-md border ${
                  isPassing 
                    ? 'bg-emerald-500 text-white border-emerald-300' 
                    : isConditional
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : 'bg-rose-600 text-white border-rose-400'
                }`}>
                  {isPassing ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : isConditional ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{data.statusTitle}</span>
                </div>
              </div>
            </div>

            {/* Candidate Sub-bar */}
            <div className="mt-3 pt-2.5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-white/60 block text-[8.5px] sm:text-[9px] uppercase font-semibold">Candidate</span>
                <span className="font-bold text-white truncate block text-[10.5px] sm:text-xs">{userName}</span>
              </div>
              <div>
                <span className="text-white/60 block text-[8.5px] sm:text-[9px] uppercase font-semibold">Assessment Date</span>
                <span className="font-bold text-white block text-[10.5px] sm:text-xs">{format(new Date(), 'MMM dd, yyyy')}</span>
              </div>
              <div>
                <span className="text-white/60 block text-[8.5px] sm:text-[9px] uppercase font-semibold">Confidence Rating</span>
                <span className="font-bold text-amber-300 block text-[10.5px] sm:text-xs">{data.confidenceRating} ({data.confidenceScore}%)</span>
              </div>
              <div>
                <span className="text-white/60 block text-[8.5px] sm:text-[9px] uppercase font-semibold">Questions Evaluated</span>
                <span className="font-bold text-white block text-[10.5px] sm:text-xs">{data.totalQuestionsAttempted} Questions</span>
              </div>
            </div>
          </div>

          {/* Primary GWA Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1 p-3 rounded-2xl bg-muted/30 border border-border flex flex-col items-center justify-center text-center">
              <span className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                Predicted General Average
              </span>
              <div className="text-3xl sm:text-4xl font-black font-headline text-primary mt-0.5 tracking-tight">
                {data.predictedGwa.toFixed(2)}<span className="text-lg font-bold text-muted-foreground">%</span>
              </div>
              <div className="mt-1 text-[9.5px] font-semibold text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>PRC Benchmark: <strong className="text-foreground">75.00%</strong></span>
              </div>
            </div>

            <div className="sm:col-span-2 p-3 rounded-2xl bg-muted/30 border border-border flex flex-col justify-center space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9.5px] font-bold uppercase text-muted-foreground">National Standing Tier</span>
                <Badge variant="outline" className="border-primary/30 text-primary font-bold text-[9.5px] shrink-0 h-4.5">
                  {data.tierInfo.badge}
                </Badge>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{data.tierInfo.title}</span>
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {data.statusDescription}
              </p>
            </div>
          </div>

          {/* Detailed Subject Matrix Table */}
          <div className="rounded-2xl border border-border overflow-hidden bg-background">
            <div className="p-2.5 bg-muted/50 border-b border-border flex justify-between items-center">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                Official MTLE Subject Breakdown & Weights (RA 5527)
              </h4>
              <span className="text-[9px] text-muted-foreground font-semibold">100% Weight</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold text-[9px] uppercase">
                    <th className="py-1.5 px-3">Subject Area</th>
                    <th className="py-1.5 px-2 text-center">PRC Weight</th>
                    <th className="py-1.5 px-2 text-center">Predicted Score</th>
                    <th className="py-1.5 px-2 text-center">Weighted Pts</th>
                    <th className="py-1.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-[10.5px]">
                  {data.subjects.map((s) => {
                    const isSubjectCritical = s.score < 50;
                    const isSubjectPassing = s.score >= 75;
                    const weightedPoints = (s.score * s.weight).toFixed(2);

                    return (
                      <tr key={s.subject} className="hover:bg-muted/30 transition-colors">
                        <td className="py-1.5 px-3 font-semibold text-foreground">
                          {s.subject}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-muted-foreground">
                          <span className="inline-block px-1.5 py-0.5 rounded-md bg-muted text-[9px]">
                            {Math.round(s.weight * 100)}%
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-[11px] text-foreground">
                          {s.score.toFixed(1)}%
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono font-semibold text-primary text-[11px]">
                          {weightedPoints} pts
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
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
                    <td className="py-2 px-3 text-[10px] font-headline uppercase">
                      General Weighted Average
                    </td>
                    <td className="py-2 px-2 text-center text-[10.5px]">100%</td>
                    <td className="py-2 px-2 text-center text-[11px] font-mono text-primary">
                      {data.predictedGwa.toFixed(2)}%
                    </td>
                    <td className="py-2 px-2 text-center text-[11px] font-mono text-primary">
                      {data.predictedGwa.toFixed(2)} pts
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-[10px] font-bold text-primary">{data.statusTitle}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Statutory PRC Licensure Note */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div>
                <strong className="text-foreground">Official PRC MTLE Guidelines (RA 5527):</strong> To pass the licensure examination, a candidate must obtain a general weighted average of at least <strong>75.00%</strong> with <strong>no rating below 50.00%</strong> in any subject.
              </div>
              <div className="text-[8.5px] text-muted-foreground/80 font-mono">
                Formula: Weighted Points = [(Exam × 50%) + (Mastery × 30%) + (Syllabus × 20%)] × PRC Weight. Predicted GWA = Sum of Weighted Points.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs h-9 sm:h-10">
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs h-9 sm:h-10 flex items-center justify-center gap-2 shadow-md">
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
