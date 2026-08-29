'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import {
  STANDARD_MTLE_SUBJECTS,
  normalizeMtleSubject,
  evaluatePrcStatus,
  calculateConfidenceScore,
  generateRemediationAdvice,
  MtleSubjectScore,
  MtleReadinessResult,
} from '@/lib/mtle-predictor-engine';
import { getCurriculumLessonsForSubject } from './study';

export async function getMtleReadinessData(targetUserId?: string): Promise<MtleReadinessResult | null> {
  try {
    let userId = targetUserId;
    if (!userId) {
      const cookieStore = await cookies();
      userId = cookieStore.get('user_id')?.value;
    }

    if (!userId) {
      return null;
    }

    // Fetch user basic data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        level: true,
        streak: true,
      },
    });

    if (!user) {
      return null;
    }

    // Fetch all categories from DB or fallback to standard MTLE subjects
    let dbCategories: { id: string; name: string }[] = [];
    try {
      if (typeof (prisma as any).subject?.findMany === 'function') {
        dbCategories = await (prisma as any).subject.findMany({
          select: { id: true, name: true },
          orderBy: { createdAt: 'asc' },
        });
      }
    } catch (e) {
      console.warn('Failed to fetch subjects, using standard MTLE list', e);
    }

    const categoryNames = dbCategories.length > 0
      ? Array.from(new Set(dbCategories.map(c => c.name)))
      : STANDARD_MTLE_SUBJECTS;

    const allSubjects = categoryNames;

    // Parallel fetch user activity records
    const [lessonCompletions, examResults, questionAttempts] = await Promise.all([
      prisma.lessonCompletion.findMany({
        where: { userId, status: 'completed' },
        select: { subject: true, lessonId: true },
      }),
      prisma.examResult.findMany({
        where: { userId },
        select: { subject: true, score: true, total: true, accuracy: true, timestamp: true },
      }),
      (prisma as any).userQuestionAttempt.findMany({
        where: { userId },
        select: { attempts: true, correct: true, questionId: true },
      }),
    ]);

    const totalQuestionsAttempted = questionAttempts.reduce((acc: number, curr: any) => acc + (curr.attempts || 0), 0);
    const totalExamsTaken = examResults.length;

    // Build subject-level scores
    const evaluatedSubjectMap = new Map<string, MtleSubjectScore>();

    for (const rawSubject of allSubjects) {
      const { canonicalName, weight, shortName } = normalizeMtleSubject(rawSubject);

      // If we already processed this canonical subject, skip duplicate mapping
      if (evaluatedSubjectMap.has(canonicalName)) {
        continue;
      }

      // 1. Lesson Completion
      const lessons = await getCurriculumLessonsForSubject(canonicalName);
      const totalLessons = Math.max(1, lessons.length);
      const userCompletedCount = lessonCompletions.filter(l => {
        const norm = normalizeMtleSubject(l.subject);
        return norm.canonicalName === canonicalName;
      }).length;
      const lessonCompletion = Math.min(100, Math.round((userCompletedCount / totalLessons) * 100));

      // 2. Exam & Boss Battle Accuracy
      const relevantExams = examResults.filter(e => {
        if (!e.subject) return false;
        const norm = normalizeMtleSubject(e.subject);
        return norm.canonicalName === canonicalName;
      });
      let examScore = 0;
      if (relevantExams.length > 0) {
        const sumAcc = relevantExams.reduce((s, e) => s + (e.accuracy || 0), 0);
        examScore = Math.round(sumAcc / relevantExams.length);
      }

      // 3. Spaced Repetition / Question Attempt Mastery
      let masteryScore = 0;
      let subjectQuestionAttempts = 0;
      if (relevantExams.length > 0) {
        subjectQuestionAttempts = relevantExams.reduce((s, e) => s + (e.total || 10), 0);
      }

      if (examScore > 0) {
        masteryScore = examScore;
      } else if (lessonCompletion > 0) {
        masteryScore = lessonCompletion * 0.7;
      }

      // 4. Blended Subject Score Calculation
      let finalSubjectScore = 0;
      if (relevantExams.length > 0) {
        finalSubjectScore = (examScore * 0.50) + (masteryScore * 0.30) + (lessonCompletion * 0.20);
      } else if (lessonCompletion > 0) {
        finalSubjectScore = (lessonCompletion * 0.60) + (masteryScore * 0.40);
      } else {
        finalSubjectScore = 0;
      }

      finalSubjectScore = Math.round(Math.min(100, Math.max(0, finalSubjectScore)) * 10) / 10;

      let status: 'Critical' | 'Warning' | 'Passing' | 'Mastered' = 'Critical';
      if (finalSubjectScore >= 90) status = 'Mastered';
      else if (finalSubjectScore >= 75) status = 'Passing';
      else if (finalSubjectScore >= 50) status = 'Warning';
      else status = 'Critical';

      evaluatedSubjectMap.set(canonicalName, {
        subject: canonicalName,
        shortName,
        weight,
        score: finalSubjectScore,
        lessonCompletion,
        masteryScore: Math.round(masteryScore),
        examScore,
        questionsAttempted: subjectQuestionAttempts,
        status,
      });
    }

    // Build final subjects list dynamically based ONLY on active database categories (or fallback list)
    const finalSubjectsList: MtleSubjectScore[] = [];
    let totalWeight = 0;

    for (const std of categoryNames) {
      const { canonicalName, weight, shortName } = normalizeMtleSubject(std);
      if (evaluatedSubjectMap.has(canonicalName)) {
        const item = evaluatedSubjectMap.get(canonicalName)!;
        finalSubjectsList.push(item);
        totalWeight += item.weight;
      } else {
        const placeholder: MtleSubjectScore = {
          subject: canonicalName,
          shortName,
          weight,
          score: 0,
          lessonCompletion: 0,
          masteryScore: 0,
          examScore: 0,
          questionsAttempted: 0,
          status: 'Critical',
        };
        finalSubjectsList.push(placeholder);
        totalWeight += weight;
      }
    }

    // Calculate General Weighted Average (GWA)
    let rawGwa = finalSubjectsList.reduce((sum, s) => sum + s.score * s.weight, 0);
    if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.01) {
      // Normalize if weights don't sum to exactly 1.0
      rawGwa = rawGwa / totalWeight;
    }
    const predictedGwa = Math.round(rawGwa * 100) / 100;

    // PRC Status Evaluation
    const { prcStatus, statusTitle, statusDescription, tierInfo } = evaluatePrcStatus(
      predictedGwa,
      finalSubjectsList.map(s => ({ subject: s.subject, score: s.score, weight: s.weight }))
    );

    // Confidence Calculation
    const { confidenceScore, confidenceRating } = calculateConfidenceScore(
      totalQuestionsAttempted,
      totalExamsTaken
    );

    // Remediation Advice
    const remediationAdvice = generateRemediationAdvice(finalSubjectsList, predictedGwa);

    // Strongest and Weakest Subjects
    const sortedByScore = [...finalSubjectsList].sort((a, b) => b.score - a.score);
    const strongestSubject = sortedByScore[0] || null;
    const weakestSubject = sortedByScore[sortedByScore.length - 1] || null;

    const criticalSubjects = finalSubjectsList.filter(s => s.score < 50);
    const failedSubjects = finalSubjectsList.filter(s => s.score < 75);
    const belowCutoffWeightSum = criticalSubjects.reduce((acc, s) => acc + s.weight, 0);
    const failingWeightSum = failedSubjects.reduce((acc, s) => acc + s.weight, 0);

    return {
      predictedGwa,
      prcStatus,
      statusTitle,
      statusDescription,
      tierInfo,
      confidenceScore,
      confidenceRating,
      totalQuestionsAttempted,
      totalExamsTaken,
      failedSubjectsCount: failedSubjects.length,
      criticalSubjectsCount: criticalSubjects.length,
      failingWeightSum,
      belowCutoffWeightSum,
      subjects: finalSubjectsList,
      strongestSubject,
      weakestSubject,
      remediationAdvice,
    };
  } catch (error) {
    console.error('Failed to get MTLE readiness data:', error);
    return null;
  }
}

export interface AdminStudentMtleSummary {
  userId: string;
  name: string;
  email?: string;
  predictedGwa: number;
  prcStatus: 'PASSED' | 'CONDITIONAL' | 'FAILED';
  statusTitle: string;
  tierBadge: string;
  confidenceRating: string;
  totalQuestionsAttempted: number;
  criticalSubjectsCount: number;
  subjects: {
    subject: string;
    shortName: string;
    score: number;
    weight: number;
    weightedPoints: number;
    lessonCompletion: number;
    masteryScore: number;
    isCritical: boolean;
    isPassing: boolean;
  }[];
}

/**
 * Server Action for Admin / Faculty Portal:
 * Fetches the live MTLE Readiness, Predicted GWA, and Statutory Weighted Points for all students (or a specific list).
 */
export async function getAdminCohortMtleSummaryAction(limit = 100): Promise<AdminStudentMtleSummary[]> {
  try {
    const users = await prisma.user.findMany({
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const readinessList = await Promise.all(
      users.map(student => getMtleReadinessData(student.id))
    );

    const summaries: AdminStudentMtleSummary[] = [];

    for (let i = 0; i < users.length; i++) {
      const student = users[i];
      const readiness = readinessList[i];
      if (!readiness) continue;

      summaries.push({
        userId: student.id,
        name: student.name || 'Anonymous Student',
        email: student.email,
        predictedGwa: readiness.predictedGwa,
        prcStatus: readiness.prcStatus,
        statusTitle: readiness.statusTitle,
        tierBadge: readiness.tierInfo.badge,
        confidenceRating: readiness.confidenceRating,
        totalQuestionsAttempted: readiness.totalQuestionsAttempted,
        criticalSubjectsCount: readiness.criticalSubjectsCount,
        subjects: readiness.subjects.map(s => ({
          subject: s.subject,
          shortName: s.shortName,
          score: s.score,
          weight: s.weight,
          weightedPoints: Math.round((s.score * s.weight) * 100) / 100,
          lessonCompletion: s.lessonCompletion,
          masteryScore: s.masteryScore,
          isCritical: s.score < 50,
          isPassing: s.score >= 75,
        })),
      });
    }

    return summaries;
  } catch (error) {
    console.error('Failed to fetch admin cohort MTLE summary:', error);
    return [];
  }
}

