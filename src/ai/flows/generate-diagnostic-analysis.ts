import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const DiagnosticSubjectInputSchema = z.object({
  subject: z.string(),
  mastery: z.number().describe('Subject mastery percentage (0-100)'),
  completion: z.number().describe('Curriculum completion percentage (0-100)'),
  status: z.string().describe('Mastery status e.g. Mastered, Proficient, Needs Review, Not Started'),
});

export const GenerateDiagnosticInputSchema = z.object({
  studentName: z.string().optional().default('Aspirant'),
  avgMastery: z.number().describe('Overall average mastery score'),
  avgCompletion: z.number().describe('Overall average syllabus completion'),
  totalQuestionsAnswered: z.number().optional().default(0),
  focusSubject: z.string().nullable().optional(),
  dailyQuota: z.number().optional().default(50),
  subjects: z.array(DiagnosticSubjectInputSchema),
  weakestTopics: z.array(z.string()).optional().default([]),
});

export type GenerateDiagnosticInput = z.infer<typeof GenerateDiagnosticInputSchema>;

export const RemediationActionStepSchema = z.object({
  step: z.number(),
  title: z.string().describe('Short punchy action title e.g. "Enzymology Flash Drills" or "Urinalysis Microscopic Review"'),
  description: z.string().describe('Actionable 1-2 sentence recommendation specifying target concepts and question sets.'),
  priority: z.string().describe('Priority level: e.g. "HIGH PRIORITY", "ACCOUNT GOAL", "MEDIUM PRIORITY", "MASTERY ANCHOR"'),
  targetSubject: z.string().describe('Specific subject discipline or "Account Goals"'),
  actionType: z.enum(['study', 'quest', 'goals']),
  actionText: z.string().describe('Action button text e.g. "Study Chemistry", "Quest Arena", "Configure Goals"'),
});

export const GenerateDiagnosticOutputSchema = z.object({
  headline: z.string().describe('1-2 sentence executive summary of the student current licensure exam readiness and immediate focus.'),
  readinessStatus: z.enum(['TOPNOTCHER_TRACK', 'PASSING_STANDARD', 'BORDERLINE', 'CRITICAL_FOCUS', 'BASELINE_PENDING']),
  readinessLabel: z.string().describe('Visual status badge label: Top Performer, Exam Ready, Almost Ready, Needs Work, or Getting Started'),
  readinessScore: z.number().describe('Estimated board exam readiness index from 0 to 100.'),
  executiveSummary: z.string().describe('2-3 sentences of expert diagnostic guidance analyzing academic strengths, blind spots, and exam trajectory.'),
  topStrength: z.object({
    subject: z.string(),
    mastery: z.number(),
    commentary: z.string().describe('1 sentence explaining why this discipline is their strongest performance anchor.'),
  }),
  criticalWeakness: z.object({
    subject: z.string(),
    mastery: z.number(),
    commentary: z.string().describe('1 sentence pinpointing vulnerability and why immediate review is critical.'),
  }),
  remediationPlan: z.array(RemediationActionStepSchema).describe('Exactly 3 prioritized, structured remediation action steps.'),
  coachingTip: z.string().describe('1-2 sentence high-yield Medical Technology licensure board tip (mnemonics, pacing, or retention strategy).'),
});

export type GenerateDiagnosticOutput = z.infer<typeof GenerateDiagnosticOutputSchema>;

const diagnosticPrompt = ai.definePrompt({
  name: 'generateDiagnosticAnalysisPrompt',
  input: { schema: GenerateDiagnosticInputSchema },
  output: { schema: GenerateDiagnosticOutputSchema },
  prompt: `You are the Lead Medical Technology Licensure Board Examination Coach and AI Diagnostic Director for BoardQuest (Philippine MTLE / MLS syllabus).

Analyze this student's real academic performance metrics across the 6 licensure disciplines:
- Clinical Chemistry
- Microbiology
- Hematology
- Immunology & Serology and Immunohematology
- Clinical Microscopy & Parasitology
- Histopathology and Medtech Laws

Student Academic Profile:
• Student Name: {{studentName}}
• Overall Average Mastery: {{avgMastery}}%
• Overall Syllabus Completion: {{avgCompletion}}%
• Total Questions Answered: {{totalQuestionsAnswered}}
• Configured Account Focus Subject: {{focusSubject}} (Daily Quota: {{dailyQuota}} questions/day)

Individual Discipline Standings:
{{#each subjects}}
- {{subject}}: {{mastery}}% mastery, {{completion}}% completion (Status: {{status}})
{{/each}}
{{#if weakestTopics}}
Weak Topics Recorded in System:
{{#each weakestTopics}}
- {{this}}
{{/each}}
{{/if}}

EXPERT DIAGNOSTIC GUIDELINES:
1. Standards: In Philippine MTLE, general weighted average must reach at least 75%, with no grade below 50% in any major discipline.
2. If totalQuestionsAnswered is 0 or syllabus completion is under 5%, classify readinessStatus as "BASELINE_PENDING" (readinessLabel: "Getting Started", score: 0-25) and guide them on initiating their first chapter quest.
3. If performance index (mastery * 0.7 + completion * 0.3) is >= 85%, classify as "TOPNOTCHER_TRACK" (readinessLabel: "Top Performer").
4. If performance index is >= 75%, classify as "PASSING_STANDARD" (readinessLabel: "Exam Ready").
5. If performance index is >= 60%, classify as "BORDERLINE" (readinessLabel: "Almost Ready").
6. Otherwise, classify as "CRITICAL_FOCUS" (readinessLabel: "Needs Work").
7. If focusSubject is configured, ensure it is highlighted in the remediation plan (Step 1 or Step 2) with priority "ACCOUNT GOAL".
8. Return exactly 3 remediation steps in remediationPlan. Assign actionType to one of: 'study', 'quest', 'goals'.
9. Ensure all output is professional, inspiring, authoritative, and medically accurate. Avoid filler words.`,
});

export const generateDiagnosticAnalysisFlow = ai.defineFlow(
  {
    name: 'generateDiagnosticAnalysisFlow',
    inputSchema: GenerateDiagnosticInputSchema,
    outputSchema: GenerateDiagnosticOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await diagnosticPrompt(input);
      if (!output) {
        throw new Error('AI Diagnostic prompt returned empty output');
      }
      return output;
    } catch (err: any) {
      console.error('Error in generateDiagnosticAnalysisFlow:', err);
      throw err;
    }
  }
);
