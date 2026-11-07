import type { SubjectAccuracyHistoryItem } from '@/app/actions/study';

export type { SubjectAccuracyHistoryItem };

export interface SubjectMasteryItem {
  subject: string;
  shortName: string;
  radarLabel: string;
  completion: number;
  mastery: number;
  status: 'Not Started' | 'In Training' | 'Proficient' | 'Mastered' | 'Needs Focus' | string;
  points: number;
  topicCoverage?: number;
  passingTopics?: number;
  totalTopics?: number;
  totalQuestionsAnswered?: number;
  totalCorrect?: number;
  totalAvailableQuestions?: number;
  volumeBenchmark?: number;
}

export interface RadarDataPoint {
  subject: string;
  mastery: number;
  fullMark: number;
}

export interface NextObjective {
  id?: string;
  subject: string;
  endDate?: string | Date;
  targetDate?: string | Date;
  createdAt?: string | Date;
  [key: string]: any;
}

export interface PerformanceSummaryStats {
  avgMasteryNum: number;
  avgCompletion: number;
  masteredCount: number;
  totalEarnedPoints: number;
  totalQuestionsAttempted: number;
}

