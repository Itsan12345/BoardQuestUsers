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

export async function getQuestQuestions(subject: string, mode: string = 'learning', limit: number = 50, specificDifficulty?: string): Promise<QuizQuestion[]> {
  try {
    let userId: string | undefined = undefined;
    try {
      const cookieStore = await cookies();
      userId = cookieStore.get('user_id')?.value;
    } catch (e) {}

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

    // 1. Resolve Subject IDs from MongoDB 'Subject' collection & Prisma Subject model
    try {
      const dbSubjects = await (prisma as any).subject?.findMany({
        where: { name: { equals: subject, mode: 'insensitive' } }
      });
      dbSubjects?.forEach((s: any) => addId(s.id));
    } catch (e) {}

    try {
      const client = await clientPromise;
      const db = client.db('boardquest');
      const nameRegex = new RegExp('^' + escapeRegex(subject) + '$', 'i');

      const rawSubjects = await db.collection('Subject').find({ name: nameRegex }).toArray();
      rawSubjects.forEach(s => addId(s._id.toString()));
    } catch (e) {}

    const isBossBattle = mode === 'boss-battle';
    const targetDiff = specificDifficulty ? specificDifficulty.toUpperCase() : undefined;

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

      const fullQuery: any = {
        $and: [
          queryFilter,
          approvedStatusFilter,
          ...(!isBossBattle && targetDiff ? [{ difficulty: { $regex: new RegExp('^' + targetDiff + '$', 'i') } }] : [])
        ]
      };

      rawQuestions = await db.collection('Question').find(fullQuery).toArray();

      if (rawQuestions.length === 0 && !isBossBattle && targetDiff) {
        const fallbackDiffQuery = { $and: [queryFilter, approvedStatusFilter] };
        rawQuestions = await db.collection('Question').find(fallbackDiffQuery).toArray();
      }

      if (rawQuestions.length === 0) {
        rawQuestions = await db.collection('Question').find(queryFilter).toArray();
      }

      if (rawQuestions.length === 0) {
        rawQuestions = await db.collection('Question').find(approvedStatusFilter).limit(limit).toArray();
      }

      if (rawQuestions.length === 0) {
        rawQuestions = await db.collection('Question').find({}).limit(limit).toArray();
      }
    } catch (dbErr) {
      console.warn('Raw MongoDB question query failed, attempting Prisma query fallback:', dbErr);
      try {
        const prismaQuestions = await prisma.question.findMany({
          where: {
            OR: [
              ...(matchingSubjectIds.length > 0 ? [{ categoryId: { in: matchingSubjectIds } }] : []),
              ...(matchingSubjectIds.length > 0 ? [{ subjectId: { in: matchingSubjectIds } }] : []),
              { topic: { contains: subject, mode: 'insensitive' } }
            ]
          } as any,
          select: {
            id: true,
            question: true,
            choices: true,
            correctAnswer: true,
            difficulty: true,
            type: true,
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
      correctAnswer: q.correctAnswer || '',
      difficulty: String(q.difficulty || 'EASY').toUpperCase(),
      type: q.type || 'MCQ'
    }));

    let selected = [...allQuestions];

    // Spaced Repetition / Mastery Algorithm
    if (userId) {
      const attempts: any[] = await (prisma as any).userQuestionAttempt.findMany({
        where: { userId }
      });
      
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

        // Score formulation: Lower score = higher priority
        // If they got it wrong a lot, ratio is low (e.g. 0/5 = 0). We want this at the top!
        // Unanswered: ratio is 1, attempts is 0. 
        // Mastered: ratio is 1, attempts > 0.
        
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
      const options = q.choices || q.options || [];
      const correctIndex = options.findIndex((opt: string) => 
        opt.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
      );
      
      let correctAnswerLetter = q.correctAnswer;
      if (correctIndex !== -1) {
        correctAnswerLetter = String.fromCharCode(65 + correctIndex);
      } else if (["A", "B", "C", "D"].includes(q.correctAnswer)) {
        correctAnswerLetter = q.correctAnswer;
      }

      return {
        id: q.id,
        question: q.question,
        options: options,
        correctAnswer: correctAnswerLetter,
        explanation: undefined,
        difficulty: String(q.difficulty || 'EASY').toUpperCase(),
        type: q.type || 'MCQ',
      };
    });
  } catch (error) {
    console.error('Failed to get quest questions:', error);
    return [];
  }
}
