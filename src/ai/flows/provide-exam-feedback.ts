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
import clientPromise from '@/lib/mongodb-client';
import {ObjectId} from 'mongodb';

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

const inFlightExplanations = new Map<string, Promise<ProvideExamFeedbackOutput>>();

export async function provideExamFeedback(
  input: ProvideExamFeedbackInput
): Promise<ProvideExamFeedbackOutput> {
  const rawId = input.questionId ? input.questionId.split('_cycle_')[0].trim() : '';
  const cleanQuestionId = /^[0-9a-fA-F]{24}$/.test(rawId) ? rawId : undefined;
  const normalizedInput: ProvideExamFeedbackInput = {
    ...input,
    questionId: cleanQuestionId,
  };

  const cacheKey = (input.userAnswer || 'default').trim().toLowerCase();
  const inFlightKey = `${cleanQuestionId || input.question}:::${cacheKey}`;

  const existingInFlight = inFlightExplanations.get(inFlightKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const promise = provideExamFeedbackFlow(normalizedInput);
  inFlightExplanations.set(inFlightKey, promise);

  try {
    return await promise;
  } finally {
    inFlightExplanations.delete(inFlightKey);
  }
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

      // 1. If the Admin already set a feedback in the Question document in MongoDB,
      // return it immediately so zero AI tokens are consumed!
      if (input.questionId) {
        try {
          const client = await clientPromise;
          const db = client.db('boardquest');
          const idQuery = ObjectId.isValid(input.questionId) ? { _id: new ObjectId(input.questionId) } : { _id: input.questionId };
          const qDoc = await db.collection('Question').findOne(
            idQuery as any,
            { projection: { feedback: 1 } }
          );
          if (typeof qDoc?.feedback === 'string' && qDoc.feedback.trim().length > 0) {
            return { explanation: qDoc.feedback.trim() };
          }
        } catch {}

        // 2. Check if explanation already exists in QuestionExplanation cache
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

const ExtractClinicalClueInputSchema = z.object({
  questionId: z.string().optional().describe('The ID of the question in the database.'),
  question: z.string().describe('The clinical case study or HOTS question text.'),
  options: z.array(z.string()).optional().describe('Available answer choices.'),
  correctAnswer: z.string().describe('The correct answer choice or text.'),
  feedback: z.string().optional().describe('Optional faculty rationale or explanation.'),
});
export type ExtractClinicalClueInput = z.infer<typeof ExtractClinicalClueInputSchema>;

const ExtractClinicalClueOutputSchema = z.object({
  clinicalClue: z
    .string()
    .describe(
      'The exact, verbatim multi-word clinical finding, abnormal lab value cluster, or pathognomonic clue copied directly from the question text.'
    ),
});
export type ExtractClinicalClueOutput = z.infer<typeof ExtractClinicalClueOutputSchema>;

const inFlightClues = new Map<string, Promise<ExtractClinicalClueOutput>>();

const extractClinicalCluePrompt = ai.definePrompt({
  name: 'extractClinicalCluePrompt',
  input: {schema: ExtractClinicalClueInputSchema},
  output: {schema: ExtractClinicalClueOutputSchema},
  prompt: `You are an expert Medical Technology board exam mentor operating the 100x Immersion Oil microscope focus.

Question: {{{question}}}
{{#if options}}
Choices:
{{#each options}}
- {{{this}}}
{{/each}}
{{/if}}
Correct Answer: {{{correctAnswer}}}
{{#if feedback}}
Faculty Rationale: {{{feedback}}}
{{/if}}

TASK:
Extract the SINGLE most decisive clinical clue phrase, abnormal laboratory value cluster, or pathognomonic finding from the Question that leads to the Correct Answer.

STRICT RULES:
1. The returned "clinicalClue" MUST be an EXACT, character-for-character verbatim substring of the Question text above.
2. It MUST be a meaningful clinical phrase (typically 3 to 16 words, such as "serum Blood Urea Nitrogen (BUN) of 84 mg/dL and a serum Creatinine of 1.8 mg/dL" or "elevated BUN with a normal serum creatinine and a BUN/Creatinine ratio > 20:1" or "intracellular Gram-negative diplococci").
3. NEVER return a single isolated word.
4. NEVER include generic question stems like "Which of the following", "What is the most likely diagnosis", or "A 62-year-old male presents with". Focus strictly on the laboratory result, morphology, QC rule pattern, or pathognomonic clinical finding.`,
});

export async function extractClinicalClueWithAI(
  input: ExtractClinicalClueInput
): Promise<ExtractClinicalClueOutput> {
  const rawId = input.questionId ? input.questionId.split('_cycle_')[0].trim() : '';
  const cleanQuestionId = /^[0-9a-fA-F]{24}$/.test(rawId) ? rawId : undefined;
  const inFlightKey = cleanQuestionId || input.question.trim();

  const existing = inFlightClues.get(inFlightKey);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<ExtractClinicalClueOutput> => {
    try {
      const qText = (input.question || '').trim();
      if (!qText) return {clinicalClue: ''};

      // 1. Check MongoDB Question.clinicalClue or QuestionExplanation cache first
      if (cleanQuestionId) {
        try {
          const client = await clientPromise;
          const db = client.db('boardquest');
          const qDoc = await db.collection('Question').findOne(
            {_id: new ObjectId(cleanQuestionId)},
            {projection: {clinicalClue: 1}}
          );
          if (typeof qDoc?.clinicalClue === 'string' && qDoc.clinicalClue.trim().length >= 6) {
            const idx = qText.toLowerCase().indexOf(qDoc.clinicalClue.trim().toLowerCase());
            if (idx !== -1) {
              return {clinicalClue: qText.slice(idx, idx + qDoc.clinicalClue.trim().length)};
            }
          }

          const existingExp = await prisma.questionExplanation.findUnique({
            where: {questionId: cleanQuestionId},
          });
          if (existingExp) {
            try {
              const parsed = JSON.parse(existingExp.explanation);
              const cachedClue = parsed?.['__clinical_clue__'];
              if (typeof cachedClue === 'string' && cachedClue.trim().length >= 6) {
                const idx = qText.toLowerCase().indexOf(cachedClue.trim().toLowerCase());
                if (idx !== -1) {
                  return {clinicalClue: qText.slice(idx, idx + cachedClue.trim().length)};
                }
              }
            } catch {}
          }
        } catch {}
      }

      // 2. Extract via Gemini AI
      const {output} = await extractClinicalCluePrompt({
        ...input,
        questionId: cleanQuestionId,
      });

      const rawClue = (output?.clinicalClue || '')
        .replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '')
        .replace(/[.?]+$/, '')
        .trim();

      if (!rawClue || rawClue.length < 6) {
        return {clinicalClue: ''};
      }

      const matchIdx = qText.toLowerCase().indexOf(rawClue.toLowerCase());
      if (matchIdx === -1) {
        return {clinicalClue: ''};
      }

      const verifiedClue = qText.slice(matchIdx, matchIdx + rawClue.length);

      // 3. Persist verified clue to MongoDB Question document & QuestionExplanation cache for 0ms future loads
      if (cleanQuestionId && verifiedClue) {
        try {
          const client = await clientPromise;
          const db = client.db('boardquest');
          await db.collection('Question').updateOne(
            {_id: new ObjectId(cleanQuestionId)},
            {$set: {clinicalClue: verifiedClue}}
          );

          const existingExp = await prisma.questionExplanation.findUnique({
            where: {questionId: cleanQuestionId},
          });
          let cacheMap: Record<string, string> = {};
          if (existingExp) {
            try {
              const parsed = JSON.parse(existingExp.explanation);
              if (parsed && typeof parsed === 'object') {
                cacheMap = parsed;
              }
            } catch {}
          }
          cacheMap['__clinical_clue__'] = verifiedClue;
          await prisma.questionExplanation.upsert({
            where: {questionId: cleanQuestionId},
            create: {
              questionId: cleanQuestionId,
              explanation: JSON.stringify(cacheMap),
            },
            update: {
              explanation: JSON.stringify(cacheMap),
            },
          });
        } catch {}
      }

      return {clinicalClue: verifiedClue};
    } catch {
      return {clinicalClue: ''};
    }
  })();

  inFlightClues.set(inFlightKey, promise);
  try {
    return await promise;
  } finally {
    inFlightClues.delete(inFlightKey);
  }
}
