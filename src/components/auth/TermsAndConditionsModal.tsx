"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export type TermsTab = "terms" | "aup" | "privacy";

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  defaultTab?: TermsTab;
}

export function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
  defaultTab = "terms",
}: TermsAndConditionsModalProps) {
  const [activeTab, setActiveTab] = useState<TermsTab>(defaultTab);

  // Sync tab if defaultTab changes when opened
  React.useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const handleAgreeAndProceed = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[90vh] max-h-[820px] p-0 flex flex-col gap-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
        {/* Header Section */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/80 bg-gradient-to-b from-muted/60 to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle
              className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground"
              style={{ fontFamily: "'Inter-bold', sans-serif" }}
            >
              Terms & Conditions
            </DialogTitle>
            <DialogDescription className="sr-only">
              Review BoardQuest Terms of Service, Acceptable Use Policy, and Privacy Notice.
            </DialogDescription>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as TermsTab)}
            className="w-full mt-4"
          >
            <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/80 rounded-xl gap-1">
              <TabsTrigger
                value="terms"
                className="text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:text-[#851315] dark:data-[state=active]:text-[#dc2626] data-[state=active]:shadow-sm rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </TabsTrigger>
              <TabsTrigger
                value="aup"
                className="text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:text-[#851315] dark:data-[state=active]:text-[#dc2626] data-[state=active]:shadow-sm rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acceptable Use</span>
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:text-[#851315] dark:data-[state=active]:text-[#dc2626] data-[state=active]:shadow-sm rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Privacy Notice</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Body - Scrollable */}
        <ScrollArea className="flex-1 px-6 sm:px-8 py-5">
          {/* TAB 1: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div className="space-y-6 text-sm text-foreground animate-in fade-in-0 duration-200">
              {/* Executive Summary Card */}
              <div className="rounded-2xl border border-[#851315]/20 bg-[#851315]/5 dark:bg-[#851315]/10 p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#851315] dark:text-[#dc2626] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#851315] dark:text-[#dc2626]">
                      Aspirant Agreement Summary
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                      BoardQuest is an institutional licensure review ecosystem dedicated to Southwestern University PHINMA Medical Technology examinees. By enrolling as an Aspirant, you agree to uphold academic honor, protect proprietary review questions, and utilize the AI tutor strictly for personal board preparation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center">1</span>
                  Academic Purpose & Eligibility
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-normal">
                  The BoardQuest platform is engineered to assist graduating medical technology interns and alumni preparing for the Philippine Medical Technologist Licensure Examination (MTLE). Account access is strictly personalized, non-transferable, and tied to verified institutional enrollment or affiliated review program rosters.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center">2</span>
                  Dual Testing Pathways & Diagnostic Tracking
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-normal">
                  Examinees participate in two distinct evaluation settings: <strong className="text-foreground">Learning Mode</strong> (providing immediate pedagogical explanations generated by the AI reasoning engine) and <strong className="text-foreground">Test Mode</strong> (simulating timed board examinations with scores withheld until module submission). All scores populate diagnostic radar charts and compute the official Board Readiness Index based on regulatory standards (75% General Weighted Average, with no discipline below 50%).
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center">3</span>
                  Intellectual Property & Content Protection
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-normal">
                  All review questions, clinical case studies, laboratory micrographs, answer rationales, and gamified mechanics are confidential intellectual property of Southwestern University PHINMA and the BoardQuest development team. Users are strictly prohibited from copying, distributing, scraping, or publishing test items to external public forums.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center">4</span>
                  Licensure Disclaimer
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-normal">
                  While the BoardQuest Board Readiness Index and diagnostic radar metrics provide empirical evaluations of subject mastery across the six laboratory science disciplines, the platform does not guarantee passing results on the official PRC Medical Technologist Licensure Examination.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ACCEPTABLE USE POLICY (AUP) */}
          {activeTab === "aup" && (
            <div className="space-y-6 text-sm text-foreground animate-in fade-in-0 duration-200">
              {/* CIA Triad Integrity Highlight */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Explicit CIA Triad Mapping — System Integrity (AUP Section IV)
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                      Strict prohibition of third-party automation, bots, or score tampering ensures that your Experience Points (XP), daily streaks, and Board Readiness Index reflect genuine clinical mastery, giving faculty mentors accurate diagnostic data for academic coaching.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prohibited Uses */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Prohibited Activities
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="p-3 rounded-xl bg-muted/60 border border-border/80">
                    <p className="text-xs font-bold text-foreground">Workflow & Data Integrity Violations</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Using automated scripts, bots, web crawlers, or exploits to manipulate daily streaks, alter quiz answers, or artificially inflate XP on cohort leaderboards.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/60 border border-border/80">
                    <p className="text-xs font-bold text-foreground">Confidentiality Violations & Data Scraping</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Extracting, downloading, reverse-engineering, or sharing BoardQuest AI-generated clinical questions, answer keys, or platform source code.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/60 border border-border/80">
                    <p className="text-xs font-bold text-foreground">Credential Sharing & Device Security</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Sharing personal login tokens or passwords; failing to maintain session hygiene and screen locks on unattended devices; installing unauthorized extensions or cheats.
                    </p>
                  </div>
                </div>
              </div>

              {/* Disciplinary Matrix Table */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
                  Disciplinary Consequences Matrix
                </h3>
                <div className="border border-border rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-3 bg-muted font-bold text-muted-foreground p-2.5 border-b border-border text-[11px] uppercase tracking-wider">
                    <span>Severity</span>
                    <span>Disciplinary Action</span>
                    <span>Authority</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-b border-border/60 items-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">Minor</span>
                    <span className="text-muted-foreground text-[11px]">Verbal warning, forced logout, password reset</span>
                    <span className="text-muted-foreground text-[11px]">System Administrator</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-b border-border/60 items-center">
                    <span className="font-bold text-amber-600 dark:text-amber-400">Moderate</span>
                    <span className="text-muted-foreground text-[11px]">Formal written warning, temporary suspension</span>
                    <span className="text-muted-foreground text-[11px]">Department Head</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 items-center bg-red-500/5">
                    <span className="font-bold text-red-600 dark:text-red-400">Severe</span>
                    <span className="text-muted-foreground text-[11px]">Permanent account revocation, score invalidation, disciplinary referral</span>
                    <span className="text-muted-foreground text-[11px]">University Disciplinary Board</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY NOTICE (RA 10173) */}
          {activeTab === "privacy" && (
            <div className="space-y-6 text-sm text-foreground animate-in fade-in-0 duration-200">
              {/* RA 10173 Banner */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Philippine Data Privacy Act of 2012 (Republic Act No. 10173)
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                      Southwestern University PHINMA upholds the statutory privacy rights of examinees under RA 10173. Data processing adheres strictly to the core principles of transparency, legitimate educational purpose, and proportionality.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Items Collected */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
                  Information Collected & Purpose
                </h3>
                <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-5">
                  <li><strong className="text-foreground">Student Identity:</strong> Full Name and Institutional Email address used exclusively for account authentication and digital scorecards.</li>
                  <li><strong className="text-foreground">Examination Data:</strong> Quiz responses, time spent per item, and pre/post test metrics used to compute your personalized diagnostic radar charts.</li>
                  <li><strong className="text-foreground">Cryptographic Security:</strong> Passwords are protected using irreversible Argon2 hashing. Plaintext credentials are never accessible or stored.</li>
                  <li><strong className="text-foreground">Third-Party Processing:</strong> Only non-identifiable test prompts are routed to the Google Gemini API for case formulation; laboratory micrographs are served securely via Supabase Storage.</li>
                </ul>
              </div>

              {/* Data Retention & Rights */}
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
                  Data Retention & Statutory Rights
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-normal">
                  In compliance with institutional research guidelines, student test records and readiness metrics are retained for five (5) years following graduation for longitudinal curriculum evaluation. You hold the statutory right to be informed, request access, correct inaccurate records, and object to improper processing by contacting the Southwestern University PHINMA Data Protection Office at <code className="text-[#851315] dark:text-[#dc2626] font-mono text-[11px] font-bold">dpo.swu@phinmaed.com</code>.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <DialogFooter className="px-6 sm:px-8 py-4 border-t border-border bg-muted/30 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="text-[11px] text-muted-foreground font-medium text-center sm:text-left">
            Reviewing document: <span className="font-bold text-foreground">{activeTab.toUpperCase()} Clause</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-initial h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Close
            </Button>
            {onAccept && (
              <Button
                type="button"
                onClick={handleAgreeAndProceed}
                className="flex-1 sm:flex-initial h-10 px-5 bg-[#851315] hover:bg-[#720e10] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-950/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>I Understand & Agree</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
