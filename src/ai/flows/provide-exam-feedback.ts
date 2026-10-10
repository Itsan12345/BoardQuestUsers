'use server';
/**
 * @fileOverview Provides detailed, AI-generated explanations for mock exam questions.
 *
 * - provideExamFeedback - A function that generates AI feedback for a given exam question.
 * - ProvideExamFeedbackInput - The input type for the provideExamFeedback function.
 * - ProvideExamFeedbackOutput - The return type for the provideExamFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

import {prisma} from '@/lib/prisma';

const ProvideExamFeedbackInputSchema = z.object({
  questionId: z.string().optional().describe('The ID of the question in the database.'),
  question: z.string().describe('The mock exam question text.'),
  options: z.array(z.string()).optional().describe('The formatted choices available with letters, e.g. ["A. Synergism", "B. Satellitism", ...].'),
  correctAnswer: z.string().describe('The correct answer to the question (letter and text, e.g. "B. Satellitism").'),
  userAnswer: z
    .string()
    .describe('The answer chosen by the student (letter and text, e.g. "C. Commensalism").'),
});
export type ProvideExamFeedbackInput = z.infer<
  typeof ProvideExamFeedbackInputSchema
>;

const ProvideExamFeedbackOutputSchema = z.object({
  explanation: z
    .string()
    .describe(
      'A detailed explanation clarifying why the correct answer is right and why the user\'s chosen answer was wrong.'
    ),
});
export type ProvideExamFeedbackOutput = z.infer<
  typeof ProvideExamFeedbackOutputSchema
>;

export async function provideExamFeedback(
  input: ProvideExamFeedbackInput
): Promise<ProvideExamFeedbackOutput> {
  return provideExamFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideExamFeedbackPrompt',
  input: {schema: ProvideExamFeedbackInputSchema},
  output: {schema: ProvideExamFeedbackOutputSchema},
  prompt: `You are an expert Medical Technology instructor providing focused, accurate feedback for a licensure board exam practice question.

Question: {{{question}}}

{{#if options}}
Available Choices:
{{#each options}}
- {{{this}}}
{{/each}}
{{/if}}

Correct Answer: {{{correctAnswer}}}
Student's Chosen Answer: {{{userAnswer}}}

CRITICAL INSTRUCTIONS:
1. Explain clearly why {{{correctAnswer}}} is the correct answer based on Medical Technology / Clinical Laboratory science.
2. If the student's chosen answer ({{{userAnswer}}}) is different from the correct answer, specifically explain why {{{userAnswer}}} is incorrect for this question. Do NOT confuse or swap {{{userAnswer}}} with any other choice. Refer to it strictly by its exact option letter and text as provided above.
3. If the student's answer is correct, validate why their reasoning is accurate.
4. Keep the entire explanation concise (strictly 3 to 4 sentences). Do not use conversational filler, greetings, or sign-offs.`,
});

const provideExamFeedbackFlow = ai.defineFlow(
  {
    name: 'provideExamFeedbackFlow',
    inputSchema: ProvideExamFeedbackInputSchema,
    outputSchema: ProvideExamFeedbackOutputSchema,
  },
  async input => {
    try {
      const cacheKey = (input.userAnswer || 'default').trim().toLowerCase();

      // 1. Check if explanation already exists in QuestionExplanation cache
      if (input.questionId) {
        const existing = await prisma.questionExplanation.findUnique({
          where: { questionId: input.questionId }
        });
        if (existing) {
          try {
            const parsed = JSON.parse(existing.explanation);
            if (parsed && typeof parsed === 'object' && parsed[cacheKey]) {
              return { explanation: parsed[cacheKey] };
            }
          } catch {
            // Not a JSON cache map (legacy single-string explanation).
            // Do not return mismatched legacy explanations to prevent answer cross-contamination.
          }
        }
      }

      // 2. If not found in cache, generate using AI
      const {output} = await prompt(input);
      
      // 3. Save feedback to DB QuestionExplanation collection if questionId is provided
      if (input.questionId && output?.explanation) {
        try {
          const existing = await prisma.questionExplanation.findUnique({
            where: { questionId: input.questionId }
          });

          let cacheMap: Record<string, string> = {};
          if (existing) {
            try {
              const parsed = JSON.parse(existing.explanation);
              if (parsed && typeof parsed === 'object') {
                cacheMap = parsed;
              }
            } catch {
              // Legacy format will be safely superseded by the new keyed map
            }
          }

          cacheMap[cacheKey] = output.explanation;

          await prisma.questionExplanation.upsert({
            where: { questionId: input.questionId },
            create: { 
              questionId: input.questionId,
              explanation: JSON.stringify(cacheMap) 
            },
            update: {
              explanation: JSON.stringify(cacheMap)
            }
          });
        } catch (dbError) {
          console.error("Failed to save feedback to database:", dbError);
        }
      }

      return output!;
    } catch (e: any) {
      if (e?.status === 'RESOURCE_EXHAUSTED' || e?.code === 429 || (e?.message && e.message.includes('429'))) {
        return {
          explanation: `The AI is currently resting to recharge its magic (Rate Limit Exceeded). Please try again in a few moments.\n\nCorrect Answer: ${input.correctAnswer}\nYour Answer: ${input.userAnswer}`
        };
      }
      throw e;
    }
  }
);
