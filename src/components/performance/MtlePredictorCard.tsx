"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  Zap,
  Calculator,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  MtleReadinessResult,
  CRITICAL_SUBJECT_CUTOFF,
  PASSING_GWA_THRESHOLD,
  TOPNOTCHER_THRESHOLD
} from '@/lib/mtle-predictor-engine';
import { MtleScorecardModal } from './MtleScorecardModal';
import { MtleFormulaModal } from './MtleFormulaModal';
import { TooltipProvider } from '@/components/ui/tooltip';

interface MtlePredictorCardProps {
  data: MtleReadinessResult;
  userName?: string;
  onScrollToSimulator?: () => void;
}

export function MtlePredictorCard({ data, userName, onScrollToSimulator }: MtlePredictorCardProps) {
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);

  const isPassing = data.prcStatus === 'PASSED';
  const isConditional = data.prcStatus === 'CONDITIONAL';

  // SVG Gauge Calculations
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, data.predictedGwa)) / 100) * circumference;

  // Gauge Color Gradient
  let gaugeStrokeColor = '#3B82F6'; // Blue
  if (data.predictedGwa >= TOPNOTCHER_THRESHOLD && isPassing) {
    gaugeStrokeColor = '#EAB308'; // Gold
  } else if (isPassing) {
    gaugeStrokeColor = '#10B981'; // Emerald
  } else if (isConditional) {
    gaugeStrokeColor = '#F59E0B'; // Amber
  } else {
    gaugeStrokeColor = '#EF4444'; // Red
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        
        {/* Main Board Readiness Hero Card */}
        <Card className="border border-border shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-background">
          
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#800000]/15 via-primary/5 to-transparent border-b border-border p-3.5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              
              {/* Title & Metadata */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary truncate">
                      Official Licensure Analytics
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold border-primary/30 text-primary px-1.5 py-0">
                    PRC RA 5527
                  </Badge>
                </div>
                <h2 className="text-lg sm:text-2xl font-black font-headline text-foreground tracking-tight leading-snug">
                  MTLE Board Rating & Readiness Predictor
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  Dynamic weighted forecast synthesized from mock exams, topic mastery, and syllabus completion.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0 pt-1 sm:pt-0">
                <Button
                  onClick={() => setScorecardOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] sm:text-xs font-bold rounded-xl shadow-md h-9 sm:h-10 px-2.5 sm:px-4 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">Official Scorecard</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setFormulaOpen(true)}
                  className="text-[11px] sm:text-xs font-bold rounded-xl border-border h-9 sm:h-10 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  title="View Grading Formula and Calculation Proof"
                >
                  <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                  <span className="truncate">Grading Formula</span>
                </Button>

                {onScrollToSimulator && (
                  <Button
                    variant="outline"
                    onClick={onScrollToSimulator}
                    className="text-[11px] sm:text-xs font-bold rounded-xl border-border h-9 sm:h-10 px-2.5 sm:px-4 flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 w-full sm:w-auto"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                    <span className="truncate">What-If Simulator</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-3.5 sm:p-6 space-y-5 sm:space-y-6">
            
            {/* Top Grid: Speedometer Gauge & National Standing Tier (Matched Heights) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
              
              {/* Left: Animated Circular Gauge Card */}
              <div className="lg:col-span-5 flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border">
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center my-auto">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                    {/* Background Track */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      className="stroke-muted-foreground/15"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    {/* Progress Arc */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke={gaugeStrokeColor}
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Predicted GWA
                    </span>
                    <span className="text-2xl sm:text-4xl font-black font-headline text-foreground tracking-tight">
                      {data.predictedGwa.toFixed(2)}<span className="text-lg sm:text-xl font-bold text-muted-foreground">%</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground mt-0.5">
                      Pass Target: 75.00%
                    </span>
                  </div>
                </div>

                {/* PRC Status Pill */}
                <div className="mt-3 flex items-center justify-center w-full">
                  <div className={`px-3 py-1.5 rounded-full font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm border max-w-full text-center ${
                    isPassing
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : isConditional
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    {isPassing ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : isConditional ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{data.statusTitle}</span>
                  </div>
                </div>
              </div>

              {/* Right: National Tier & Diagnostic Overview */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className={`p-4 sm:p-5 rounded-2xl border bg-gradient-to-br ${data.tierInfo.bgGradient} border-border/80 space-y-2 flex-1 flex flex-col justify-center`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Readiness Tier
                    </span>
                    <Badge variant="outline" className="font-extrabold text-[10px] sm:text-xs shrink-0" style={{ borderColor: data.tierInfo.color, color: data.tierInfo.color }}>
                      {data.tierInfo.badge}
                    </Badge>
                  </div>
                  <h3 className="text-base sm:text-xl font-black font-headline text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
                    <span className="truncate">{data.tierInfo.title}</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    {data.tierInfo.description}
                  </p>
                </div>

                {/* Confidence & Metrics Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase block truncate">
                      Confidence Rating
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1 mt-0.5">
                      <span className="truncate">{data.confidenceRating}</span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-normal shrink-0">({data.confidenceScore}%)</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border">
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase block truncate">
                      Questions Done
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-foreground mt-0.5 block truncate">
                      {data.totalQuestionsAttempted} Questions
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border col-span-2 sm:col-span-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase block truncate">
                      Deficiency Count
                    </span>
                    <span className={`text-xs sm:text-sm font-bold mt-0.5 block truncate ${data.criticalSubjectsCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {data.criticalSubjectsCount > 0 ? `${data.criticalSubjectsCount} Below 50%` : 'None (0)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 MTLE Core Subjects Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-black font-headline uppercase tracking-wider text-foreground">
                    Statutory 6-Subject Performance Matrix
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    PRC Passing Target: 75.00% &bull; Critical Cutoff: 50.00%
                  </p>
                </div>
                
                {/* Transparency Formula Badge Button */}
                <button
                  type="button"
                  onClick={() => setFormulaOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-[10px] sm:text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5 shrink-0" />
                  <span>Formula: (50% Arena + 30% Mastery + 20% Syllabus) × Weight</span>
                  <span className="underline ml-0.5">View Proof</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {data.subjects.map((subject) => {
                  const isCritical = subject.score < CRITICAL_SUBJECT_CUTOFF;
                  const isSubjectPassing = subject.score >= PASSING_GWA_THRESHOLD;
                  const weightPct = Math.round(subject.weight * 100);

                  return (
                    <div
                      key={subject.subject}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                        isCritical
                          ? 'bg-rose-500/5 border-rose-500/30'
                          : 'bg-muted/20 border-border/80 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[220px]">
                              {subject.subject}
                            </h5>
                            <Badge variant="outline" className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0 rounded-md bg-muted shrink-0">
                              {weightPct}% PRC Weight
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                            Weighted Value: <strong className="text-primary font-mono">{(subject.score * subject.weight).toFixed(2)} pts</strong>
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-lg font-black font-mono text-foreground">
                            {subject.score.toFixed(1)}%
                          </span>
                          <span className={`block text-[8px] sm:text-[9px] font-bold uppercase ${
                            isCritical ? 'text-rose-500' : isSubjectPassing ? 'text-emerald-500' : 'text-amber-500'
                          }`}>
                            {isCritical ? 'Below 50% Cutoff' : isSubjectPassing ? 'Passing' : 'Needs Review'}
                          </span>
                        </div>
                      </div>

                      {/* Score Progress Bar */}
                      <Progress
                        value={subject.score}
                        className={`h-2 rounded-full mb-2.5 ${
                          isCritical
                            ? '[&>div]:bg-rose-500'
                            : isSubjectPassing
                            ? '[&>div]:bg-emerald-500'
                            : '[&>div]:bg-amber-500'
                        }`}
                      />

                      {/* Lesson & Quest Sub-metrics */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-2 font-medium">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          <span>Syllabus: <strong className="text-foreground">{subject.lessonCompletion}%</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Mastery: <strong className="text-foreground">{subject.masteryScore}%</strong></span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic Remediation Advice */}
            {data.remediationAdvice.length > 0 && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 sm:space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    High-Impact Remediation Prescription
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {data.remediationAdvice.map((advice, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-background/80 border border-border/80 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-primary truncate">
                          {advice.targetSubject}
                        </span>
                        <Badge variant="outline" className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0 shrink-0 ${
                          advice.priority === 'HIGH' ? 'border-rose-500 text-rose-500' : 'border-amber-500 text-amber-500'
                        }`}>
                          {advice.priority}
                        </Badge>
                      </div>
                      <h5 className="text-[11px] sm:text-xs font-bold text-foreground leading-snug">{advice.title}</h5>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">{advice.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Official Scorecard Dialog */}
        <MtleScorecardModal
          open={scorecardOpen}
          onOpenChange={setScorecardOpen}
          data={data}
          userName={userName}
        />

        {/* Calculation Transparency & Formula Modal */}
        <MtleFormulaModal
          open={formulaOpen}
          onOpenChange={setFormulaOpen}
          data={data}
        />
      </div>
    </TooltipProvider>
  );
}
