"use client";

import { useState } from 'react';
import { 
  Trophy, 
  Award, 
  BookOpen, 
  FileText, 
  TrendingUp,
  Calculator,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SubjectMasteryItem } from './SubjectTechnicalBreakdown';
import { getSubjectVolumeBenchmark } from '@/lib/game-logic';

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
  userName: _userName = "MedTech Candidate",
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
    return acc + (s.points ?? Math.round((s.mastery || 0) * 12 + (s.completion || 0) * 6));
  }, 0);
  const estimatedSystemXp = Math.max(0, totalPoints - disciplinePointsSum);

  const totalPassingTopics = subjects.reduce((sum, s) => sum + (s.passingTopics || 0), 0);
  const totalCurriculumTopics = subjects.reduce((sum, s) => sum + (s.totalTopics || 0), 0);
  const overallTopicMastery = totalCurriculumTopics > 0
    ? Math.round((totalPassingTopics / totalCurriculumTopics) * 100)
    : 0;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 xl:gap-4 relative z-10">
        
        {/* Metric 1: Total Earned Points */}
        <div className="p-3.5 xl:p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-muted/20 border border-primary/20 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-1 text-primary min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Total Earned Points</span>
            <Trophy className="w-4 h-4 shrink-0" />
          </div>
          <div className="text-3xl sm:text-3xl lg:text-2xl xl:text-4xl font-black font-headline text-primary tracking-tight truncate">
            {totalPoints.toLocaleString()} <span className="text-sm xl:text-base font-bold text-primary/70">Pts</span>
          </div>
          <p className="text-[10px] xl:text-[10.5px] text-muted-foreground font-medium truncate">
            Accumulated from exams & quests
          </p>
        </div>

        {/* Metric 2: Average Proficiency */}
        <div className="p-3.5 xl:p-4 rounded-2xl bg-muted/40 border border-border space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-1 text-muted-foreground min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Average Proficiency</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-3xl sm:text-3xl lg:text-2xl xl:text-4xl font-black font-headline text-foreground tracking-tight truncate">
            {avgProficiency.toFixed(1)}<span className="text-lg xl:text-xl font-bold text-muted-foreground">%</span>
          </div>
          <p className="text-[10px] xl:text-[10.5px] text-muted-foreground font-medium truncate">
            Mean discipline proficiency rating
          </p>
        </div>

        {/* Metric 3: Average Completion */}
        <div className="p-3.5 xl:p-4 rounded-2xl bg-muted/40 border border-border space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-1 text-muted-foreground min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Average Completion</span>
            <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <div className="text-3xl sm:text-3xl lg:text-2xl xl:text-4xl font-black font-headline text-foreground tracking-tight truncate">
            {avgCompletion.toFixed(0)}<span className="text-lg xl:text-xl font-bold text-muted-foreground">%</span>
          </div>
          <p className="text-[10px] xl:text-[10.5px] text-muted-foreground font-medium truncate">
            Mean syllabus module progress
          </p>
        </div>

        {/* Metric 4: Mastered Disciplines */}
        <div className="p-3.5 xl:p-4 rounded-2xl bg-muted/40 border border-border space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-1 text-muted-foreground min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">Mastered Disciplines</span>
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-3xl sm:text-3xl lg:text-2xl xl:text-4xl font-black font-headline text-foreground tracking-tight truncate">
            {masteredCount} <span className="text-sm xl:text-base font-bold text-muted-foreground">/ {totalSubjects}</span>
          </div>
          <p className="text-[10px] xl:text-[10.5px] text-muted-foreground font-medium truncate">
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
                <p>• <strong>Subject Proficiency:</strong> The volume-weighted accuracy percentage for each discipline (detailed in Formula 3 below).</p>
                <p>• <strong>Divided by 6:</strong> Simply add your 6 subject proficiencies together and divide by 6.</p>
              </div>
            </div>

            {/* Formula 3: Subject Proficiency */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <h4 className="font-bold text-cyan-500 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-cyan-500 shrink-0" />
                  3. Subject Proficiency
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold border-cyan-500/30 text-cyan-500">
                  Volume-Weighted Accuracy Formula
                </Badge>
              </div>

              {/* Simple Direct Equation Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-headline text-sm sm:text-base overflow-x-auto border border-slate-800 shadow-inner text-center font-bold space-y-1.5">
                <div>
                  <span className="text-cyan-400">Subject Proficiency</span> = <span className="text-emerald-400">Raw Accuracy (%)</span> × <span className="text-blue-400">Volume Weight Factor</span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-400 font-normal">
                  where <span className="text-emerald-300">Raw Accuracy</span> = (<span className="text-emerald-300">Total Correct</span> ÷ <span className="text-emerald-300">Questions Answered</span>) × 100%
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline"> &bull; </span>
                  and <span className="text-blue-300">Volume Weight</span> = min(1.0, <span className="text-blue-300">Questions Answered</span> ÷ <span className="text-blue-300">Benchmark</span>)
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    (Benchmark = min(<strong>Available Bank Qs</strong>, <strong>300 Qs</strong> Major / <strong>150 Qs</strong> Minor PRC Ceiling))
                  </span>
                </div>
              </div>

              {/* Live Candidate Substitution */}
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block">
                  Your Live Current Score Calculation:
                </span>
                <div className="text-xs sm:text-sm text-foreground font-black font-mono overflow-x-auto">
                  {subjects.some(s => (s.totalQuestionsAnswered ?? 0) > 0) ? (
                    <span>Raw Accuracy (%) × min(1.0, Questions ÷ Benchmark [min(Bank Qs, 300/150)]) = Subject Proficiency (%)</span>
                  ) : (
                    <span>No questions answered yet — Volume Weight is 0% (Answer questions in Quest Arena to build proficiency)</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono flex flex-wrap gap-x-2.5 gap-y-1 pt-1 border-t border-cyan-500/20">
                  {subjects.map(s => {
                    const q = s.totalQuestionsAnswered ?? 0;
                    const c = s.totalCorrect ?? 0;
                    const acc = q > 0 ? Math.round((c / q) * 100) : 0;
                    const benchmark = s.volumeBenchmark || getSubjectVolumeBenchmark(s.subject, s.totalAvailableQuestions);
                    const weightPct = Math.min(100, Math.round((q / benchmark) * 100));
                    return (
                      <span key={s.subject} className="whitespace-nowrap">
                        {s.shortName || s.subject.split(' ')[0]}: <strong className="text-foreground">{s.mastery}%</strong>{' '}
                        <span className="text-[10px] text-muted-foreground">
                          ({acc}% acc × {weightPct}% wt &bull; {c}/{q} Qs &bull; target {benchmark})
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11.5px] text-muted-foreground space-y-1.5 leading-relaxed pt-1">
                <p>• <strong>Raw Accuracy:</strong> Percentage of correct answers scored in that subject: <code>(Total Correct ÷ Questions Answered) × 100%</code> across Quest Arena battles and practice quizzes.</p>
                <p>• <strong>Volume Weight Factor:</strong> Calculated as <code>min(1.0, Questions Answered ÷ Benchmark)</code>, dynamically calibrated to <code>min(Available Bank Questions, PRC Ceiling)</code>: adapts to the published bank size (e.g., <strong>100 questions</strong>) and caps at official PRC Licensure weights once reached (<strong>300 questions</strong> for Major 20% disciplines, <strong>150 questions</strong> for Minor 10% disciplines).</p>
                <p>• <strong>Status Gate Prerequisites:</strong> Requires <strong>≥75% Proficiency</strong> (along with ≥75% Topic Mastery & ≥25% Syllabus Completion) to unlock <span className="text-blue-500 font-bold">Proficient</span> status, and <strong>≥90% Proficiency</strong> (along with ≥85% Topic Mastery & ≥75% Syllabus Completion) to unlock <span className="text-emerald-500 font-bold">Mastered</span> status in that discipline.</p>
              </div>
            </div>

            {/* Formula 4: Average Completion */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <h4 className="font-bold text-blue-500 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                  4. Average Completion
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

            {/* Formula 5: Subject Topic Mastery */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <h4 className="font-bold text-amber-500 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  5. Subject Topic Mastery
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold border-amber-500/30 text-amber-500">
                  Topic Coverage Formula
                </Badge>
              </div>

              {/* Simple Direct Equation Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-headline text-sm sm:text-base overflow-x-auto border border-slate-800 shadow-inner text-center font-bold">
                <span className="text-amber-400">Subject Topic Mastery</span> = (<span className="text-emerald-400">Passing Topics</span> ÷ <span className="text-blue-400">Total Subject Topics</span>) × <span className="text-purple-400">100%</span>
              </div>

              {/* Live Candidate Substitution */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Your Live Current Score Calculation:
                </span>
                {totalCurriculumTopics > 0 ? (
                  <>
                    <div className="text-xs sm:text-sm text-foreground font-black font-mono overflow-x-auto">
                      ({totalPassingTopics} Passing Topics ÷ {totalCurriculumTopics} Total Topics) × 100% = <span className="text-amber-500 font-bold">{overallTopicMastery}%</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono flex flex-wrap gap-x-2.5 gap-y-1 pt-1 border-t border-amber-500/20">
                      {subjects.map(s => (
                        <span key={s.subject} className="whitespace-nowrap">
                          {s.shortName || s.subject.split(' ')[0]}: <strong className="text-foreground">{s.passingTopics ?? 0}/{s.totalTopics ?? 0}</strong> ({s.topicCoverage ?? 0}%)
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground font-mono">
                    ({subjects.map(s => `${s.topicCoverage ?? 0}%`).join(' • ')}) — Topics calibrating dynamically from attempts.
                  </div>
                )}
              </div>

              <div className="text-[11.5px] text-muted-foreground space-y-1.5 leading-relaxed pt-1">
                <p>• <strong>Passing Topics:</strong> Sum of topics with <strong>Mastered</strong> (≥85% accuracy, min. 3 questions answered) and <strong>Proficient</strong> (≥70% accuracy, min. 2 attempts) standing.</p>
                <p>• <strong>Total Subject Topics:</strong> Total recognized curriculum modules and topics established for that subject discipline.</p>
                <p>• <strong>Status Gate Prerequisites:</strong> Requires <strong>≥75% Topic Mastery</strong> to unlock <span className="text-blue-500 font-bold">Proficient</span> status, and <strong>≥85% Topic Mastery</strong> to unlock <span className="text-amber-500 font-bold">Mastered</span> status in that discipline.</p>
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
