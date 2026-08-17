"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Award,
  Zap,
  Target,
} from 'lucide-react';
import {
  MtleSubjectScore,
  simulateWhatIfGwa,
  PASSING_GWA_THRESHOLD,
  CRITICAL_SUBJECT_CUTOFF,
} from '@/lib/mtle-predictor-engine';

interface MtleWhatIfSimulatorProps {
  subjects: MtleSubjectScore[];
  currentGwa: number;
}

export function MtleWhatIfSimulator({ subjects, currentGwa }: MtleWhatIfSimulatorProps) {
  // Initialize slider state with current subject scores
  const [simulatedScores, setSimulatedScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    subjects.forEach(s => {
      initial[s.subject] = s.score;
    });
    return initial;
  });

  const handleScoreChange = (subjectName: string, value: number) => {
    setSimulatedScores(prev => ({
      ...prev,
      [subjectName]: value,
    }));
  };

  const handleReset = () => {
    const initial: Record<string, number> = {};
    subjects.forEach(s => {
      initial[s.subject] = s.score;
    });
    setSimulatedScores(initial);
  };

  const applyPreset = (targetGwa: number) => {
    const updated: Record<string, number> = {};
    subjects.forEach(s => {
      // Set all subjects to target score
      updated[s.subject] = targetGwa;
    });
    setSimulatedScores(updated);
  };

  const { simulatedGwa, delta, simulatedStatus } = useMemo(() => {
    return simulateWhatIfGwa(subjects, simulatedScores);
  }, [subjects, simulatedScores]);

  const isPassing = simulatedStatus.prcStatus === 'PASSED';
  const isConditional = simulatedStatus.prcStatus === 'CONDITIONAL';

  return (
    <Card className="border border-border shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden bg-background">
      <CardHeader className="bg-muted/40 border-b border-border p-3.5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
              <CardTitle className="text-base sm:text-xl font-bold font-headline text-foreground truncate">
                MTLE "What-If" Board Rating Simulator
              </CardTitle>
            </div>
            <CardDescription className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              Adjust expected subject scores to model your predicted GWA and test PRC licensure scenarios.
            </CardDescription>
          </div>

          {/* Reset Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl text-[11px] sm:text-xs h-8 sm:h-9 flex items-center gap-1.5 self-start sm:self-auto border-border/80 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Current
          </Button>
        </div>

        {/* Quick Goal Presets */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2.5 sm:pt-3">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Presets:
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => applyPreset(75)}
            className="h-7 text-[10px] sm:text-xs px-2 sm:px-2.5 rounded-lg font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Target className="w-3 h-3 mr-1 text-blue-500 shrink-0" />
            Pass (75%)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => applyPreset(85)}
            className="h-7 text-[10px] sm:text-xs px-2 sm:px-2.5 rounded-lg font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Award className="w-3 h-3 mr-1 text-emerald-500 shrink-0" />
            Honors (85%)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => applyPreset(92)}
            className="h-7 text-[10px] sm:text-xs px-2 sm:px-2.5 rounded-lg font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Sparkles className="w-3 h-3 mr-1 text-amber-500 shrink-0" />
            Top 10 (92%)
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        
        {/* Dynamic Simulation Result Banner */}
        <div className={`p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 ${
          isPassing 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : isConditional 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-rose-500/10 border-rose-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            
            {/* Left: Simulated Score & Delta */}
            <div className="space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Simulated General Weighted Average
              </span>
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-4xl font-black font-headline text-foreground">
                  {simulatedGwa.toFixed(2)}%
                </span>
                
                {/* Delta Badge */}
                {delta !== 0 && (
                  <Badge
                    variant="outline"
                    className={`font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                      delta > 0
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'
                    }`}
                  >
                    <TrendingUp className={`w-3 h-3 ${delta < 0 ? 'rotate-180' : ''}`} />
                    {delta > 0 ? `+${delta.toFixed(2)}%` : `${delta.toFixed(2)}%`} vs Live
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: Projected PRC Licensure Status */}
            <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Simulated Outcome
                </span>
                <span className="text-xs font-bold text-foreground">
                  {simulatedStatus.statusTitle}
                </span>
              </div>
              <div className={`px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-xs uppercase flex items-center gap-1.5 sm:gap-2 shadow-sm border ${
                isPassing 
                  ? 'bg-emerald-600 text-white border-emerald-500' 
                  : isConditional
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-rose-600 text-white border-rose-500'
              }`}>
                {isPassing ? <CheckCircle2 className="w-3.5 h-3.5" /> : isConditional ? <AlertTriangle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {simulatedStatus.prcStatus}
              </div>
            </div>
          </div>

          <p className="mt-2.5 sm:mt-3 text-[11px] sm:text-xs text-muted-foreground/90 border-t border-border/40 pt-2 sm:pt-2.5 leading-relaxed">
            {simulatedStatus.statusDescription}
          </p>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
          {subjects.map((s) => {
            const currentScore = simulatedScores[s.subject] ?? s.score;
            const isCritical = currentScore < CRITICAL_SUBJECT_CUTOFF;
            const isPassingSub = currentScore >= PASSING_GWA_THRESHOLD;
            const weightPercent = Math.round(s.weight * 100);
            const liveScore = s.score;
            const scoreDelta = currentScore - liveScore;

            return (
              <div
                key={s.subject}
                className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                  isCritical 
                    ? 'bg-rose-500/5 border-rose-500/30' 
                    : 'bg-muted/20 border-border/80 hover:border-primary/40'
                }`}
              >
                {/* Subject Header */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[220px]">
                        {s.subject}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0"
                      >
                        {weightPercent}% Weight
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                      Live: <strong className="text-foreground">{liveScore.toFixed(1)}%</strong>
                    </span>
                  </div>

                  {/* Target Score Number */}
                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-black font-mono text-foreground flex items-center justify-end gap-1">
                      <span>{Math.round(currentScore)}%</span>
                      {scoreDelta !== 0 && (
                        <span className={`text-[9px] sm:text-[10px] font-bold ${
                          scoreDelta > 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          ({scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}%)
                        </span>
                      )}
                    </div>
                    <span className={`block text-[8px] sm:text-[9px] font-bold uppercase ${
                      isCritical ? 'text-rose-500 font-black' : isPassingSub ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {isCritical ? 'Below 50% Cutoff' : isPassingSub ? 'Passing' : 'Needs Review'}
                    </span>
                  </div>
                </div>

                {/* Touch-Friendly Slider */}
                <div className="py-1.5 sm:py-2">
                  <Slider
                    value={[currentScore]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(val) => handleScoreChange(s.subject, val[0])}
                    className="cursor-pointer"
                  />
                </div>

                {/* Slider Scale Indicators */}
                <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5">
                  <span>0%</span>
                  <span className="text-rose-500 font-bold">50% (Cutoff)</span>
                  <span className="text-blue-500 font-bold">75% (Pass)</span>
                  <span>100%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Strategic Impact Pro-Tip */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start sm:items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground">
          <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">
            <strong className="text-foreground">PRC Weighting Multiplier:</strong> Every +10% gain in a 20% weight subject (Chem, Micro, Hema, Immuno) adds <strong className="text-primary">+2.00%</strong> to your GWA (vs +1.00% for 10% weight subjects).
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
