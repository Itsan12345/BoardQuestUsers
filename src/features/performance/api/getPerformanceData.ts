import { getUserStats, getUserSettingsAction } from '@/app/actions/user';
import { getStudyPlans } from '@/app/actions/study-plan';
import {
  getSubjectMetrics,
  getCategories,
  getSubjectPerformanceHistoryAction,
} from '@/app/actions/study';

export async function fetchPerformanceInitialData() {
  const [stats, plans, metrics, dbCategories, historyData, settings] = await Promise.all([
    getUserStats().catch(() => null),
    getStudyPlans().catch(() => []),
    getSubjectMetrics().catch(() => []),
    getCategories().catch(() => []),
    getSubjectPerformanceHistoryAction().catch(() => []),
    getUserSettingsAction().catch(() => null),
  ]);

  return {
    stats,
    plans: plans || [],
    metrics: metrics || [],
    dbCategories: dbCategories || [],
    historyData: historyData || [],
    settings,
  };
}

export async function fetchPerformanceRefreshedData() {
  const [metrics, historyData, settings] = await Promise.all([
    getSubjectMetrics().catch(() => []),
    getSubjectPerformanceHistoryAction().catch(() => []),
    getUserSettingsAction().catch(() => null),
  ]);

  return {
    metrics: metrics || [],
    historyData: historyData || [],
    settings,
  };
}

export async function fetchUserSettingsActionSafe() {
  return getUserSettingsAction().catch(() => null);
}

export async function fetchUserStatsActionSafe() {
  return getUserStats().catch(() => null);
}

