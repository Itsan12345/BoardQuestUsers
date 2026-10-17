'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb-client';
import { prisma } from '@/lib/prisma';
import {
  generateDiagnosticAnalysisFlow,
  type GenerateDiagnosticOutput,
} from '@/ai/flows/generate-diagnostic-analysis';
import { getSubjectMetrics, getCategories } from '@/app/actions/study';

export interface AiDiagnosticResponse {
  success: boolean;
  cached: boolean;
  updatedAt: string;
  analysis: GenerateDiagnosticOutput;
  canRegenerate: boolean;
  cooldownSeconds: number;
  cooldownExpiresAt?: string;
  notice?: string;
  error?: string;
}

// Background / automatic cache TTL: 6 hours
// If a user visits within 6 hours, serve cached analysis even if score had slight jitter
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Manual "Regenerate" button cooldown: 15 minutes
// Prevents spamming and ensures safe scaling for 100-1000+ daily users
const MANUAL_REGENERATE_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

const DEFAULT_SUBJECTS = [
  'Clinical Chemistry',
  'Microbiology',
  'Hematology',
  'Immunology & Serology and Immunohematology',
  'Clinical Microscopy & Parasitology',
  'Histopathology and Medtech Laws',
];

export interface AggregatedTopicMasteryItem {
  topic: string;
  subject: string;
  accuracy: number;
  totalAttempts: number;
  status: 'Needs Review' | 'Proficient' | 'Mastered' | 'Unattempted';
  diagnosticNote?: string;
}

/**
 * Intelligent deterministic fallback generator if AI rate limit or network error occurs.
 */
function createDeterministicDiagnosticFallback(
  studentName: string,
  avgMastery: number,
  avgCompletion: number,
  focusSubject: string | null,
  dailyQuota: number,
  subjects: { subject: string; mastery: number; completion: number; status: string }[],
  totalAttempts: number,
  weakestTopics: AggregatedTopicMasteryItem[] = [],
  strongestTopics: AggregatedTopicMasteryItem[] = []
): GenerateDiagnosticOutput {
  const sorted = [...subjects].sort((a, b) => b.mastery - a.mastery);
  const best = sorted[0] || { subject: 'Clinical Chemistry', mastery: 0, completion: 0, status: 'Not Started' };
  const worst = sorted[sorted.length - 1] || { subject: 'Histopathology and Medtech Laws', mastery: 0, completion: 0, status: 'Not Started' };

  const performanceIndex = Math.round(avgMastery * 0.7 + avgCompletion * 0.3);

  let readinessStatus: GenerateDiagnosticOutput['readinessStatus'] = 'BASELINE_PENDING';
  let readinessLabel = 'Getting Started';

  if (totalAttempts === 0 && avgCompletion < 5) {
    readinessStatus = 'BASELINE_PENDING';
    readinessLabel = 'Getting Started';
  } else if (performanceIndex >= 85) {
    readinessStatus = 'TOPNOTCHER_TRACK';
    readinessLabel = 'Top Performer';
  } else if (performanceIndex >= 75) {
    readinessStatus = 'PASSING_STANDARD';
    readinessLabel = 'Exam Ready';
  } else if (performanceIndex >= 60) {
    readinessStatus = 'BORDERLINE';
    readinessLabel = 'Almost Ready';
  } else {
    readinessStatus = 'CRITICAL_FOCUS';
    readinessLabel = 'Needs Work';
  }

  const headline = focusSubject
    ? `Target Discipline: "${focusSubject}" is active with ${dailyQuota} Qs/day quota. Reinforce weaker domains to build licensure velocity.`
    : `Holistic diagnostic baseline active at ${performanceIndex}% readiness index across licensure syllabus disciplines.`;

  const executiveSummary = totalAttempts > 0
    ? `${studentName} demonstrates an anchor proficiency in ${best.subject} (${best.mastery}%). Targeted drills in ${worst.subject} (${worst.mastery}%) will yield the highest margin of passing score improvement.`
    : `Welcome ${studentName}. Complete chapter quests in Quest Arena or practice questions to calibrate your real-time diagnostic prescription.`;

  // Deterministic Topic Mastery Analytics
  const fallbackWeakList: AggregatedTopicMasteryItem[] = weakestTopics.length > 0
    ? weakestTopics
    : [
        { topic: 'Carbohydrate Metabolism', subject: 'Clinical Chemistry', accuracy: 0, totalAttempts: 0, status: 'Unattempted', diagnosticNote: 'Foundational MTLE chemistry domain requiring initial practice calibration.' },
        { topic: 'Bacterial Morphology and Staining', subject: 'Microbiology', accuracy: 0, totalAttempts: 0, status: 'Unattempted', diagnosticNote: 'Core microbiology baseline critical for primary gram identification questions.' },
        { topic: 'RBC Indices and Morphologies', subject: 'Hematology', accuracy: 0, totalAttempts: 0, status: 'Unattempted', diagnosticNote: 'High-yield licensure topic for differential diagnosis of anemia.' },
      ];

  const priorityWeakTopics = fallbackWeakList.slice(0, 3).map((t) => ({
    topic: t.topic,
    subject: t.subject,
    accuracy: t.accuracy,
    totalAttempts: t.totalAttempts,
    status: t.status,
    diagnosticNote: t.diagnosticNote || `Target review recommended: ${t.accuracy}% accuracy across ${t.totalAttempts} question${t.totalAttempts === 1 ? '' : 's'}.`,
  }));

  const masteredAnchorTopics = strongestTopics.slice(0, 3).map((t) => ({
    topic: t.topic,
    subject: t.subject,
    accuracy: t.accuracy,
    totalAttempts: t.totalAttempts,
    status: t.status,
    diagnosticNote: t.diagnosticNote || `Solid performance anchor with ${t.accuracy}% accuracy across ${t.totalAttempts} attempts.`,
  }));

  const overallTopicReadinessSummary = totalAttempts > 0
    ? `${studentName} has active topic diagnostics across ${weakestTopics.length + strongestTopics.length} evaluated topics. Prioritizing low-accuracy subtopics in Quest Arena will rapidly elevate overall discipline mastery.`
    : `Topic analytics calibration pending. Complete questions in Quest Arena or Study Mode to generate real-time topic mastery rankings.`;

  const primaryRemediationTopic = weakestTopics[0];

  const remediationPlan: GenerateDiagnosticOutput['remediationPlan'] = [
    focusSubject
      ? {
          step: 1,
          title: `Account Priority Goal: ${focusSubject}`,
          description: `Configured as primary focus discipline with ${dailyQuota} Qs/day target. Tackle core concept modules first.`,
          priority: 'ACCOUNT GOAL',
          targetSubject: focusSubject,
          actionType: 'study',
          actionText: `Study ${focusSubject.split(' ')[0]}`,
        }
      : {
          step: 1,
          title: 'Configure Priority Focus Discipline',
          description: 'No priority focus subject configured in Account Settings Goals. Set a discipline to align targeted study paths.',
          priority: 'HIGH PRIORITY',
          targetSubject: 'Account Goals',
          actionType: 'goals',
          actionText: 'Configure Goals',
        },
    {
      step: 2,
      title: primaryRemediationTopic
        ? `Remediate Weak Topic: ${primaryRemediationTopic.topic}`
        : (totalAttempts > 0 ? `Weak Domain Drill: ${worst.subject}` : 'Initial Chapter Quest'),
      description: primaryRemediationTopic
        ? `High-yield topic drill in ${primaryRemediationTopic.topic} (${primaryRemediationTopic.subject}) to eliminate conceptual blind spots.`
        : (totalAttempts > 0
          ? `Remediate ${worst.subject} (${worst.mastery}% accuracy) through targeted flash questions in Quest Arena.`
          : 'Embark on your first Quest Arena battle to generate granular chapter diagnostics.'),
      priority: 'HIGH PRIORITY',
      targetSubject: primaryRemediationTopic ? primaryRemediationTopic.subject : (totalAttempts > 0 ? worst.subject : 'Quest Arena'),
      targetTopic: primaryRemediationTopic ? primaryRemediationTopic.topic : undefined,
      actionType: 'quest',
      actionText: primaryRemediationTopic ? `Drill ${primaryRemediationTopic.topic.split(' ')[0]}` : 'Quest Arena',
    },
    {
      step: 3,
      title: `Maintain Anchor: ${best.subject}`,
      description: `Preserve high accuracy (${best.mastery}%) with intermittent mixed review tests.`,
      priority: 'MASTERY ANCHOR',
      targetSubject: best.subject,
      actionType: 'study',
      actionText: `Study ${best.subject.split(' ')[0]}`,
    },
  ];

  return {
    headline,
    readinessStatus,
    readinessLabel,
    readinessScore: Math.min(100, Math.max(5, performanceIndex)),
    executiveSummary,
    topStrength: {
      subject: best.subject,
      mastery: best.mastery,
      commentary: `${best.subject} serves as your highest score stability anchor with ${best.mastery}% mastery.`,
    },
    criticalWeakness: {
      subject: worst.subject,
      mastery: worst.mastery,
      commentary: `${worst.subject} shows prime opportunity for score gains through focused remediation drills.`,
    },
    topicMasteryAnalysis: {
      priorityWeakTopics,
      masteredAnchorTopics,
      overallTopicReadinessSummary,
    },
    remediationPlan,
    coachingTip: 'High-yield MTLE Tip: Practice active recall and formula mnemonics daily; consistency beats cramming every time.',
  };
}

/**
 * Server action to get or generate cached AI Diagnostic Analysis using the AiAnalysis table.
 */
export async function getAiDiagnosticAction(options?: {
  forceRefresh?: boolean;
}): Promise<AiDiagnosticResponse> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return {
        success: false,
        cached: false,
        updatedAt: new Date().toISOString(),
        analysis: createDeterministicDiagnosticFallback('Guest Aspirant', 0, 0, null, 50, [], 0),
        canRegenerate: false,
        cooldownSeconds: 0,
        error: 'Unauthorized: No active user session',
      };
    }

    const forceRefresh = !!options?.forceRefresh;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('boardquest');
    const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    const idQueries = userObjId ? [{ userId: userId }, { userId: userObjId }] : [{ userId: userId }];

    // 1. Fetch user profile, settings, metrics, and attempts in parallel
    const [userDoc, settingsDoc, metrics, categories, userAttempts] = await Promise.all([
      db.collection('User').findOne({ $or: userObjId ? [{ _id: userObjId }, { _id: userId as any }] : [{ _id: userId as any }] }),
      db.collection('UserSettings').findOne({ $or: idQueries }),
      getSubjectMetrics().catch(() => []),
      getCategories().catch(() => []),
      db.collection('UserQuestionAttempt').find({ $or: idQueries }).toArray().catch(() => []),
    ]);

    const activeSubjects = categories && categories.length > 0
      ? categories.map((c: any) => c.name)
      : (metrics && metrics.length > 0 ? metrics.map((m: any) => m.subject) : DEFAULT_SUBJECTS);

    const fullMastery = activeSubjects.map((subjectName: string) => {
      const normTarget = subjectName.trim().toLowerCase();
      const match = metrics.find((m: any) => m.subject?.trim().toLowerCase() === normTarget)
        || metrics.find((m: any) => m.subject && (
          m.subject.toLowerCase().includes(normTarget) || normTarget.includes(m.subject.toLowerCase())
        ));

      const masteryVal = match ? Math.round(match.proficiency || 0) : 0;
      const completionVal = match ? Math.round(match.completion || 0) : 0;

      let status = 'Not Started';
      if (masteryVal >= 80) status = 'Mastered';
      else if (masteryVal >= 60) status = 'Proficient';
      else if (masteryVal > 0 || completionVal > 0) status = 'Needs Review';

      return {
        subject: subjectName,
        mastery: masteryVal,
        completion: completionVal,
        status,
      };
    });

    const avgMastery = fullMastery.length > 0
      ? Math.round(fullMastery.reduce((acc: number, s: any) => acc + s.mastery, 0) / fullMastery.length)
      : 0;

    const avgCompletion = fullMastery.length > 0
      ? Math.round(fullMastery.reduce((acc: number, s: any) => acc + s.completion, 0) / fullMastery.length)
      : 0;

    // Count attempts and compute topic mastery
    const totalAttempts = userAttempts.reduce((acc: number, a: any) => acc + (a.attempts || 1), 0);

    let weakestTopics: AggregatedTopicMasteryItem[] = [];
    let strongestTopics: AggregatedTopicMasteryItem[] = [];

    if (userAttempts.length > 0) {
      try {
        const qIds = userAttempts.map((a: any) => a.questionId);
        const qObjIds = qIds
          .filter((id: any) => id && (id instanceof ObjectId || (typeof id === 'string' && ObjectId.isValid(id))))
          .map((id: any) => (id instanceof ObjectId ? id : new ObjectId(id)));

        const [questions, subjectsList] = await Promise.all([
          db.collection('Question').find(
            { _id: { $in: qObjIds } },
            { projection: { topic: 1, subjectId: 1, categoryId: 1 } }
          ).toArray().catch(() => []),
          db.collection('Subject').find({}).toArray().catch(() => []),
        ]);

        const qMap = new Map(questions.map((q: any) => [q._id.toString(), q]));
        const subMap = new Map(subjectsList.map((s: any) => [s._id.toString(), s.name]));

        const topicStats = new Map<string, { topic: string; subject: string; attempts: number; correct: number }>();

        userAttempts.forEach((att: any) => {
          const qIdStr = att.questionId?.toString();
          const q = qMap.get(qIdStr);
          if (!q) return;

          const rawTopic = (q.topic || 'General Concepts').trim();
          if (!rawTopic) return;

          const sId = q.subjectId?.toString() || q.categoryId?.toString();
          const subName = subMap.get(sId) || 'General MTLE';

          const key = `${subName}:::${rawTopic}`;
          const existing = topicStats.get(key) || { topic: rawTopic, subject: subName, attempts: 0, correct: 0 };
          existing.attempts += (typeof att.attempts === 'number' ? att.attempts : 1);
          existing.correct += (typeof att.correct === 'number' ? att.correct : 0);
          topicStats.set(key, existing);
        });

        const computedTopics: AggregatedTopicMasteryItem[] = Array.from(topicStats.values()).map((t) => {
          const accuracy = t.attempts > 0 ? Math.round((t.correct / t.attempts) * 100) : 0;
          let status: 'Mastered' | 'Proficient' | 'Needs Review' = 'Needs Review';
          if (accuracy >= 80 && t.attempts >= 2) status = 'Mastered';
          else if (accuracy >= 65) status = 'Proficient';

          return {
            topic: t.topic,
            subject: t.subject,
            accuracy,
            totalAttempts: t.attempts,
            status,
          };
        });

        // Weakest topics: Needs Review first, sorted by lowest accuracy
        weakestTopics = computedTopics
          .filter((t) => t.accuracy < 70 || t.status === 'Needs Review')
          .sort((a, b) => a.accuracy - b.accuracy || b.totalAttempts - a.totalAttempts)
          .slice(0, 5);

        // Strongest topics: Proficient or Mastered, sorted by highest accuracy
        strongestTopics = computedTopics
          .filter((t) => t.totalAttempts >= 1 && (t.accuracy >= 70 || t.status === 'Mastered'))
          .sort((a, b) => b.accuracy - a.accuracy || b.totalAttempts - a.totalAttempts)
          .slice(0, 5);
      } catch (topicErr) {
        console.warn('Failed to aggregate user topic mastery for AI diagnostic:', topicErr);
      }
    }

    const focusSubject = (settingsDoc?.focusSubject && settingsDoc.focusSubject !== 'none')
      ? settingsDoc.focusSubject
      : null;
    const dailyQuota = Number(settingsDoc?.dailyQuota) || 50;
    const studentName = userDoc?.name || 'Aspirant';

    // 2. Compute deterministic cache hash
    const fingerprint = {
      uid: userId,
      am: avgMastery,
      ac: avgCompletion,
      fs: focusSubject || '',
      dq: dailyQuota,
      ta: totalAttempts,
      sub: fullMastery.map((s: any) => `${s.subject}:${s.mastery}:${s.completion}`),
      wt: weakestTopics.map((w) => `${w.topic}:${w.accuracy}:${w.totalAttempts}`),
      st: strongestTopics.map((s) => `${s.topic}:${s.accuracy}:${s.totalAttempts}`),
    };

    const dataHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprint))
      .digest('hex');

    // 3. Check cached record in AiAnalysis table
    const cachedRecord = await db.collection('AiAnalysis').findOne({ $or: idQueries });

    const lastUpdatedTime = cachedRecord?.updatedAt
      ? new Date(cachedRecord.updatedAt).getTime()
      : 0;
    const ageMs = lastUpdatedTime > 0 ? Math.max(0, Date.now() - lastUpdatedTime) : Infinity;

    const cooldownRemainingMs = Math.max(0, MANUAL_REGENERATE_COOLDOWN_MS - ageMs);
    const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
    const canRegenerate = cooldownSeconds === 0;
    const cooldownExpiresAt = lastUpdatedTime > 0
      ? new Date(lastUpdatedTime + MANUAL_REGENERATE_COOLDOWN_MS).toISOString()
      : undefined;

    // Helper to ensure cached analysis has topicMasteryAnalysis hydrated if cached before this update
    const hydrateCachedAnalysis = (parsed: any): GenerateDiagnosticOutput => {
      // If legacy format without modern schema fields
      if (!parsed || !parsed.headline || !parsed.remediationPlan || !parsed.readinessStatus) {
        return createDeterministicDiagnosticFallback(
          studentName,
          avgMastery,
          avgCompletion,
          focusSubject,
          dailyQuota,
          fullMastery,
          totalAttempts,
          weakestTopics,
          strongestTopics
        );
      }

      if (!parsed.topicMasteryAnalysis) {
        const fallbackWeak = weakestTopics.length > 0 ? weakestTopics : [
          { topic: 'Carbohydrate Metabolism', subject: 'Clinical Chemistry', accuracy: 0, totalAttempts: 0, status: 'Unattempted' as const, diagnosticNote: 'Foundational MTLE chemistry domain.' },
          { topic: 'Bacterial Morphology and Staining', subject: 'Microbiology', accuracy: 0, totalAttempts: 0, status: 'Unattempted' as const, diagnosticNote: 'Core microbiology baseline for gram identification.' },
          { topic: 'RBC Indices and Morphologies', subject: 'Hematology', accuracy: 0, totalAttempts: 0, status: 'Unattempted' as const, diagnosticNote: 'Differential diagnosis of anemia.' },
        ];
        parsed.topicMasteryAnalysis = {
          priorityWeakTopics: fallbackWeak.slice(0, 3).map((t) => ({
            topic: t.topic,
            subject: t.subject,
            accuracy: t.accuracy,
            totalAttempts: t.totalAttempts,
            status: t.status as any,
            diagnosticNote: (t as any).diagnosticNote || `Target review recommended: ${t.accuracy}% accuracy across ${t.totalAttempts} attempts.`,
          })),
          masteredAnchorTopics: strongestTopics.slice(0, 3).map((t) => ({
            topic: t.topic,
            subject: t.subject,
            accuracy: t.accuracy,
            totalAttempts: t.totalAttempts,
            status: t.status as any,
            diagnosticNote: (t as any).diagnosticNote || `Demonstrated solid retention with ${t.accuracy}% accuracy.`,
          })),
          overallTopicReadinessSummary: totalAttempts > 0
            ? `${studentName} has active topic diagnostics across ${weakestTopics.length + strongestTopics.length} evaluated concepts. Complete targeted topic drills to reinforce high-yield board concepts.`
            : 'Topic analytics calibration pending. Complete questions in Quest Arena to unlock full topic diagnostics.',
        };
      }
      return parsed;
    };

    // Check if user requested manual regeneration, but is still within 15-minute cooldown
    if (forceRefresh && cachedRecord?.analysis && !canRegenerate) {
      try {
        const parsed = JSON.parse(cachedRecord.analysis) as GenerateDiagnosticOutput;
        const hydrated = hydrateCachedAnalysis(parsed);
        const minutesLeft = Math.ceil(cooldownSeconds / 60);
        return {
          success: true,
          cached: true,
          updatedAt: (cachedRecord.updatedAt instanceof Date ? cachedRecord.updatedAt : new Date(cachedRecord.updatedAt)).toISOString(),
          analysis: hydrated,
          canRegenerate: false,
          cooldownSeconds,
          cooldownExpiresAt,
          notice: `AI Diagnostic is already up to date. You can regenerate again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
        };
      } catch (parseErr) {
        console.warn('Failed to parse cached AiAnalysis JSON:', parseErr);
      }
    }

    // Automatic cache check (when forceRefresh is false):
    if (!forceRefresh && cachedRecord?.analysis) {
      const isFreshByTtl = ageMs < CACHE_TTL_MS;
      const isHashMatch = cachedRecord.hash === dataHash;

      if (isFreshByTtl || isHashMatch) {
        try {
          const parsed = JSON.parse(cachedRecord.analysis) as GenerateDiagnosticOutput;
          const hydrated = hydrateCachedAnalysis(parsed);
          return {
            success: true,
            cached: true,
            updatedAt: (cachedRecord.updatedAt instanceof Date ? cachedRecord.updatedAt : new Date(cachedRecord.updatedAt)).toISOString(),
            analysis: hydrated,
            canRegenerate,
            cooldownSeconds,
            cooldownExpiresAt,
          };
        } catch (parseErr) {
          console.warn('Failed to parse cached AiAnalysis JSON, regenerating fresh:', parseErr);
        }
      }
    }

    // 4. Generate fresh analysis via Genkit AI flow
    let analysisResult: GenerateDiagnosticOutput;
    let isFallback = false;

    try {
      analysisResult = await generateDiagnosticAnalysisFlow({
        studentName,
        avgMastery,
        avgCompletion,
        totalQuestionsAnswered: totalAttempts,
        focusSubject,
        dailyQuota,
        subjects: fullMastery,
        weakestTopics: weakestTopics.slice(0, 3).map((w) => ({
          topic: w.topic,
          subject: w.subject,
          accuracy: w.accuracy,
          totalAttempts: w.totalAttempts,
          status: w.status,
        })),
        strongestTopics: strongestTopics.slice(0, 2).map((s) => ({
          topic: s.topic,
          subject: s.subject,
          accuracy: s.accuracy,
          totalAttempts: s.totalAttempts,
          status: s.status,
        })),
      });

      // Ensure topicMasteryAnalysis is present
      analysisResult = hydrateCachedAnalysis(analysisResult);
    } catch (aiError: any) {
      console.warn('Genkit AI Diagnostic flow encountered error or rate limit:', aiError?.message || aiError);

      // If we have any existing cached analysis (even if stale hash), serve it gracefully
      if (cachedRecord?.analysis) {
        try {
          const parsed = JSON.parse(cachedRecord.analysis) as GenerateDiagnosticOutput;
          const hydrated = hydrateCachedAnalysis(parsed);
          return {
            success: true,
            cached: true,
            updatedAt: (cachedRecord.updatedAt instanceof Date ? cachedRecord.updatedAt : new Date(cachedRecord.updatedAt)).toISOString(),
            analysis: hydrated,
            canRegenerate,
            cooldownSeconds,
            cooldownExpiresAt,
            notice: 'Serving cached analysis while the AI diagnostic engine is refreshing.',
          };
        } catch {
          // ignore
        }
      }

      // Fall back to deterministic intelligence
      analysisResult = createDeterministicDiagnosticFallback(
        studentName,
        avgMastery,
        avgCompletion,
        focusSubject,
        dailyQuota,
        fullMastery,
        totalAttempts,
        weakestTopics,
        strongestTopics
      );
      isFallback = true;
    }

    // 5. Store / Upsert into AiAnalysis table
    const now = new Date();
    try {
      if (cachedRecord?._id) {
        await db.collection('AiAnalysis').updateOne(
          { _id: cachedRecord._id },
          {
            $set: {
              analysis: JSON.stringify(analysisResult),
              hash: dataHash,
              updatedAt: now,
            },
          }
        );
      } else {
        await db.collection('AiAnalysis').insertOne({
          userId: userObjId || userId,
          analysis: JSON.stringify(analysisResult),
          hash: dataHash,
          updatedAt: now,
        });
      }

      // Also sync with Prisma if model is active
      if (typeof (prisma as any).aiAnalysis?.upsert === 'function') {
        await (prisma as any).aiAnalysis.upsert({
          where: { userId },
          update: {
            analysis: JSON.stringify(analysisResult),
            hash: dataHash,
            updatedAt: now,
          },
          create: {
            userId,
            analysis: JSON.stringify(analysisResult),
            hash: dataHash,
            updatedAt: now,
          },
        }).catch(() => null);
      }
    } catch (dbSaveErr) {
      console.error('Failed to save to AiAnalysis table:', dbSaveErr);
    }

    const freshCooldownSeconds = Math.ceil(MANUAL_REGENERATE_COOLDOWN_MS / 1000);

    return {
      success: true,
      cached: false,
      updatedAt: now.toISOString(),
      analysis: analysisResult,
      canRegenerate: false,
      cooldownSeconds: freshCooldownSeconds,
      cooldownExpiresAt: new Date(now.getTime() + MANUAL_REGENERATE_COOLDOWN_MS).toISOString(),
      notice: isFallback ? 'AI model was temporarily busy; generated high-yield diagnostic baseline.' : undefined,
    };
  } catch (error: any) {
    console.error('getAiDiagnosticAction uncaught error:', error);
    return {
      success: false,
      cached: false,
      updatedAt: new Date().toISOString(),
      analysis: createDeterministicDiagnosticFallback('Aspirant', 0, 0, null, 50, [], 0),
      canRegenerate: true,
      cooldownSeconds: 0,
      error: error?.message || 'Internal Diagnostic Error',
    };
  }
}
