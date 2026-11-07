import { SUBJECT_AREAS, normalizeSubjectName } from '@/lib/game-logic';
import { differenceInDays } from 'date-fns';
import type {
  SubjectMasteryItem,
  RadarDataPoint,
  SubjectAccuracyHistoryItem,
  PerformanceSummaryStats,
  NextObjective
} from '../types';

export const RADAR_LABELS: Record<string, string> = {
  "Clinical Chemistry": "Chemistry",
  "Hematology": "Hematology",
  "Microbiology": "Microbiology",
  "Immunology & Serology and Immunohematology": "Immunochem",
  "Clinical Microscopy & Parasitology": "Microscopy",
  "Histopathology & MT Laws": "Histopath",
  "Histopathology and Medtech Laws": "Histopath"
};

/**
 * Builds the comprehensive mastery data for active subject categories
 */
export function calculateFullMastery(
  categories: string[],
  subjectMetrics: any[]
): SubjectMasteryItem[] {
  const activeCategories = categories.length > 0
    ? categories
    : (subjectMetrics.length > 0 ? subjectMetrics.map((m: any) => m.subject) : SUBJECT_AREAS);

  return activeCategories.map((subjectName) => {
    const normTarget = subjectName.trim().toLowerCase();
    const normCanonical = normalizeSubjectName(subjectName).toLowerCase();
    const metrics = subjectMetrics.find((m: any) => m.subject?.trim().toLowerCase() === normTarget)
      || subjectMetrics.find((m: any) => (
        m.subject && normalizeSubjectName(m.subject).toLowerCase() === normCanonical
      ));

    const completionVal = metrics?.completion ?? 0;
    const proficiencyVal = (metrics as any)?.proficiency ?? metrics?.mastery ?? 0;
    const totalCorrect = (metrics as any)?.totalCorrect ?? 0;
    const totalQAnswered = (metrics as any)?.totalQuestionsAnswered ?? 0;

    const topicCoverage = (metrics as any)?.topicCoverage ?? 0;
    const passingTopics = (metrics as any)?.passingTopics ?? 0;
    const totalTopics = (metrics as any)?.totalTopics ?? 0;
    const meetsProficientTopicCoverage = totalTopics > 0 ? topicCoverage >= 75 : true;
    const meetsMasteredTopicCoverage = totalTopics > 0 ? topicCoverage >= 85 : true;

    let status: 'Not Started' | 'In Training' | 'Proficient' | 'Mastered' | 'Needs Focus' = 'Not Started';
    if (totalQAnswered === 0 && completionVal === 0) {
      status = "Not Started";
    } else if (proficiencyVal >= 90 && meetsMasteredTopicCoverage && completionVal >= 75) {
      status = "Mastered";
    } else if (proficiencyVal >= 75 && meetsProficientTopicCoverage && completionVal >= 25) {
      status = "Proficient";
    } else if (proficiencyVal >= 50 || completionVal > 0 || totalQAnswered > 0) {
      status = "In Training";
    } else {
      status = "Needs Focus";
    }

    // Subject Points = 12 Pts per 1% Subject Proficiency + 6 Pts per 1% Syllabus Completion
    const points = Math.round(proficiencyVal * 12 + completionVal * 6);

    return {
      subject: subjectName,
      shortName: subjectName.split(' ')[0],
      radarLabel: RADAR_LABELS[subjectName] || (subjectName.length > 12 ? subjectName.split(' ')[0] : subjectName),
      completion: completionVal,
      mastery: proficiencyVal,
      status: metrics?.masteryStatus || status,
      points: points,
      topicCoverage,
      passingTopics,
      totalTopics,
      totalQuestionsAnswered: totalQAnswered,
      totalCorrect: totalCorrect,
      totalAvailableQuestions: (metrics as any)?.totalAvailableQuestions ?? 0,
      volumeBenchmark: (metrics as any)?.volumeBenchmark
    };
  });
}

/**
 * Maps mastery items to Recharts Radar chart dataset
 */
export function calculateRadarData(fullMastery: SubjectMasteryItem[]): RadarDataPoint[] {
  return fullMastery.map((m) => ({
    subject: m.radarLabel,
    mastery: m.mastery,
    fullMark: 100,
  }));
}

/**
 * Computes high-level aggregated summary stats across subjects
 */
export function calculateSummaryStats(
  fullMastery: SubjectMasteryItem[],
  userXp: number = 0,
  performanceHistory: SubjectAccuracyHistoryItem[] = []
): PerformanceSummaryStats {
  const avgMasteryNum = fullMastery.length > 0
    ? (fullMastery.reduce((acc: number, m: any) => acc + m.mastery, 0) / fullMastery.length)
    : 0;

  const avgCompletion = fullMastery.length > 0
    ? (fullMastery.reduce((acc: number, m: any) => acc + m.completion, 0) / fullMastery.length).toFixed(0)
    : "0";

  const masteredCount = fullMastery.filter((m) => m.status === "Mastered").length;

  const totalEarnedPoints = fullMastery.reduce((acc, m) => acc + (m.points || 0), 0) + (userXp || 0);

  const totalQuestionsAttempted = fullMastery.reduce((acc, m) => acc + (m.totalQuestionsAnswered || 0), 0)
    || performanceHistory.reduce((acc, p) => acc + p.totalQuestions, 0)
    || 0;

  return {
    avgMasteryNum,
    avgCompletion: parseFloat(avgCompletion),
    masteredCount,
    totalEarnedPoints,
    totalQuestionsAttempted,
  };
}

/**
 * Finds the earliest upcoming study plan objective
 */
export function findNextObjective(plans: any[]): NextObjective | null {
  if (!plans || plans.length === 0) return null;
  const today = new Date();
  const futurePlans = plans
    .filter((p: any) => new Date(p.endDate || p.targetDate || p.createdAt) >= today)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.endDate || a.targetDate || a.createdAt).getTime();
      const dateB = new Date(b.endDate || b.targetDate || b.createdAt).getTime();
      return dateA - dateB;
    });

  return futurePlans.length > 0 ? futurePlans[0] : null;
}

/**
 * Calculates remaining days until objective deadline
 */
export function calculateDaysRemaining(nextObjective: NextObjective | null): number {
  if (!nextObjective) return 0;
  return differenceInDays(
    new Date(nextObjective.endDate || nextObjective.targetDate || nextObjective.createdAt || new Date()),
    new Date()
  );
}

