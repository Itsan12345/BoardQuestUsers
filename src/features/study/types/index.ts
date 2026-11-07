import type { SubjectMetrics, LearningModuleData } from '@/app/actions/study';
import type { CalendarEventData, StudyPlanRecord } from '@/app/actions/study-plan';

export type { SubjectMetrics, LearningModuleData, CalendarEventData, StudyPlanRecord };

export interface CurriculumLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  fileUrls: string[];
  order: number;
  isDynamic: boolean;
  status: string;
}

export interface CurriculumCategory {
  id: string;
  title: string;
  icon: any;
  adminModuleCount: number;
  hasUploadedModules: boolean;
  lessons: CurriculumLesson[];
}

