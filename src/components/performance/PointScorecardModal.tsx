"use client";

import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle2, AlertTriangle, Sparkles, GraduationCap, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { SubjectMasteryItem } from './SubjectTechnicalBreakdown';

interface PointScorecardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPoints: number;
  avgAccuracy: number;
  totalQuestions: number;
  subjects: SubjectMasteryItem[];
  userName?: string;
}

export function PointScorecardModal({
  open,
  onOpenChange,
  totalPoints,
  avgAccuracy,
  totalQuestions,
  subjects,
  userName = "MedTech Candidate"
}: PointScorecardModalProps) {
  const scorecardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
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

    const subjectsHtml = subjects.map(s => {
      const statusText = s.status || (s.mastery >= 90 ? 'Mastered' : s.mastery >= 75 ? 'Proficient' : s.mastery >= 50 ? 'In Training' : 'Needs Focus');
      const pts = s.points ?? Math.round(s.mastery * 10 + s.completion * 5);
      const statusStyle = statusText === 'Mastered' 
        ? 'background:#d1fae5; color:#047857; border:1px solid #a7f3d0;' 
        : statusText === 'Proficient'
        ? 'background:#dbeafe; color:#1d4ed8; border:1px solid #bfdbfe;' 
        : statusText === 'In Training'
        ? 'background:#fef3c7; color:#b45309; border:1px solid #fde68a;'
        : 'background:#f3f4f6; color:#4b5563; border:1px solid #e5e7eb;';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; font-size: 10.5pt;">${s.subject}</td>
          <td style="padding: 10px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 800; font-size: 11pt; color: #800000;">${pts} pts</td>
          <td style="padding: 10px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 700; font-size: 10.5pt; color: #0f172a;">${s.completion}%</td>
          <td style="padding: 10px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 800; font-size: 11pt; color: #047857;">${s.mastery}%</td>
          <td style="padding: 10px 14px; text-align: right;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 14px; font-size: 8.5pt; font-weight: 800; ${statusStyle}">${statusText}</span>
          </td>
        </tr>
      `;
    }).join('');

    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Performance Point Scorecard - ${userName}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 0; font-size: 10.5pt; line-height: 1.5; }
          
          .banner { background: linear-gradient(135deg, #800000 0%, #4a0000 100%); color: #ffffff; padding: 22px 26px; border-radius: 14px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(128,0,0,0.15); }
          .banner-title { font-size: 18pt; font-weight: 900; margin: 2px 0; letter-spacing: -0.5px; text-transform: uppercase; color: #ffffff; }
          .banner-sub { font-size: 9pt; color: #fde68a; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
          .banner-desc { font-size: 9.5pt; color: rgba(255,255,255,0.85); font-weight: 500; }
          
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; margin-top: 14px; font-size: 8.5pt; }
          .meta-label { opacity: 0.75; text-transform: uppercase; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
          .meta-val { font-size: 9.5pt; font-weight: 800; color: #ffffff; }
          
          .hero-grid { display: grid; grid-template-columns: 1fr 2.2fr; gap: 14px; margin-bottom: 16px; }
          .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px 18px; }
          .gwa-val { font-size: 32pt; font-weight: 900; color: #800000; font-family: 'Consolas', monospace; text-align: center; margin: 4px 0; letter-spacing: -1px; }
          
          .table-box { border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background: #f1f5f9; padding: 10px 14px; font-size: 8.5pt; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; letter-spacing: 0.5px; }
          tfoot tr { background: #fff5f5; border-top: 2.5px solid #fecdd3; font-weight: 900; }
          
          .footer-line { border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 20px; font-size: 8pt; color: #64748B; display: flex; justify-content: space-between; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="banner">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="banner-sub">BOARDQUEST ANALYTICS &bull; ACADEMIC PERFORMANCE TRANSCRIPT</div>
              <div class="banner-title">Student Performance Scorecard</div>
              <div class="banner-desc">Official Discipline Points & Technical Mastery Assessment</div>
            </div>
          </div>
          <div class="meta-grid">
            <div><span class="meta-label">CANDIDATE</span><span class="meta-val">${userName}</span></div>
            <div><span class="meta-label">ASSESSMENT DATE</span><span class="meta-val">${format(new Date(), 'MMM dd, yyyy')}</span></div>
            <div><span class="meta-label">TOTAL EARNED POINTS</span><span class="meta-val" style="color:#fde68a;">${totalPoints.toLocaleString()} Pts</span></div>
            <div><span class="meta-label">QUESTIONS SOLVED</span><span class="meta-val">${totalQuestions} Qs</span></div>
          </div>
        </div>

        <div class="hero-grid">
          <div class="card" style="text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="font-size: 8.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Accumulated Score</div>
            <div class="gwa-val">${totalPoints.toLocaleString()}</div>
            <div style="font-size: 8.5pt; color: #334155; font-weight: 700;">Overall Accuracy: <strong style="color:#0f172a;">${avgAccuracy.toFixed(1)}%</strong></div>
          </div>
          <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 8.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Academic Performance Summary</div>
            <div style="font-size: 12pt; font-weight: 800; color: #800000; margin-bottom: 4px;">${avgAccuracy >= 85 ? 'High Distinction Tier' : avgAccuracy >= 70 ? 'Proficient Standing' : 'In Training Tier'}</div>
            <div style="font-size: 8.5pt; color: #475569; line-height: 1.45;">Discipline point metrics compiled across Quest Arena exams, spaced retention quizzes, and syllabus review modules.</div>
          </div>
        </div>

        <div class="table-box">
          <table>
            <thead>
              <tr>
                <th>Subject Discipline</th>
                <th style="text-align:center;">Earned Points</th>
                <th style="text-align:center;">Syllabus Completion</th>
                <th style="text-align:center;">Subject Proficiency</th>
                <th style="text-align:right;">Standing</th>
              </tr>
            </thead>
            <tbody>
              ${subjectsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 12px 14px; font-weight: 900; text-transform: uppercase; font-size: 10pt;">Total Performance Summary</td>
                <td style="padding: 12px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 900; color: #800000; font-size: 12pt;">${totalPoints.toLocaleString()} pts</td>
                <td style="padding: 12px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 900; font-size: 11pt;">-</td>
                <td style="padding: 12px 14px; text-align: center; font-family: 'Consolas', monospace; font-weight: 900; color: #047857; font-size: 12pt;">${avgAccuracy.toFixed(1)}%</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 900; color: #800000; font-size: 10pt;">${avgAccuracy >= 85 ? 'Distinction' : 'Active'}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="footer-line">
          <span>BoardQuest Academic Analytics Platform</span>
          <span>Confidential &bull; Prepared for College of Medical Technology</span>
          <span>Official Student Point Scorecard</span>
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
          <DialogTitle>Official Student Performance Scorecard</DialogTitle>
          <DialogDescription>Itemized Points and Technical Breakdown</DialogDescription>
        </DialogHeader>

        {/* Modal Content */}
        <div id="mtle-printable-scorecard" ref={scorecardRef} className="space-y-3.5 sm:space-y-4">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#800000] via-[#5b0000] to-[#2b0000] text-white p-4 sm:p-5 shadow-md border border-amber-500/30">
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[9px] sm:text-xs font-bold tracking-[0.15em] uppercase text-amber-300">
                    BoardQuest Student Scorecard
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black font-headline tracking-tight leading-tight">
                  Academic Performance Transcript
                </h2>
                <p className="text-[10px] sm:text-xs text-white/80">
                  Itemized Discipline Points & Technical Breakdown
                </p>
              </div>

              <div className="shrink-0 self-start sm:self-auto">
                <div className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-300 shadow-md">
                  {totalPoints.toLocaleString()} PTS
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
                <span className="text-white/60 block text-[8.5px] sm:text-[9px] uppercase font-semibold">Overall Accuracy</span>
                <span className="font-bold text-amber-300 block text-[10.5px] sm:text-xs">{avgAccuracy.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-white/60 block text-[8.5px] sm:text-[9px] uppercase font-semibold">Questions Solved</span>
                <span className="font-bold text-white block text-[10.5px] sm:text-xs">{totalQuestions} Qs</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-border overflow-hidden bg-background">
            <div className="p-2.5 bg-muted/50 border-b border-border flex justify-between items-center">
              <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-foreground">
                Official Discipline Breakdown
              </h4>
              <span className="text-[9px] text-muted-foreground font-semibold">6 Subjects</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold text-[9px] uppercase">
                    <th className="py-2 px-3">Subject Discipline</th>
                    <th className="py-2 px-2 text-center">Earned Points</th>
                    <th className="py-2 px-2 text-center">Syllabus Completion</th>
                    <th className="py-2 px-2 text-center">Subject Proficiency</th>
                    <th className="py-2 px-3 text-right">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-[10.5px]">
                  {subjects.map((s) => {
                    const isMastered = s.status === "Mastered";
                    const pts = s.points ?? Math.round(s.mastery * 10 + s.completion * 5);

                    return (
                      <tr key={s.subject} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-semibold text-foreground">
                          {s.subject}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-xs text-primary">
                          {pts} pts
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-[11px] text-foreground">
                          {s.completion}%
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                          {s.mastery}%
                        </td>
                        <td className="py-2 px-3 text-right">
                          {(() => {
                            const statusText = s.status || (s.mastery >= 90 ? 'Mastered' : s.mastery >= 75 ? 'Proficient' : s.mastery >= 50 ? 'In Training' : 'Needs Focus');
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                                statusText === 'Mastered'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : statusText === 'Proficient'
                                  ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                  : statusText === 'In Training'
                                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}>
                                {statusText}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
