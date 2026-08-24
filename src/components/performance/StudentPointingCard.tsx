"use client";

import { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Zap, 
  Target, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Sparkles, 
  TrendingUp,
  Calculator,
  CheckCircle2,
  SlidersHorizontal,
  PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SubjectMasteryItem } from './SubjectTechnicalBreakdown';

interface StudentPointingCardProps {
  totalPoints: number;
  avgProficiency: number;
  avgCompletion: number;
  masteredCount: number;
  totalSubjects: number;
  subjects?: SubjectMasteryItem[];
  userName?: string;
  onOpenScorecard: () => void;
}

export function StudentPointingCard({
  totalPoints,
  avgProficiency,
  avgCompletion,
  masteredCount,
  totalSubjects,
  subjects = [],
  userName = "MedTech Candidate",
  onOpenScorecard
}: StudentPointingCardProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  // Performance Tier Standing
  let tierBadge = "In Training";
  let tierColor = "bg-amber-500/10 text-amber-500 border-amber-500/30";

  if (avgProficiency >= 85) {
    tierBadge = "High Distinction";
    tierColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
  } else if (avgProficiency >= 70) {
    tierBadge = "Proficient Standing";
    tierColor = "bg-blue-500/10 text-blue-500 border-blue-500/30";
  }

  // Calculate live breakdown numbers for dynamic formula substitution
  const disciplinePointsSum = subjects.reduce((acc, s) => {
    return acc + Math.round((s.mastery || 0) * 12 + (s.completion || 0) * 6);
  }, 0);
  const estimatedSystemXp = Math.max(0, totalPoints - disciplinePointsSum);

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border p-4 sm:p-6 lg:p-8 shadow-xl space-y-6">
      {/* Background Subtle Accents */}
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-80 h-28 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner & Actions */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary border-primary/30">
              Student Performance Index
            </Badge>
            <Badge variant="outline" className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${tierColor}`}>
              {tierBadge}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-headline tracking-tight text-foreground uppercase">
            Academic Performance Scorecard
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl">
            Real-time score accumulation, discipline proficiency, and syllabus completion metrics.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <Button
            onClick={onOpenScorecard}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs h-9 sm:h-10 px-4 flex items-center gap-2 shadow-md flex-1 md:flex-initial"
          >
            <FileText className="w-4 h-4" />
            <span>Official Scorecard</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setGuideOpen(true)}
            className="rounded-xl text-xs h-9 sm:h-10 px-3.5 border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 flex-1 md:flex-initial font-bold"
          >
            <Calculator className="w-4 h-4 text-primary" />
            <span>Point Formula</span>
          </Button>
        </div>
      </div>

      {/* Primary Point KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10">
        
        {/* Metric 1: Total Earned Points */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-muted/20 border border-primary/20 space-y-1">
          <div className="flex items-center justify-between text-primary">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Earned Points</span>
            <Trophy className="w-4 h-4" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-headline text-primary tracking-tight">
            {totalPoints.toLocaleString()} <span className="text-base font-bold text-primary/70">Pts</span>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-medium truncate">
            Accumulated from exams & quests
          </p>
        </div>

        {/* Metric 2: Average Proficiency */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Proficiency</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-headline text-foreground tracking-tight">
            {avgProficiency.toFixed(1)}<span className="text-xl font-bold text-muted-foreground">%</span>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-medium truncate">
            Mean discipline proficiency rating
          </p>
        </div>

        {/* Metric 3: Average Completion */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Completion</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-headline text-foreground tracking-tight">
            {avgCompletion.toFixed(0)}<span className="text-xl font-bold text-muted-foreground">%</span>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-medium truncate">
            Mean syllabus module progress
          </p>
        </div>

        {/* Metric 4: Mastered Disciplines */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Mastered Disciplines</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-headline text-foreground tracking-tight">
            {masteredCount} <span className="text-base font-bold text-muted-foreground">/ {totalSubjects}</span>
          </div>
          <p className="text-[10.5px] text-muted-foreground font-medium truncate">
            {masteredCount >= 6 ? "All Disciplines Ready" : `${totalSubjects - masteredCount} Subjects In Training`}
          </p>
        </div>

      </div>

      {/* Point Derivation Explanation & Formula Specification Modal */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-7 bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold font-headline flex items-center gap-2 text-foreground uppercase tracking-tight">
              <Calculator className="w-5 h-5 text-primary shrink-0" />
              How Your Scores Are Calculated
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Direct, simple formulas for students to easily calculate performance metrics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 text-xs text-foreground py-3">
            
            {/* Formula 1: Total Earned Points */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <h4 className="font-bold text-primary flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-primary shrink-0" />
                  1. Total Earned Points
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  Simple Addition Formula
                </Badge>
              </div>

              {/* Simple Direct Equation Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-headline text-sm sm:text-base overflow-x-auto border border-slate-800 shadow-inner text-center font-bold">
                <span className="text-amber-400">Total Points</span> = <span className="text-blue-400">Quest Arena XP</span> + <span className="text-emerald-400">Subject Points</span>
              </div>

              {/* Live Candidate Substitution */}
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                  Your Live Current Score Calculation:
                </span>
                <div className="text-xs sm:text-sm text-foreground font-black font-mono">
                  {totalPoints.toLocaleString()} Total Pts = {estimatedSystemXp.toLocaleString()} XP + {disciplinePointsSum.toLocaleString()} Subject Pts
                </div>
              </div>

              <div className="text-[11.5px] text-muted-foreground space-y-1.5 leading-relaxed pt-1">
                <p>• <strong>Quest Arena XP:</strong> Earned by completing chapter nodes, mock exams, and daily login streaks.</p>
                <p>• <strong>Subject Points:</strong> Earn <strong>12 points</strong> per 1% subject proficiency and <strong>6 points</strong> per 1% syllabus completed across all 6 subjects.</p>
              </div>
            </div>

            {/* Formula 2: Average Proficiency */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <h4 className="font-bold text-emerald-500 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                  2. Average Proficiency
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-500">
                  Simple 6-Subject Average
                </Badge>
              </div>

              {/* Simple Direct Equation Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-headline text-sm sm:text-base overflow-x-auto border border-slate-800 shadow-inner text-center font-bold">
                <span className="text-emerald-400">Average Proficiency</span> = <span className="text-blue-400">(Sum of All 6 Subject Proficiencies)</span> ÷ <span className="text-amber-400">6</span>
              </div>

              {/* Live Candidate Substitution */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Your Live Current Score Calculation:
                </span>
                <div className="text-xs sm:text-sm text-foreground font-black font-mono overflow-x-auto">
                  ({subjects.map(s => `${(s.mastery || 0).toFixed(0)}%`).join(' + ')}) ÷ 6 = <span className="text-emerald-500 font-bold">{avgProficiency.toFixed(1)}%</span>
                </div>
              </div>

              <div className="text-[11.5px] text-muted-foreground space-y-1.5 leading-relaxed pt-1">
                <p>• <strong>Subject Proficiency:</strong> Your proficiency rating percentage stored in your <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground font-bold">SubjectMastery</code> records.</p>
                <p>• <strong>Divided by 6:</strong> Simply add your 6 subject proficiencies together and divide by 6.</p>
              </div>
            </div>

            {/* Formula 3: Average Completion */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <h4 className="font-bold text-blue-500 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                  3. Average Completion
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold border-blue-500/30 text-blue-500">
                  Simple Syllabus Average
                </Badge>
              </div>

              {/* Simple Direct Equation Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-headline text-sm sm:text-base overflow-x-auto border border-slate-800 shadow-inner text-center font-bold">
                <span className="text-blue-400">Average Completion</span> = <span className="text-amber-400">(Sum of All 6 Subject Completion %)</span> ÷ <span className="text-emerald-400">6</span>
              </div>

              {/* Live Candidate Substitution */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  Your Live Current Score Calculation:
                </span>
                <div className="text-xs sm:text-sm text-foreground font-black font-mono overflow-x-auto">
                  ({subjects.map(s => `${(s.completion || 0).toFixed(0)}%`).join(' + ')}) ÷ 6 = <span className="text-blue-500 font-bold">{avgCompletion.toFixed(0)}%</span>
                </div>
              </div>

              <div className="text-[11.5px] text-muted-foreground space-y-1.5 leading-relaxed pt-1">
                <p>• <strong>Subject Completion:</strong> Percentage of syllabus study modules completed in each subject.</p>
                <p>• <strong>Divided by 6:</strong> Simply add your 6 subject completion percentages together and divide by 6.</p>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setGuideOpen(false)} className="rounded-xl text-xs h-9">
              Close Specifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
