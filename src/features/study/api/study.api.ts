import {
  getSubjectMetrics,
  getCategories,
  getLearningModules,
  updateLessonStatus,
  getUserLessonCompletions,
} from '@/app/actions/study';
import { getStudyPlans, getGameDeadlineEvent } from '@/app/actions/study-plan';
import { getUserSettingsAction } from '@/app/actions/user';

export async function fetchStudyInitialData() {
  const [
    dbCategories,
    dbModules,
    plans,
    metrics,
    programData,
    lessonCompletionsMap,
    userSettings,
  ] = await Promise.all([
    getCategories().catch(() => []),
    getLearningModules().catch(() => []),
    getStudyPlans().catch(() => []),
    getSubjectMetrics().catch(() => []),
    getGameDeadlineEvent().catch(() => null),
    getUserLessonCompletions().catch(() => ({})),
    getUserSettingsAction().catch(() => null),
  ]);

  return {
    dbCategories: dbCategories || [],
    dbModules: dbModules || [],
    plans: plans || [],
    metrics: metrics || [],
    programData,
    lessonCompletionsMap: lessonCompletionsMap || {},
    userSettings,
  };
}

export async function refreshStudyMetrics() {
  return getSubjectMetrics().catch(() => []);
}

export async function updateLessonStatusAction(
  subject: string,
  lessonId: string,
  status: string
) {
  return updateLessonStatus(subject, lessonId, status);
}

export async function refreshStudyPlansAction() {
  return getStudyPlans().catch(() => []);
}

