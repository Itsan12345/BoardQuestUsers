"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Brain,
  Target,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Settings,
  RefreshCw,
  Zap,
  BookOpen,
  Sword,
  Clock,
  Loader2,
  Trophy,
  GraduationCap,
  Info,
  Compass
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SubjectMasteryItem } from './SubjectTechnicalBreakdown';
import {
  getAiDiagnosticAction,
  type AiDiagnosticResponse
} from '@/app/actions/diagnostic';
import { type GenerateDiagnosticOutput } from '@/ai/flows/generate-diagnostic-analysis';

export interface StatusTierInfo {
  id: 'TOPNOTCHER_TRACK' | 'PASSING_STANDARD' | 'BORDERLINE' | 'CRITICAL_FOCUS' | 'BASELINE_PENDING';
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  scoreRange: string;
  headline: string;
  description: string;
}

export const STATUS_TIERS: StatusTierInfo[] = [
  {
    id: 'TOPNOTCHER_TRACK',
    label: 'Top Performer',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: Trophy,
    scoreRange: '85% – 100% Mastery',
    headline: 'Elite board caliber across all 6 disciplines.',
    description: 'Scoring at an honors rank. Demonstrates exceptional accuracy and mastery across the entire Philippine MTLE syllabus.',
  },
  {
    id: 'PASSING_STANDARD',
    label: 'Exam Ready',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    icon: CheckCircle2,
    scoreRange: '75% – 84% Mastery',
    headline: 'Meeting the official 75% PRC passing standard.',
    description: 'On track to pass! All core disciplines are secure above the 50% minimum threshold with a solid overall passing margin.',
  },
  {
    id: 'BORDERLINE',
    label: 'Almost Ready',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icon: TrendingUp,
    scoreRange: '60% – 74% Mastery',
    headline: 'Approaching passing mark; needs a final push.',
    description: 'Close to passing standard. A few focused drills in your weakest subjects will elevate you over the 75% threshold.',
  },
  {
    id: 'CRITICAL_FOCUS',
    label: 'Needs Work',
    color: 'bg-primary/10 text-primary border-primary/30',
    icon: AlertCircle,
    scoreRange: 'Under 60% Mastery',
    headline: 'Requires reinforcement in low-scoring areas.',
    description: 'Vulnerable in one or more major subjects. Immediate review of core concepts and flash quizzes is recommended.',
  },
  {
    id: 'BASELINE_PENDING',
    label: 'Getting Started',
    color: 'bg-muted text-muted-foreground border-border',
    icon: Sparkles,
    scoreRange: 'Initial Calibration Phase',
    headline: 'Review journey just begun; calibrating scores.',
    description: 'You are at the start of your journey. Complete chapter quests in multiple subjects to unlock your official score rating.',
  },
];

export interface AiDiagnosticPrescriptionProps {
  avgMastery: number;
  avgCompletion: number;
  fullMastery: SubjectMasteryItem[];
  nextObjective?: any;
  userSettings?: any;
  onNavigateToStudy?: (subjectName?: string) => void;
  onNavigateToQuest?: (subjectName?: string) => void;
  onOpenGoalSettings?: () => void;
}

export function AiDiagnosticPrescription({
  avgMastery: _avgMastery,
  avgCompletion: _avgCompletion,
  fullMastery,
  nextObjective: _nextObjective,
  userSettings,
  onNavigateToStudy,
  onNavigateToQuest,
  onOpenGoalSettings
}: AiDiagnosticPrescriptionProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<AiDiagnosticResponse | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Extract account settings priority focus subject
  const accountFocusSubject = (userSettings?.focusSubject && userSettings.focusSubject !== 'none')
    ? userSettings.focusSubject
    : null;
  const dailyQuota = userSettings?.dailyQuota || 50;

  // Fetch or retrieve cached AI Diagnostic
  const fetchDiagnostic = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await getAiDiagnosticAction({ forceRefresh });
      setDiagnosticData(res);
      if (res?.cooldownSeconds !== undefined) {
        setCooldownRemaining(res.cooldownSeconds);
      }
    } catch (err) {
      console.error('Failed to load AI Diagnostic Analysis:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostic(false);
  }, [fetchDiagnostic]);

  // Live countdown timer ticking down every 1 second
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const analysis: GenerateDiagnosticOutput | undefined = diagnosticData?.analysis;

  // Format updated timestamp
  const getFormattedTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  // Format countdown mm:ss
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Status Badge Configuration
  const getStatusBadge = () => {
    const status = analysis?.readinessStatus || 'BASELINE_PENDING';
    const found = STATUS_TIERS.find(t => t.id === status);
    if (found) {
      return {
        ...found,
        label: analysis?.readinessLabel || found.label,
      };
    }
    return {
      id: 'BASELINE_PENDING' as const,
      label: analysis?.readinessLabel || 'Getting Started',
      color: 'bg-muted text-muted-foreground border-border',
      icon: Sparkles,
      scoreRange: 'Initial Phase',
      headline: 'Calibrating baseline',
      description: 'Complete quizzes across subjects to unlock your official tier.',
    };
  };

  const statusBadge = getStatusBadge();

  // Local fallback calculations for immediate responsiveness
  const sortedSubjects = [...fullMastery].sort((a, b) => a.mastery - b.mastery);
  const strongest = sortedSubjects[sortedSubjects.length - 1] || { subject: 'Clinical Chemistry', mastery: 0 };
  const prioritySubjectItem = accountFocusSubject
    ? fullMastery.find(m => m.subject.toLowerCase() === accountFocusSubject.toLowerCase()) || { subject: accountFocusSubject, mastery: 0 }
    : null;
  const hasRecordedMastery = fullMastery.some(m => m.mastery > 0 || m.completion > 0);

  // Handle remediation step action routing
  const handleActionClick = (step: GenerateDiagnosticOutput['remediationPlan'][0]) => {
    if (step.actionType === 'goals') {
      onOpenGoalSettings?.();
    } else if (step.actionType === 'quest') {
      const target = step.targetSubject !== 'Quest Arena' && step.targetSubject !== 'Account Goals'
        ? step.targetSubject
        : undefined;
      onNavigateToQuest?.(target);
    } else {
      const target = step.targetSubject !== 'Account Goals' ? step.targetSubject : undefined;
      onNavigateToStudy?.(target);
    }
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-2xl sm:rounded-3xl bg-card text-card-foreground p-4 sm:p-6 md:p-7 lg:p-8 relative overflow-hidden group transition-colors">
      
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 sm:w-96 h-80 sm:h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-accent" />

      <div className="relative z-10 space-y-5 sm:space-y-6">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-b border-border/80 pb-4 sm:pb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-sm shrink-0">
              <Brain className={cn("w-5 h-5 sm:w-6 sm:h-6 text-primary", (loading || refreshing) && "animate-pulse")} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Genkit AI Diagnostic Engine
                </span>
                
                {/* Cache Status Badge */}
                {diagnosticData && !loading && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border-border flex items-center gap-1"
                  >
                    {diagnosticData.cached ? (
                      <>
                        <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Cached ({getFormattedTime(diagnosticData.updatedAt)})
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5 text-primary" /> Live AI ({getFormattedTime(diagnosticData.updatedAt)})
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black font-headline tracking-tight text-foreground uppercase truncate">
                AI Diagnostic & Remediation Prescription
              </h2>
            </div>
          </div>

          {/* Right Action Controls: Interactive Status Badge Popover + Refresh + Goal Settings */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            
            {/* Interactive Status Tier Guide Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 rounded-xl shadow-xs uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40",
                    statusBadge.color
                  )}
                  title="Click to view all 5 board readiness status tiers and passing criteria"
                >
                  <statusBadge.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{statusBadge.label}</span>
                  <Info className="w-3 h-3 opacity-60 hover:opacity-100 ml-0.5 shrink-0" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[92vw] max-w-[360px] sm:w-[380px] p-4 rounded-2xl bg-card border-2 border-primary/20 shadow-2xl space-y-3 z-[60]"
              >
                {/* Popover Header */}
                <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-foreground">
                        Board Readiness Tiers
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Official PRC Philippine MTLE passing criteria
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 shrink-0">
                    5 Tiers
                  </Badge>
                </div>

                {/* Tiers List */}
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
                  {STATUS_TIERS.map((tier) => {
                    const isCurrent = (analysis?.readinessStatus || 'BASELINE_PENDING') === tier.id;
                    const TierIcon = tier.icon;
                    return (
                      <div
                        key={tier.id}
                        className={cn(
                          "p-2.5 rounded-xl border transition-all text-left space-y-1 relative",
                          isCurrent
                            ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                            : "bg-muted/30 border-border/70 hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TierIcon className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span className="text-[11px] font-extrabold uppercase text-foreground truncate">
                              {tier.label}
                            </span>
                            <span className="text-[9.5px] font-mono text-muted-foreground font-semibold">
                              ({tier.scoreRange})
                            </span>
                          </div>
                          {isCurrent && (
                            <Badge className="text-[8.5px] font-black uppercase px-1.5 py-0 bg-primary text-primary-foreground shrink-0 shadow-xs">
                              Your Tier
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10.5px] text-muted-foreground leading-snug">
                          {tier.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Tip */}
                <div className="pt-2 border-t border-border/80 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-primary shrink-0" />
                  <span>Answer questions across multiple disciplines to climb the ladder!</span>
                </div>
              </PopoverContent>
            </Popover>

            {/* AI Regenerate / Refresh Button with Live Cooldown Timer */}
            <Button
              size="sm"
              variant="outline"
              disabled={loading || refreshing || cooldownRemaining > 0}
              onClick={() => fetchDiagnostic(true)}
              title={
                cooldownRemaining > 0
                  ? `AI Diagnostic is fresh. Next regeneration available in ${formatCooldown(cooldownRemaining)}.`
                  : "Regenerate AI Diagnostic Analysis via Google Genkit"
              }
              className={cn(
                "h-8 px-2.5 rounded-xl text-xs font-bold border-border/80 bg-background transition-all duration-200 active:scale-95 shadow-xs flex items-center gap-1.5",
                cooldownRemaining > 0
                  ? "opacity-80 text-muted-foreground cursor-not-allowed bg-muted/40"
                  : "hover:bg-muted hover:border-primary/40 text-muted-foreground hover:text-foreground cursor-pointer"
              )}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                  <span className="hidden xs:inline">Analyzing...</span>
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-mono text-[11px] font-bold">
                    <span className="hidden sm:inline">Regenerate in </span>{formatCooldown(cooldownRemaining)}
                  </span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="hidden xs:inline">Regenerate</span>
                </>
              )}
            </Button>

            {onOpenGoalSettings && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenGoalSettings}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold border-primary/30 hover:bg-primary/10 text-primary flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Configure Goals</span>
              </Button>
            )}
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && !analysis ? (
          <div className="py-12 sm:py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs sm:text-sm font-semibold text-center">
              Evaluating discipline accuracy & generating AI diagnostic prescription...
            </p>
          </div>
        ) : (
          <>
            {/* Prescription Overview Card Banner */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-muted/60 dark:bg-muted/40 border border-border space-y-2.5">
              <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                  <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground leading-relaxed break-words">
                      {analysis?.headline || (
                        accountFocusSubject
                          ? `🎯 Account Priority Goal Active: Your focus discipline is set to "${accountFocusSubject}" (${dailyQuota} Qs/day target).`
                          : "✨ Prioritized Goal Action Required: Set a focus subject in Account Settings to align your AI Diagnostic roadmap."
                      )}
                    </p>
                    {analysis?.executiveSummary && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        {analysis.executiveSummary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 self-start">
                  {accountFocusSubject ? (
                    <Badge variant="secondary" className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 shrink-0">
                      🎯 {accountFocusSubject} Focus
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                      ⚠️ Goal Setup Required
                    </Badge>
                  )}
                </div>
              </div>

              {/* Cache notice if stale */}
              {diagnosticData?.notice && (
                <div className="pt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {diagnosticData.notice}
                </div>
              )}
            </div>

            {/* Dynamic Analytics 2-Column Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              
              {/* Tile 1: Account Target Priority Goal or Action Required */}
              {accountFocusSubject && prioritySubjectItem ? (
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border-2 border-primary/30 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-primary" /> Account Priority Goal
                      </span>
                      <span className="text-xs font-black font-mono text-primary">{prioritySubjectItem.mastery}% Mastery</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{prioritySubjectItem.subject}</h3>
                        <Badge variant="outline" className="text-[9px] font-bold border-primary/30 text-primary uppercase shrink-0">
                          Active Goal
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Configured in Account Settings Goals ({dailyQuota} Qs/day quota).
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Progress value={prioritySubjectItem.mastery} className="h-2 bg-secondary" />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => onNavigateToStudy?.(prioritySubjectItem.subject)}
                        className="flex-1 text-xs font-bold h-8 sm:h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        Study {prioritySubjectItem.subject.split(' ')[0]} <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                      {onOpenGoalSettings && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onOpenGoalSettings}
                          title="Change Priority Subject in Account Settings Goals"
                          className="h-8 sm:h-9 px-2.5 rounded-xl border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border-2 border-amber-500/40 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Action Required • Goal Setup
                      </span>
                      <Badge variant="outline" className="text-[9px] font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 uppercase">
                        Default: None
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">No Priority Focus Subject Set</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Configure a target discipline in Account Settings Goals to unlock prioritized study roadmap recommendations.
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      size="sm"
                      onClick={onOpenGoalSettings}
                      className="w-full text-xs font-bold h-8 sm:h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Configure Priority Goal <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Tile 2: AI Strongest Performance Anchor */}
              {analysis?.topStrength ? (
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> AI Performance Anchor
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {analysis.topStrength.mastery}% Mastery
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{analysis.topStrength.subject}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {analysis.topStrength.commentary}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Progress value={analysis.topStrength.mastery} className="h-2 bg-secondary" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateToQuest?.(analysis.topStrength.subject)}
                      className="w-full text-xs font-bold h-8 sm:h-9 border-border hover:bg-muted text-foreground rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Sword className="w-3.5 h-3.5 text-primary" />
                      Quest Arena Drills <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : hasRecordedMastery ? (
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Performance Anchor
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">{strongest.mastery}% Mastery</span>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{strongest.subject}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Highest proficiency anchor driving your total point standing and baseline score.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Progress value={strongest.mastery} className="h-2 bg-secondary" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateToQuest?.(strongest.subject)}
                      className="w-full text-xs font-bold h-8 sm:h-9 border-border hover:bg-muted text-foreground rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Quest Arena <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-primary" /> Initial Baseline Setup
                      </span>
                      <span className="text-xs font-bold text-muted-foreground font-mono">0% Recorded</span>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground">Diagnostic Baseline Pending</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Complete your first study module or chapter quest in Quest Arena to activate your discipline anchor.
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateToQuest?.()}
                      className="w-full text-xs font-bold h-8 sm:h-9 border-border hover:bg-muted text-foreground rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Explore Quests <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

            </div>

            {/* Licensure Coaching Tip Banner */}
            {analysis?.coachingTip && (
              <div className="p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary block">
                    High-Yield Licensure Coaching Tip
                  </span>
                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {analysis.coachingTip}
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic Remediation Action Plan List */}
            <div className="space-y-3 pt-2 border-t border-border/80">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" /> Recommended Remediation Action Steps
                </h3>
                <span className="text-[10px] text-muted-foreground font-medium hidden xs:inline">
                  {diagnosticData?.cached ? 'Cached Diagnostic Plan' : 'AI-Optimized Remediation'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysis?.remediationPlan && analysis.remediationPlan.length > 0 ? (
                  analysis.remediationPlan.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border transition-all flex flex-col justify-between space-y-2.5 group/step shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            Step {item.step || idx + 1}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {item.priority}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground leading-tight group-hover/step:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground truncate max-w-[120px]">
                          Target: <strong className="text-foreground">{item.targetSubject}</strong>
                        </span>
                        <button
                          onClick={() => handleActionClick(item)}
                          className="font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        >
                          {item.actionText} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback 3 heuristic steps if analysis has not loaded
                  [
                    accountFocusSubject
                      ? {
                          title: `Prioritized Goal: ${accountFocusSubject}`,
                          description: `Configured in Account Settings (${dailyQuota} Qs/day quota). Complete curriculum modules to achieve mastery.`,
                          priority: 'ACCOUNT GOAL',
                          targetSubject: accountFocusSubject,
                          actionText: `Study ${accountFocusSubject.split(' ')[0]}`,
                          actionType: 'study' as const,
                          step: 1
                        }
                      : {
                          title: 'Set Priority Focus Subject',
                          description: 'No focus subject selected in Account Settings Goals. Configure a target subject to align your diagnostic path.',
                          priority: 'HIGH PRIORITY',
                          targetSubject: 'Account Goals',
                          actionText: 'Configure Goals',
                          actionType: 'goals' as const,
                          step: 1
                        },
                    {
                      title: hasRecordedMastery ? `Mastery Anchor: ${strongest.subject}` : 'Diagnostic Baseline',
                      description: hasRecordedMastery
                        ? `Maintain peak accuracy (${strongest.mastery}%) by tackling advanced difficulty questions in Quest Arena.`
                        : 'Complete your first study module or chapter quest in Quest Arena to activate your discipline anchor.',
                      priority: 'MEDIUM PRIORITY',
                      targetSubject: hasRecordedMastery ? strongest.subject : 'Quest Arena',
                      actionText: 'Quest Arena',
                      actionType: 'quest' as const,
                      step: 2
                    },
                    {
                      title: `Daily Target: ${dailyQuota} Questions/Day`,
                      description: 'Daily question quota set in Account Settings. Complete daily quests to maintain streak momentum.',
                      priority: 'LOW PRIORITY',
                      targetSubject: accountFocusSubject || 'Account Goals',
                      actionText: 'Adjust Goals',
                      actionType: 'goals' as const,
                      step: 3
                    }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border transition-all flex flex-col justify-between space-y-2 group/step shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            Step {idx + 1}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {item.priority}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground leading-tight group-hover/step:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Target: <strong className="text-foreground">{item.targetSubject}</strong></span>
                        <button
                          onClick={() => handleActionClick(item as any)}
                          className="font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {item.actionText} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </Card>
  );
}
