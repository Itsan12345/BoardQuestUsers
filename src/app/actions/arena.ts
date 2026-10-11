'use server';

import { prisma } from '@/lib/prisma';
import { Question as QuizQuestion } from '@/components/quiz/QuizInterface';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb-client';
import { ObjectId } from 'mongodb';

const difficultyOrder: Record<string, number> = {
  'EASY': 1,
  'MEDIUM': 2,
  'HARD': 3,
};

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const subjectCache = new Map<string, { matchingSubjectIds: string[]; matchingObjectIds: ObjectId[] }>();

async function resolveSubjectIds(subject: string) {
  const normKey = subject.trim().toLowerCase();
  const cached = subjectCache.get(normKey);
  if (cached) return cached;

  const matchingSubjectIds: string[] = [];
  const matchingObjectIds: ObjectId[] = [];

  const addId = (idStr: string) => {
    if (idStr && !matchingSubjectIds.includes(idStr)) {
      matchingSubjectIds.push(idStr);
      if (ObjectId.isValid(idStr)) {
        try {
          matchingObjectIds.push(new ObjectId(idStr));
        } catch (e) {}
      }
    }
  };

  try {
    const client = await clientPromise;
    const db = client.db('boardquest');
    const nameRegex = new RegExp('^' + escapeRegex(subject) + '$', 'i');

    const rawSubjects = await db.collection('Subject').find({ name: nameRegex }).toArray();
    rawSubjects.forEach(s => addId(s._id.toString()));
  } catch (e) {}

  if (matchingSubjectIds.length === 0) {
    try {
      const dbSubjects = await (prisma as any).subject?.findMany({
        where: { name: { equals: subject, mode: 'insensitive' } }
      });
      dbSubjects?.forEach((s: any) => addId(s.id));
    } catch (e) {}
  }

  const result = { matchingSubjectIds, matchingObjectIds };
  if (matchingSubjectIds.length > 0) {
    subjectCache.set(normKey, result);
  }
  return result;
}

export async function getSubjectTopics(subject: string): Promise<string[]> {
  try {
    const { matchingSubjectIds, matchingObjectIds } = await resolveSubjectIds(subject);

    const client = await clientPromise;
    const db = client.db('boardquest');

    const idOrConditions: any[] = [];
    matchingSubjectIds.forEach(idStr => {
      idOrConditions.push({ categoryId: idStr });
      idOrConditions.push({ subjectId: idStr });
    });
    matchingObjectIds.forEach(objId => {
      idOrConditions.push({ categoryId: objId });
      idOrConditions.push({ subjectId: objId });
    });
    idOrConditions.push({ topic: new RegExp(escapeRegex(subject), 'i') });

    const queryFilter: any = idOrConditions.length > 0 ? { $or: idOrConditions } : {};

    const approvedStatusFilter = {
      $or: [
        { status: { $regex: /^approved$/i } },
        { isPublished: true },
        { status: { $exists: false } }
      ]
    };

    let rawTopics: any[] = [];
    try {
      rawTopics = await db.collection('Question').distinct('topic', {
        $and: [queryFilter, approvedStatusFilter]
      });
    } catch (e) {
      const docs = await db.collection('Question').find(queryFilter, { projection: { topic: 1 } }).toArray();
      rawTopics = docs.map(d => d.topic);
    }

    if (!rawTopics || rawTopics.length === 0) {
      try {
        const prismaQuestions = await prisma.question.findMany({
          where: {
            OR: [
              ...(matchingSubjectIds.length > 0 ? [{ categoryId: { in: matchingSubjectIds } }] : []),
              ...(matchingSubjectIds.length > 0 ? [{ subjectId: { in: matchingSubjectIds } }] : []),
              { topic: { contains: subject, mode: 'insensitive' } }
            ]
          } as any,
          select: { topic: true },
          distinct: ['topic']
        });
        rawTopics = prismaQuestions.map((q: any) => q.topic);
      } catch (e) {}
    }

    const cleanTopics = (rawTopics || [])
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map(t => t.trim());

    const seen = new Set<string>();
    const uniqueTopics: string[] = [];
    for (const t of cleanTopics) {
      const lower = t.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueTopics.push(t);
      }
    }

    return uniqueTopics.sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Failed to get subject topics:', error);
    return [];
  }
}

export async function getQuestQuestions(
  subject: string, 
  mode: string = 'learning', 
  limit: number = 50, 
  specificDifficulty?: string,
  specificTopic?: string
): Promise<QuizQuestion[]> {
  try {
    let userId: string | undefined = undefined;
    try {
      const cookieStore = await cookies();
      userId = cookieStore.get('user_id')?.value;
    } catch (e) {}

    const { matchingSubjectIds, matchingObjectIds } = await resolveSubjectIds(subject);

    const isBossBattle = mode === 'boss-battle';
    const targetDiff = specificDifficulty ? specificDifficulty.toUpperCase() : undefined;
    const cleanTopic = typeof specificTopic === 'string' ? specificTopic.trim() : '';
    const hasTopicFilter = cleanTopic.length > 0;

    let rawQuestions: any[] = [];

    // 2. Fetch questions using Raw MongoDB Driver for max compatibility with ObjectId / String fields
    try {
      const client = await clientPromise;
      const db = client.db('boardquest');

      const idOrConditions: any[] = [];
      matchingSubjectIds.forEach(idStr => {
        idOrConditions.push({ categoryId: idStr });
        idOrConditions.push({ subjectId: idStr });
      });

      matchingObjectIds.forEach(objId => {
        idOrConditions.push({ categoryId: objId });
        idOrConditions.push({ subjectId: objId });
      });

      idOrConditions.push({ topic: new RegExp(escapeRegex(subject), 'i') });

      const queryFilter: any = {
        $or: idOrConditions.length > 0 ? idOrConditions : [{ topic: new RegExp(escapeRegex(subject), 'i') }]
      };

      const approvedStatusFilter = {
        $or: [
          { status: { $regex: /^approved$/i } },
          { isPublished: true },
          { status: { $exists: false } }
        ]
      };

      if (hasTopicFilter) {
        // Fast direct topic lookup
        const topicRegex = new RegExp(escapeRegex(cleanTopic), 'i');
        const topicSubjectQuery: any = {
          $and: [
            approvedStatusFilter,
            { topic: topicRegex },
            ...(idOrConditions.length > 0 ? [{ $or: [...idOrConditions, { topic: topicRegex }] }] : [])
          ]
        };
        rawQuestions = await db.collection('Question').find(topicSubjectQuery).toArray();

        // If no questions found with strict subject binding, search topic across Question collection
        if (rawQuestions.length === 0) {
          rawQuestions = await db.collection('Question').find({
            $and: [
              approvedStatusFilter,
              { topic: topicRegex }
            ]
          }).toArray();
        }
      } else {
        const fullQuery: any = {
          $and: [
            queryFilter,
            approvedStatusFilter,
            ...(!isBossBattle && targetDiff ? [{ difficulty: { $regex: new RegExp('^' + targetDiff + '$', 'i') } }] : [])
          ]
        };

        rawQuestions = await db.collection('Question').find(fullQuery).toArray();

        if (rawQuestions.length === 0 && !isBossBattle && targetDiff) {
          rawQuestions = await db.collection('Question').find({
            $and: [queryFilter, approvedStatusFilter]
          }).toArray();
        }

        if (rawQuestions.length === 0) {
          rawQuestions = await db.collection('Question').find(queryFilter).limit(limit * 2).toArray();
        }
      }
    } catch (dbErr) {
      console.warn('Raw MongoDB question query failed, attempting Prisma query fallback:', dbErr);
      try {
        const prismaQuestions = await prisma.question.findMany({
          where: {
            AND: [
              {
                OR: [
                  ...(matchingSubjectIds.length > 0 ? [{ categoryId: { in: matchingSubjectIds } }] : []),
                  ...(matchingSubjectIds.length > 0 ? [{ subjectId: { in: matchingSubjectIds } }] : []),
                  { topic: { contains: subject, mode: 'insensitive' } }
                ]
              },
              ...(hasTopicFilter ? [{ topic: { contains: cleanTopic, mode: 'insensitive' } }] : [])
            ]
          } as any,
          select: {
            id: true,
            question: true,
            choices: true,
            choiceImages: true,
            imageUrl: true,
            correctAnswer: true,
            difficulty: true,
            type: true,
            topic: true,
          }
        });
        rawQuestions = prismaQuestions;
      } catch (prismaErr) {
        console.error('Prisma question query failed:', prismaErr);
      }
    }

    if (!rawQuestions || rawQuestions.length === 0) {
      console.warn(`No questions found for subject ${subject} in Question collection.`);
      return [];
    }

    const allQuestions = rawQuestions.map((q: any) => ({
      id: q._id ? q._id.toString() : q.id,
      question: q.question || 'Untitled Question',
      choices: q.choices || q.options || [],
      choiceImages: Array.isArray(q.choiceImages)
        ? q.choiceImages.map((img: any) => (typeof img === 'string' && img.trim().length > 0 && img !== 'null' && img !== 'undefined') ? img.trim() : null)
        : [],
      imageUrl: (typeof q.imageUrl === 'string' && q.imageUrl.trim().length > 0 && q.imageUrl !== 'null' && q.imageUrl !== 'undefined')
        ? q.imageUrl.trim()
        : null,
      correctAnswer: q.correctAnswer || '',
      difficulty: String(q.difficulty || 'EASY').toUpperCase(),
      type: q.type || 'MCQ',
      topic: typeof q.topic === 'string' ? q.topic.trim() : ''
    }));

    let selected = [...allQuestions];

    // Spaced Repetition / Mastery Algorithm (Optimized native Mongo lookup)
    if (userId && allQuestions.length > 0) {
      let attempts: any[] = [];
      try {
        const client = await clientPromise;
        const db = client.db('boardquest');
        const qIds = allQuestions.map(q => q.id);
        const userObjId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
        const userFilter = userObjId ? { $or: [{ userId }, { userId: userObjId }] } : { userId };

        attempts = await db.collection('UserQuestionAttempt').find({
          ...userFilter,
          questionId: { $in: qIds }
        }).toArray();
      } catch (err) {
        try {
          attempts = await (prisma as any).userQuestionAttempt.findMany({
            where: { userId, questionId: { in: allQuestions.map(q => q.id) } }
          });
        } catch (e) {}
      }
      
      const attemptMap = new Map(attempts.map(a => [a.questionId, a]));

      // Sort questions based on mastery algorithm
      selected.sort((a, b) => {
        const attemptA = attemptMap.get(a.id);
        const attemptB = attemptMap.get(b.id);
        
        // Priority 1: High attempts, low correct ratio (Struggling)
        const ratioA = attemptA && attemptA.attempts > 0 ? attemptA.correct / attemptA.attempts : 1;
        const ratioB = attemptB && attemptB.attempts > 0 ? attemptB.correct / attemptB.attempts : 1;
        
        // Priority 2: Unanswered (ratio = 1 by default, but attempts = 0)
        const attemptsA = attemptA ? attemptA.attempts : 0;
        const attemptsB = attemptB ? attemptB.attempts : 0;

        let scoreA = 0;
        let scoreB = 0;

        if (attemptsA > 0 && ratioA < 0.6) scoreA = -10 + ratioA; // Struggling (very high priority)
        else if (attemptsA === 0) scoreA = 0; // Unanswered (high priority)
        else scoreA = 10 + ratioA; // Mastered (low priority)

        if (attemptsB > 0 && ratioB < 0.6) scoreB = -10 + ratioB;
        else if (attemptsB === 0) scoreB = 0;
        else scoreB = 10 + ratioB;

        // Add a tiny bit of randomness to break ties within the same priority bracket
        const randomFactorA = Math.random() * 0.1;
        const randomFactorB = Math.random() * 0.1;
        
        return (scoreA + randomFactorA) - (scoreB + randomFactorB);
      });
    } else {
      // Random shuffle if no user
      selected = selected.sort(() => 0.5 - Math.random());
    }

    // Enforce structure based on mode
    const easySelected: any[] = [];
    const mediumSelected: any[] = [];
    const hardSelected: any[] = [];
    const leftovers: any[] = [];

    const isTestMode = mode === 'test';
    
    // Pro-rate difficulties based on limit (30% Easy, 40% Medium, 30% Hard)
    const easyLimit = Math.max(1, Math.floor(limit * 0.3));
    const hardLimit = Math.max(1, Math.floor(limit * 0.3));
    const mediumLimit = limit - easyLimit - hardLimit;

    for (const q of selected) {
      const diff = String(q.difficulty || 'EASY').toUpperCase();
      if (diff === 'EASY' && easySelected.length < easyLimit) {
        easySelected.push(q);
      } else if (diff === 'MEDIUM' && mediumSelected.length < mediumLimit) {
        mediumSelected.push(q);
      } else if (diff === 'HARD' && hardSelected.length < hardLimit) {
        hardSelected.push(q);
      } else {
        leftovers.push(q);
      }
    }

    let finalSelection = [...easySelected, ...mediumSelected, ...hardSelected];

    // Fill any remaining spots from leftovers (which are already sorted by mastery priority)
    if (finalSelection.length < limit) {
      const needed = limit - finalSelection.length;
      finalSelection.push(...leftovers.slice(0, needed));
    }

    if (isTestMode) {
      // Tower Climb: Shuffle everything so CAT can pull dynamically
      finalSelection = finalSelection.sort(() => 0.5 - Math.random());
    } else {
      // Finally, sort the final selection by difficulty (Easy -> Medium -> Hard) to strictly form "Waves"
      finalSelection.sort((a, b) => {
        const diffA = difficultyOrder[String(a.difficulty || 'EASY').toUpperCase()] || 1;
        const diffB = difficultyOrder[String(b.difficulty || 'EASY').toUpperCase()] || 1;
        return diffA - diffB;
      });
    }

    selected = finalSelection;

    // In boss battle mode, loop the question pool if total available questions < 50
    // so the battle NEVER runs out of questions before the boss or player HP reaches 0!
    if (isBossBattle && selected.length > 0 && selected.length < 50) {
      const basePool = [...selected];
      let extendedPool = [...selected];
      while (extendedPool.length < 50) {
        extendedPool = extendedPool.concat(basePool.map((q, idx) => ({
          ...q,
          id: `${q.id}_cycle_${extendedPool.length + idx}`
        })));
      }
      selected = extendedPool;
    }

    return selected.map((q: any) => {
      let rawOptions: string[] = Array.isArray(q.choices)
        ? [...q.choices]
        : Array.isArray(q.options)
          ? [...q.options]
          : [];
      if (rawOptions.length === 0 && q.type === 'TRUE_FALSE') {
        rawOptions = ['True', 'False'];
      }
      const rawChoiceImages: (string | null)[] = Array.isArray(q.choiceImages)
        ? [...q.choiceImages]
        : [];

      // Determine original correct choice index
      let origCorrectIndex = -1;
      const textMatchIdx = rawOptions.findIndex((opt: string) => 
        opt.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
      );

      if (textMatchIdx !== -1) {
        origCorrectIndex = textMatchIdx;
      } else if (String(q.correctAnswer).trim().toLowerCase() === 'true' || String(q.correctAnswer).trim().toUpperCase() === 'T') {
        origCorrectIndex = rawOptions.findIndex((opt: string) => opt.trim().toLowerCase() === 'true');
      } else if (String(q.correctAnswer).trim().toLowerCase() === 'false' || String(q.correctAnswer).trim().toUpperCase() === 'F') {
        origCorrectIndex = rawOptions.findIndex((opt: string) => opt.trim().toLowerCase() === 'false');
      } else if (["A", "B", "C", "D", "E", "F"].includes(String(q.correctAnswer).trim().toUpperCase())) {
        origCorrectIndex = String(q.correctAnswer).trim().toUpperCase().charCodeAt(0) - 65;
      } else if (typeof q.correctAnswer === 'string') {
        const match = q.correctAnswer.trim().match(/^option\s*([A-F])$/i);
        if (match) {
          origCorrectIndex = match[1].toUpperCase().charCodeAt(0) - 65;
        }
      } else if (typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < rawOptions.length) {
        origCorrectIndex = q.correctAnswer;
      }

      let finalOptions = [...rawOptions];
      let finalChoiceImages = [...rawChoiceImages];
      let correctAnswerLetter = q.correctAnswer;

      const isShortAnswer = q.type === 'SHORT_ANSWER';

      // Randomize choices for both MCQ and True/False questions with at least 2 choices
      // (Short Answer questions remain unaffected so students can type their answer)
      if (!isShortAnswer && rawOptions.length > 1 && origCorrectIndex >= 0 && origCorrectIndex < rawOptions.length) {
        const bundled = rawOptions.map((opt, idx) => ({
          text: opt,
          image: rawChoiceImages[idx] || null,
          isCorrect: idx === origCorrectIndex,
        }));

        // Fisher-Yates shuffle
        for (let i = bundled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bundled[i], bundled[j]] = [bundled[j], bundled[i]];
        }

        finalOptions = bundled.map(b => b.text);
        finalChoiceImages = bundled.map(b => b.image);
        const newCorrectIdx = bundled.findIndex(b => b.isCorrect);
        if (newCorrectIdx !== -1) {
          correctAnswerLetter = String.fromCharCode(65 + newCorrectIdx);
        }
      } else if (origCorrectIndex !== -1 && origCorrectIndex < rawOptions.length) {
        correctAnswerLetter = String.fromCharCode(65 + origCorrectIndex);
      } else if (["A", "B", "C", "D"].includes(String(q.correctAnswer).trim().toUpperCase())) {
        correctAnswerLetter = String(q.correctAnswer).trim().toUpperCase();
      }

      const hasValidChoiceImages = finalChoiceImages.some(img => typeof img === 'string' && img.trim().length > 0 && img.trim() !== 'null' && img.trim() !== 'undefined');

      return {
        id: q.id,
        question: q.question,
        options: finalOptions,
        choiceImages: hasValidChoiceImages ? finalChoiceImages : [],
        imageUrl: q.imageUrl || null,
        correctAnswer: correctAnswerLetter,
        explanation: undefined,
        difficulty: String(q.difficulty || 'EASY').toUpperCase(),
        type: q.type || 'MCQ',
        topic: typeof q.topic === 'string' ? q.topic.trim() : '',
      };
    });
  } catch (error) {
    console.error('Failed to get quest questions:', error);
    return [];
  }
}

export interface LogIntegrityIncidentParams {
  incidentType: 'TAB_SWITCH' | 'SCREENSHOT_ATTEMPT' | 'FULLSCREEN_EXIT' | 'COPY_ATTEMPT';
  subject?: string;
  nodeId?: string;
  quizMode?: string;
  strikeCount: number;
  details?: string;
}

/**
 * Calculates ISO week number and starting Monday date for dynamic weekly resets.
 * ISO weeks run Monday through Sunday.
 */
function getISOWeekDetails(date: Date = new Date()): { weekKey: string; weekStartDate: Date } {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNr);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const weekKey = `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const currentDay = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - (currentDay - 1));

  return { weekKey, weekStartDate: monday };
}

let hasEnsuredIntegrityIndexes = false;
async function ensureIntegrityIndexes(db: any) {
  if (hasEnsuredIntegrityIndexes) return;
  hasEnsuredIntegrityIndexes = true;

  try {
    // 1. Ensure 90-day TTL index on StudentWarningIncidents (90 days = 7,776,000 seconds)
    const incidentIndexes = await db.collection('StudentWarningIncidents').indexes().catch(() => []);
    const hasTtl = incidentIndexes.some((idx: any) => idx.name === 'timestamp_ttl_90d' || (idx.key && idx.key.timestamp && idx.expireAfterSeconds));
    if (!hasTtl) {
      await db.collection('StudentWarningIncidents').createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: 7776000, name: 'timestamp_ttl_90d', background: true }
      ).catch(() => {});
    }

    const hasIncidentUserIdx = incidentIndexes.some((idx: any) => idx.key && idx.key.userId);
    if (!hasIncidentUserIdx) {
      await db.collection('StudentWarningIncidents').createIndex({ userId: 1 }, { background: true }).catch(() => {});
    }

    // 2. Ensure userId unique index on StudentWarningSummaries (respecting existing sparse/unique spec)
    const summaryIndexes = await db.collection('StudentWarningSummaries').indexes().catch(() => []);
    const hasSummaryUserIdx = summaryIndexes.some((idx: any) => idx.key && idx.key.userId);
    if (!hasSummaryUserIdx) {
      await db.collection('StudentWarningSummaries').createIndex(
        { userId: 1 },
        { unique: true, sparse: true, background: true }
      ).catch(() => {});
    }
  } catch (err) {
    // Non-fatal if index already exists or cluster permissions restrict ad-hoc index creation
  }
}

export async function logArenaIntegrityIncidentAction(params: LogIntegrityIncidentParams) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    let userName = 'Aspirant Student';
    let userEmail = 'student@boardquest.app';

    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        if (user) {
          userName = user.name || userName;
          userEmail = user.email || userEmail;
        }
      } catch (_) {}
    }

    const client = await clientPromise;
    const db = client.db('boardquest');
    const now = new Date();
    const { weekKey, weekStartDate } = getISOWeekDetails(now);

    // Ensure 90-day TTL & query indexes are active
    await ensureIntegrityIndexes(db);

    const incidentDoc = {
      userId: userId || null,
      userName,
      userEmail,
      subject: params.subject || 'General Quest',
      nodeId: params.nodeId || 'unknown',
      quizMode: params.quizMode || 'quest',
      incidentType: params.incidentType,
      strikeCount: params.strikeCount,
      details: params.details || '',
      weekKey,
      timestamp: now,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Store in the dedicated StudentWarningIncidents collection (auto-expires in 90 days via TTL)
    await db.collection('StudentWarningIncidents').insertOne(incidentDoc);

    // Also mirror to legacy collection for historical continuity
    await db.collection('arena_integrity_incidents').insertOne({
      ...incidentDoc,
      createdAt: now.toISOString(),
    }).catch(() => {});

    // 2. Real-time dynamic dual-counter in StudentWarningSummaries (weekly active window + lifetime audit)
    if (userId) {
      const incType = params.incidentType;
      const isFullscreen = incType === 'FULLSCREEN_EXIT';
      const isScreenshot = incType === 'SCREENSHOT_ATTEMPT';
      const isTab = incType === 'TAB_SWITCH';

      const lifetimeIncField =
        isFullscreen ? 'fullscreenExits'
        : isScreenshot ? 'screenshots'
        : isTab ? 'tabSwitches'
        : 'copyAttempts';

      const weeklyIncField =
        isFullscreen ? 'weeklyFullscreenExits'
        : isScreenshot ? 'weeklyScreenshots'
        : isTab ? 'weeklyTabSwitches'
        : 'weeklyCopyAttempts';

      const existingSummary = await db.collection('StudentWarningSummaries').findOne({ userId });
      const isSameWeek = existingSummary && existingSummary.currentWeekKey === weekKey;
      const prevAllTime = existingSummary
        ? Math.max(existingSummary.allTimeWarnings || 0, existingSummary.totalWarnings || 0)
        : 0;
      const allTimeTotal = prevAllTime + 1;
      const allTimeRisk = allTimeTotal >= 6 ? 'HIGH' : allTimeTotal >= 3 ? 'MEDIUM' : 'LOW';

      if (isSameWeek) {
        // Increment both weekly active window & lifetime audit counters
        const weeklyTotal = (existingSummary.weeklyWarnings || 0) + 1;
        const weeklyRisk = weeklyTotal >= 6 ? 'HIGH' : weeklyTotal >= 3 ? 'MEDIUM' : 'LOW';

        await db.collection('StudentWarningSummaries').updateOne(
          { userId },
          {
            $set: {
              userName,
              userEmail,
              weeklyWarnings: weeklyTotal,
              weeklyRiskLevel: weeklyRisk,
              allTimeWarnings: allTimeTotal,
              totalWarnings: allTimeTotal,
              riskLevel: allTimeRisk,
              lastIncidentType: params.incidentType,
              lastIncidentAt: now,
              updatedAt: now,
            },
            $inc: {
              [weeklyIncField]: 1,
              [lifetimeIncField]: 1,
            },
            $addToSet: {
              subjectsAffected: params.subject || 'General Quest',
            },
          }
        );
      } else {
        // Week rollover or first infraction: Reset weekly counters, set lifetime counters
        await db.collection('StudentWarningSummaries').updateOne(
          { userId },
          {
            $set: {
              userName,
              userEmail,
              currentWeekKey: weekKey,
              weekStartDate,
              weeklyWarnings: 1,
              weeklyFullscreenExits: isFullscreen ? 1 : 0,
              weeklyScreenshots: isScreenshot ? 1 : 0,
              weeklyTabSwitches: isTab ? 1 : 0,
              weeklyCopyAttempts: (!isFullscreen && !isScreenshot && !isTab) ? 1 : 0,
              weeklyRiskLevel: 'LOW',
              allTimeWarnings: allTimeTotal,
              totalWarnings: allTimeTotal,
              riskLevel: allTimeRisk,
              lastIncidentType: params.incidentType,
              lastIncidentAt: now,
              updatedAt: now,
            },
            $inc: {
              [lifetimeIncField]: 1,
            },
            $addToSet: {
              subjectsAffected: params.subject || 'General Quest',
            },
          },
          { upsert: true }
        );
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to log arena integrity incident:', error);
    return { success: false, error: error.message };
  }
}

export async function getArenaIntegrityIncidentsAction(limit = 100) {
  try {
    const client = await clientPromise;
    const db = client.db('boardquest');
    
    // Read from dedicated StudentWarningIncidents collection
    let incidents = await db
      .collection('StudentWarningIncidents')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Fallback to legacy collection if new collection is empty
    if (incidents.length === 0) {
      incidents = await db
        .collection('arena_integrity_incidents')
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    }

    return {
      success: true,
      incidents: incidents.map(inc => ({
        id: inc._id.toString(),
        userId: inc.userId,
        userName: inc.userName,
        userEmail: inc.userEmail,
        subject: inc.subject,
        nodeId: inc.nodeId,
        quizMode: inc.quizMode,
        incidentType: inc.incidentType,
        strikeCount: inc.strikeCount,
        details: inc.details,
        weekKey: inc.weekKey,
        timestamp: inc.timestamp ? new Date(inc.timestamp).toISOString() : (inc.createdAt || ''),
      })),
    };
  } catch (error: any) {
    console.error('Failed to get arena integrity incidents:', error);
    return { success: false, incidents: [], error: error.message };
  }
}

export interface StudentIntegritySummary {
  userId: string | null;
  userName: string;
  userEmail: string;

  // Weekly Active Window (Resets each week)
  currentWeekKey: string;
  weekStartDate?: string;
  weeklyWarnings: number;
  weeklyFullscreenExits: number;
  weeklyScreenshots: number;
  weeklyTabSwitches: number;
  weeklyCopyAttempts: number;
  weeklyRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  // All-Time Lifetime Tracking
  allTimeWarnings: number;
  totalWarnings: number; // alias for backwards compatibility
  fullscreenExits: number;
  screenshots: number;
  tabSwitches: number;
  copyAttempts: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  lastIncidentAt: string;
  lastIncidentType?: string;
  subjectsAffected: string[];
}

export async function getStudentIntegritySummaryAction(timeframe: 'weekly' | 'all-time' = 'weekly'): Promise<{
  success: boolean;
  currentWeekKey: string;
  students: StudentIntegritySummary[];
  error?: string;
}> {
  try {
    const client = await clientPromise;
    const db = client.db('boardquest');
    const { weekKey, weekStartDate } = getISOWeekDetails(new Date());

    // Read directly from real-time StudentWarningSummaries counter collection
    const summaries = await db
      .collection('StudentWarningSummaries')
      .find({})
      .toArray();

    const students: StudentIntegritySummary[] = summaries.map((s: any) => {
      const isCurrentWeek = s.currentWeekKey === weekKey;

      // Dynamic Weekly Zeroing: If student's recorded infractions belong to a prior week,
      // weekly tallies automatically evaluate to 0 without requiring manual batch sweeps
      const weeklyWarnings = isCurrentWeek ? (s.weeklyWarnings || 0) : 0;
      const weeklyFullscreenExits = isCurrentWeek ? (s.weeklyFullscreenExits || 0) : 0;
      const weeklyScreenshots = isCurrentWeek ? (s.weeklyScreenshots || 0) : 0;
      const weeklyTabSwitches = isCurrentWeek ? (s.weeklyTabSwitches || 0) : 0;
      const weeklyCopyAttempts = isCurrentWeek ? (s.weeklyCopyAttempts || 0) : 0;
      const weeklyRiskLevel = isCurrentWeek
        ? (s.weeklyRiskLevel || (weeklyWarnings >= 6 ? 'HIGH' : weeklyWarnings >= 3 ? 'MEDIUM' : 'LOW'))
        : 'LOW';

      const allTimeWarnings = Math.max(s.allTimeWarnings || 0, s.totalWarnings || 0);

      return {
        userId: s.userId || s._id?.toString() || null,
        userName: s.userName || 'Unknown Student',
        userEmail: s.userEmail || 'unknown@boardquest.app',

        currentWeekKey: weekKey,
        weekStartDate: s.weekStartDate ? new Date(s.weekStartDate).toISOString() : weekStartDate.toISOString(),
        weeklyWarnings,
        weeklyFullscreenExits,
        weeklyScreenshots,
        weeklyTabSwitches,
        weeklyCopyAttempts,
        weeklyRiskLevel,

        allTimeWarnings,
        totalWarnings: allTimeWarnings,
        fullscreenExits: s.fullscreenExits || 0,
        screenshots: s.screenshots || 0,
        tabSwitches: s.tabSwitches || 0,
        copyAttempts: s.copyAttempts || 0,
        riskLevel: s.riskLevel || (allTimeWarnings >= 6 ? 'HIGH' : allTimeWarnings >= 3 ? 'MEDIUM' : 'LOW'),

        lastIncidentAt: s.lastIncidentAt ? new Date(s.lastIncidentAt).toISOString() : '',
        lastIncidentType: s.lastIncidentType,
        subjectsAffected: Array.isArray(s.subjectsAffected) ? s.subjectsAffected : [],
      };
    });

    // Sort according to requested timeframe
    students.sort((a, b) => {
      if (timeframe === 'weekly') {
        return b.weeklyWarnings - a.weeklyWarnings || b.allTimeWarnings - a.allTimeWarnings;
      }
      return b.allTimeWarnings - a.allTimeWarnings || b.weeklyWarnings - a.weeklyWarnings;
    });

    return {
      success: true,
      currentWeekKey: weekKey,
      students,
    };
  } catch (error: any) {
    console.error('Failed to get student integrity summary:', error);
    return { success: false, currentWeekKey: '', students: [], error: error.message };
  }
}



