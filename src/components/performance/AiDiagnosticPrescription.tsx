"use client";

import React from 'react';
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
  ShieldCheck,
  Settings,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SubjectMasteryItem } from './SubjectTechnicalBreakdown';

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
  avgMastery,
  avgCompletion,
  fullMastery,
  nextObjective,
  userSettings,
  onNavigateToStudy,
  onNavigateToQuest,
  onOpenGoalSettings
}: AiDiagnosticPrescriptionProps) {
  // Extract account settings priority focus subject
  const accountFocusSubject = (userSettings?.focusSubject && userSettings.focusSubject !== 'none')
    ? userSettings.focusSubject
    : null;

  const dailyQuota = userSettings?.dailyQuota || 50;

  // Sort subjects by mastery score to determine weakest and strongest dynamically
  const sortedSubjects = [...fullMastery].sort((a, b) => a.mastery - b.mastery);
  
  const weakest = sortedSubjects[0] || { subject: "Clinical Chemistry", mastery: 0 };
  const strongest = sortedSubjects[sortedSubjects.length - 1] || { subject: "Clinical Chemistry", mastery: 0 };

  const prioritySubjectItem = accountFocusSubject
    ? fullMastery.find(m => m.subject.toLowerCase() === accountFocusSubject.toLowerCase()) || { subject: accountFocusSubject, mastery: 0 }
    : null;

  const hasRecordedMastery = fullMastery.some(m => m.mastery > 0 || m.completion > 0);

  // Dynamic performance index based strictly on syllabus completion & quiz mastery
  const performanceIndex = Math.round(avgMastery * 0.7 + avgCompletion * 0.3);

  // Status tier determination using system maroon & status colors
  const getStatusBadge = () => {
    if (!accountFocusSubject) {
      return {
        label: "Goal Setup Required",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        icon: SlidersHorizontal
      };
    } else if (performanceIndex >= 85) {
      return {
        label: "Topnotcher Tier",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        icon: ShieldCheck
      };
    } else if (performanceIndex >= 75) {
      return {
        label: "Passing Standard",
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        icon: CheckCircle2
      };
    } else if (performanceIndex >= 60) {
      return {
        label: "Borderline Standing",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        icon: AlertTriangle
      };
    } else {
      return {
        label: "Critical Focus",
        color: "bg-primary/10 text-primary border-primary/30",
        icon: AlertCircle
      };
    }
  };

  const statusBadge = getStatusBadge();

  // Dynamic Prescription Text Generation connected to Account Settings Goals
  const getPrescriptionHeadline = () => {
    if (!accountFocusSubject) {
      return "✨ Prioritized Goal Action Required: You have not configured a priority focus subject in Account Settings. Set a focus subject to align your AI Diagnostic prescription and highlight target modules.";
    } else {
      return `🎯 Account Priority Goal Active: Your focus discipline is set to "${accountFocusSubject}" (${dailyQuota} Qs/day target). The AI Diagnostic Engine is tailoring your study roadmap to conquer this subject.`;
    }
  };

  // Dynamic Remediation Action Plan List
  const remediationItems = [
    accountFocusSubject
      ? {
          title: `Prioritized Goal: ${accountFocusSubject}`,
          description: `Configured as your primary target subject in Account Settings (${dailyQuota} Qs/day quota). Complete curriculum modules to achieve mastery.`,
          priority: 'ACCOUNT GOAL',
          targetSubject: accountFocusSubject,
          actionText: `Study ${accountFocusSubject.split(' ')[0]}`,
          onAction: () => onNavigateToStudy?.(accountFocusSubject)
        }
      : {
          title: "Set Priority Focus Subject",
          description: "No focus subject selected in Account Settings Goals. Configure a target subject to align your diagnostic path.",
          priority: 'HIGH PRIORITY',
          targetSubject: "Account Goals",
          actionText: "Configure Goals",
          onAction: onOpenGoalSettings
        },
    {
      title: hasRecordedMastery ? `Mastery Anchor: ${strongest.subject}` : "Diagnostic Baseline",
      description: hasRecordedMastery
        ? `Maintain peak accuracy (${strongest.mastery}%) by tackling advanced difficulty questions in Quest Arena.`
        : "Complete your first study module or chapter quest in Quest Arena to activate your discipline anchor.",
      priority: 'MEDIUM',
      targetSubject: hasRecordedMastery ? strongest.subject : "Quest Arena",
      actionText: "Quest Arena",
      onAction: () => onNavigateToQuest?.(hasRecordedMastery ? strongest.subject : undefined)
    },
    {
      title: `Daily Target: ${dailyQuota} Questions/Day`,
      description: "Daily question quota set in Account Settings. Complete daily quests to maintain streak momentum.",
      priority: 'LOW',
      targetSubject: accountFocusSubject || "Account Goals",
      actionText: "Adjust Goals",
      onAction: onOpenGoalSettings
    }
  ];

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-2xl sm:rounded-3xl bg-card text-card-foreground p-5 sm:p-7 lg:p-8 relative overflow-hidden group transition-colors">
      
      {/* Background Decorative Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-accent" />

      <div className="relative z-10 space-y-6">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" /> AI Diagnostic Prescription Engine
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">v2.4 • Connected to Account Goals</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-headline tracking-tight text-foreground uppercase">
                AI Diagnostic & Remediation Prescription
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <Badge variant="outline" className={cn("px-3 py-1 text-xs font-bold border flex items-center gap-1.5 rounded-xl shadow-sm uppercase tracking-wider", statusBadge.color)}>
              <statusBadge.icon className="w-3.5 h-3.5" />
              {statusBadge.label}
            </Badge>

            {onOpenGoalSettings && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenGoalSettings}
                className="h-8 rounded-xl text-xs font-bold border-primary/30 hover:bg-primary/10 text-primary flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                Configure Goals
              </Button>
            )}
          </div>
        </div>

        {/* Prescription Overview Card Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-muted/60 dark:bg-muted/40 border border-border space-y-2">
          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-bold text-foreground leading-relaxed">
                {getPrescriptionHeadline()}
              </p>
            </div>
            {accountFocusSubject ? (
              <Badge variant="secondary" className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 shrink-0 self-start">
                🎯 {accountFocusSubject} Focus Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 self-start">
                ⚠️ Goal Setup Required
              </Badge>
            )}
          </div>
        </div>

        {/* Dynamic Analytics 2-Column Summary Grid (Clean 50/50 Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Tile 1: Account Target Priority Goal or Reminder Tile */}
          {accountFocusSubject && prioritySubjectItem ? (
            <div className="p-4 sm:p-5 rounded-xl bg-card border-2 border-primary/30 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
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
                      Goal Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Prioritized focus subject configured in Account Settings Goals ({dailyQuota} Qs/day target).
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <Progress value={prioritySubjectItem.mastery} className="h-2 bg-secondary" />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onNavigateToStudy?.(prioritySubjectItem.subject)}
                    className="flex-1 text-xs font-bold h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Study {prioritySubjectItem.subject.split(' ')[0]} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  {onOpenGoalSettings && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onOpenGoalSettings}
                      title="Change Priority Subject in Account Settings Goals"
                      className="h-9 px-2.5 rounded-lg border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-xl bg-card border-2 border-amber-500/40 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
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
                    You currently have no prioritized subject configured in Account Settings Goals. Set a priority focus subject to align your AI Diagnostic roadmap and highlight target modules.
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={onOpenGoalSettings}
                  className="w-full text-xs font-bold h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Configure Priority Goal <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Tile 2: Strongest Subject Anchor or Initial Baseline Setup */}
          {hasRecordedMastery ? (
            <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
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
                  className="w-full text-xs font-bold h-9 border-border hover:bg-muted text-foreground rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Quest Arena <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
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
                  className="w-full text-xs font-bold h-9 border-border hover:bg-muted text-foreground rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Explore Quests <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Dynamic Remediation Action Plan List */}
        <div className="space-y-3 pt-2 border-t border-border/80">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" /> Recommended Remediation Action Steps
            </h3>
            <span className="text-[10px] text-muted-foreground font-medium">Real-time dynamic prescription</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {remediationItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border transition-all flex flex-col justify-between space-y-2 group/step shadow-sm"
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
                    onClick={item.onAction}
                    className="font-bold text-primary hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    {item.actionText} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Card>
  );
}
