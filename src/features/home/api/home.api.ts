import { getUserStats, getLeaderboard, generateDailyMissions, getUserSettingsAction } from '@/app/actions/user';
import { getStudyPlans } from '@/app/actions/study-plan';
import { getStudentGuidanceAssignmentsAction } from '@/app/actions/guidance';
import { recordDailyLoginAction, getDailyLoginStatusAction } from '@/app/actions/daily-login';
import { getUserLessonCompletions, getCategories, getLearningModules } from '@/app/actions/study';

export async function fetchHomeInitialData() {
  const [
    stats,
    leadersData,
    plans,
    missions,
    settings,
    guidanceRes,
    loginRecordRes,
    completionsMap,
    dbCategories,
    dbModules,
  ] = await Promise.all([
    getUserStats(),
    getLeaderboard(),
    getStudyPlans(),
    generateDailyMissions(),
    getUserSettingsAction().catch(() => null),
    getStudentGuidanceAssignmentsAction().catch(() => ({ success: false, data: [] })),
    recordDailyLoginAction().catch(() => ({ success: false, isLoggedIn: false, status: undefined })),
    getUserLessonCompletions().catch(() => ({})),
    getCategories().catch(() => []),
    getLearningModules().catch(() => []),
  ]);

  return {
    stats,
    leadersData,
    plans: plans || [],
    missions,
    settings,
    guidanceList: guidanceRes?.success && guidanceRes.data ? guidanceRes.data : [],
    loginRecordRes,
    completionsMap: completionsMap || {},
    dbCategories: dbCategories || [],
    dbModules: dbModules || [],
  };
}

export async function fetchDailyLoginStatusSafe() {
  return getDailyLoginStatusAction().catch(() => null);
}

export async function fetchUserSettingsSafe() {
  return getUserSettingsAction().catch(() => null);
}

