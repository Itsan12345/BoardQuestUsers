import { getUserProfile } from '@/app/actions/user';
import { getDailyLoginStatusAction } from '@/app/actions/daily-login';
import { getStudentGuidanceAssignmentsAction } from '@/app/actions/guidance';
import { getUserBadgesAction, getAllMasterBadgesAction } from '@/app/actions/badge';
import type { UserProfile } from '../types';

export async function fetchProfileData() {
  const [profile, guidanceRes, userBadgesRes, masterBadgesRes, dailyStatusRes] = await Promise.all([
    getUserProfile() as Promise<UserProfile | null>,
    getStudentGuidanceAssignmentsAction().catch(() => ({ success: false, data: [] })),
    getUserBadgesAction().catch(() => ({ success: false, data: [] })),
    getAllMasterBadgesAction().catch(() => ({ success: false, data: [] })),
    getDailyLoginStatusAction().catch(() => null),
  ]);

  return {
    profile,
    guidanceList: guidanceRes?.success && guidanceRes.data ? guidanceRes.data : [],
    dbUserBadges: userBadgesRes?.success && userBadgesRes.data ? userBadgesRes.data : [],
    masterBadges: masterBadgesRes?.success && masterBadgesRes.data ? masterBadgesRes.data : [],
    dailyStatus: dailyStatusRes,
  };
}

