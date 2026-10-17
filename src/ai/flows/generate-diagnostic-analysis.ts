import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const DiagnosticSubjectInputSchema = z.object({
  subject: z.string(),
  mastery: z.number(),
  completion: z.number(),
  status: z.string(),
});

export const DiagnosticTopicInputSchema = z.object({
  topic: z.string(),
  subject: z.string(),
  accuracy: z.number(),
  totalAttempts: z.number(),
  status: z.string(),
});

export const GenerateDiagnosticInputSchema = z.object({
  studentName: z.string().optional().default('Aspirant'),
  avgMastery: z.number(),
  avgCompletion: z.number(),
  totalQuestionsAnswered: z.number().optional().default(0),
  focusSubject: z.string().nullable().optional(),
  dailyQuota: z.number().optional().default(50),
  subjects: z.array(DiagnosticSubjectInputSchema),
  weakestTopics: z.array(DiagnosticTopicInputSchema).optional().default([]),
  strongestTopics: z.array(DiagnosticTopicInputSchema).optional().default([]),
});

export type GenerateDiagnosticInput = z.infer<typeof GenerateDiagnosticInputSchema>;

export const RemediationActionStepSchema = z.object({
  step: z.number(),
  title: z.string().describe('Short punchy title (max 5 words)'),
  description: z.string().describe('Actionable 1-2 sentence recommendation'),
  priority: z.string().describe('HIGH PRIORITY, ACCOUNT GOAL, or MEDIUM PRIORITY'),
  targetSubject: z.string().describe('Target subject discipline or Account Goals'),
  targetTopic: z.string().optional().describe('Specific weak topic if applicable'),
  actionType: z.enum(['study', 'quest', 'goals']),
  actionText: z.string().describe('Button text e.g. Study, Quest Arena, Drill Topic'),
});

export const TopicDiagnosticItemSchema = z.object({
  topic: z.string(),
  subject: z.string(),
  accuracy: z.number(),
  totalAttempts: z.number(),
  status: z.enum(['Needs Review', 'Proficient', 'Mastered', 'Unattempted']),
  diagnosticNote: z.string().describe('1 concise sentence (max 15 words) explaining focus or strength'),
});

export const TopicMasteryAnalysisSchema = z.object({
  priorityWeakTopics: z.array(TopicDiagnosticItemSchema).describe('Up to 3 high-yield weak topics'),
  masteredAnchorTopics: z.array(TopicDiagnosticItemSchema).describe('Up to 2 demonstrated strong topics'),
  overallTopicReadinessSummary: z.string().describe('1 concise sentence synthesizing topic readiness'),
});

export const GenerateDiagnosticOutputSchema = z.object({
  headline: z.string().describe('1 concise sentence summary of readiness and immediate focus'),
  readinessStatus: z.enum(['TOPNOTCHER_TRACK', 'PASSING_STANDARD', 'BORDERLINE', 'CRITICAL_FOCUS', 'BASELINE_PENDING']),
  readinessLabel: z.string().describe('Top Performer, Exam Ready, Almost Ready, Needs Work, or Getting Started'),
  readinessScore: z.number().describe('Readiness index 0-100'),
  executiveSummary: z.string().describe('1-2 concise sentences analyzing academic strengths and blind spots'),
  topStrength: z.object({
    subject: z.string(),
    mastery: z.number(),
    commentary: z.string().describe('1 concise sentence explaining strength anchor'),
  }),
  criticalWeakness: z.object({
    subject: z.string(),
    mastery: z.number(),
    commentary: z.string().describe('1 concise sentence explaining priority weakness'),
  }),
  topicMasteryAnalysis: TopicMasteryAnalysisSchema.optional(),
  remediationPlan: z.array(RemediationActionStepSchema).describe('Exactly 3 prioritized remediation steps'),
  coachingTip: z.string().describe('1 concise high-yield board tip (max 20 words)'),
});

export type GenerateDiagnosticOutput = z.infer<typeof GenerateDiagnosticOutputSchema>;

const diagnosticPrompt = ai.definePrompt({
  name: 'generateDiagnosticAnalysisPrompt',
  input: { schema: GenerateDiagnosticInputSchema },
  output: { schema: GenerateDiagnosticOutputSchema },
  prompt: `You are the Lead MTLE Board Exam Diagnostic Coach for BoardQuest.

Student Performance:
• Name: {{studentName}}
• Mastery: {{avgMastery}}% | Completion: {{avgCompletion}}% | Qs: {{totalQuestionsAnswered}}
• Focus Goal: {{focusSubject}} ({{dailyQuota}} Qs/day)

Disciplines:
{{#each subjects}}
- {{subject}}: {{mastery}}% ({{status}})
{{/each}}
{{#if weakestTopics}}

Weakest Subtopics:
{{#each weakestTopics}}
- {{topic}} ({{subject}}): {{accuracy}}% acc
{{/each}}
{{/if}}
{{#if strongestTopics}}

Strongest Subtopics:
{{#each strongestTopics}}
- {{topic}} ({{subject}}): {{accuracy}}% acc
{{/each}}
{{/if}}

RULES (STRICT BREVITY REQUIRED - MINIMIZE TOKENS):
1. Standards: Passing is >=75% with no subject <50%.
2. Classify readinessStatus: "TOPNOTCHER_TRACK" (>=85%), "PASSING_STANDARD" (>=75%), "BORDERLINE" (>=60%), "CRITICAL_FOCUS" (<60%), or "BASELINE_PENDING" (if total Qs < 5).
3. If focusSubject is configured, feature it in Step 1 with priority "ACCOUNT GOAL".
4. topicMasteryAnalysis:
   - priorityWeakTopics: up to 3 weak topics, each with 1 concise sentence (max 15 words).
   - masteredAnchorTopics: up to 2 strong topics, each with 1 concise sentence (max 15 words).
   - overallTopicReadinessSummary: 1 concise sentence on topic coverage.
5. remediationPlan: Exactly 3 steps. Specify targetTopic on Step 2 if weak topics exist. Keep titles under 5 words, descriptions strictly 1-2 short sentences.
6. coachingTip: 1 short high-yield MTLE mnemonic or strategy (max 20 words).
7. Keep all text crisp and clinical. Zero conversational filler to minimize tokens.`,
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
