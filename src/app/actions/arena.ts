'use server';

import { prisma } from '@/lib/prisma';
import { Question as QuizQuestion } from '@/components/quiz/QuizInterface';
import { cookies } from 'next/headers';

const difficultyOrder: Record<string, number> = {
  'EASY': 1,
  'MEDIUM': 2,
  'HARD': 3,
};

export async function getQuestQuestions(subject: string, mode: string = 'learning', limit: number = 50, specificDifficulty?: string): Promise<QuizQuestion[]> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    const category = await prisma.category.findFirst({
      where: { name: subject }
    });

    if (!category) {
      console.warn(`Category not found for subject: ${subject}`);
      return [];
    }

    const isBossBattle = mode === 'boss-battle';

    const allQuestions = await prisma.question.findMany({
      where: {
        categoryId: category.id,
        status: 'APPROVED',
        ...(!isBossBattle && specificDifficulty ? { difficulty: specificDifficulty } : {})
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

    if (allQuestions.length === 0) {
      // Fallback: fetch any approved questions for this category
      const fallback = await prisma.question.findMany({
        where: { categoryId: category.id, status: 'APPROVED' },
        select: {
          id: true,
          question: true,
          choices: true,
          correctAnswer: true,
          difficulty: true,
          type: true,
        }
      });
      if (fallback.length === 0) return [];
      allQuestions.push(...fallback);
    }

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
