export interface DailyRewardTier {
  day: number;
  xp: number;
  title: string;
  subtitle: string;
  badge?: string;
  isMilestone: boolean;
  highlightColor?: string;
}

export const DAILY_LOGIN_REWARDS: DailyRewardTier[] = [
  {
    day: 1,
    xp: 50,
    title: "Day 1",
    subtitle: "Daily Check-in Kickoff",
    isMilestone: false,
    highlightColor: "text-blue-500",
  },
  {
    day: 2,
    xp: 75,
    title: "Day 2",
    subtitle: "Building Momentum",
    isMilestone: false,
    highlightColor: "text-cyan-500",
  },
  {
    day: 3,
    xp: 100,
    title: "Day 3",
    subtitle: "Cognitive Focus",
    isMilestone: false,
    highlightColor: "text-emerald-500",
  },
  {
    day: 4,
    xp: 150,
    title: "Day 4",
    subtitle: "Mid-Week Fortitude",
    isMilestone: false,
    highlightColor: "text-indigo-500",
  },
  {
    day: 5,
    xp: 200,
    title: "Day 5",
    subtitle: "Mastery Acceleration",
    isMilestone: false,
    highlightColor: "text-amber-500",
  },
  {
    day: 6,
    xp: 300,
    title: "Day 6",
    subtitle: "Licensure Discipline",
    isMilestone: false,
    highlightColor: "text-orange-500",
  },
  {
    day: 7,
    xp: 500,
    title: "Day 7",
    subtitle: "Dean's Distinction Chest",
    badge: "7-Day Champion",
    isMilestone: true,
    highlightColor: "text-primary",
  },
];

export interface DailyLoginStatusData {
  success: boolean;
  isLoggedIn: boolean;
  todayDate: string;
  currentStreak: number;
  highestStreak: number;
  totalLogins: number;
  hasLoggedInToday: boolean;
  hasClaimedToday: boolean;
  currentCycleDay: number; // 1 to 7
  todayReward: DailyRewardTier;
  cycleRewards: Array<DailyRewardTier & {
    status: 'claimed' | 'available' | 'locked';
    isToday: boolean;
  }>;
  lastLoginAt?: string;
  nextResetIso: string;
}

/**
 * Returns YYYY-MM-DD in user's local timezone (or current system date)
 */
export function getLocalTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes the 1-7 cycle index based on streak
 */
export function calculateCycleDay(streak: number): number {
  if (streak <= 0) return 1;
  const mod = streak % 7;
  return mod === 0 ? 7 : mod;
}

/**
 * Returns streak tier title & description for motivation
 */
export function getStreakTierInfo(streak: number): {
  tierName: string;
  badgeColor: string;
  motivation: string;
} {
  if (streak >= 30) {
    return {
      tierName: "Board Legend",
      badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      motivation: "Unstoppable dedication! You're in the top 1% of MTLE board exam preppers.",
    };
  }
  if (streak >= 14) {
    return {
      tierName: "Dean's Scholar",
      badgeColor: "bg-primary/15 text-primary border-primary/30",
      motivation: "Exceptional consistency! Your daily knowledge retention is compounding rapidly.",
    };
  }
  if (streak >= 7) {
    return {
      tierName: "Elite Candidate",
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      motivation: "Full week conquered! Maintain this momentum to master every medical subject.",
    };
  }
  if (streak >= 3) {
    return {
      tierName: "Active Scholar",
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      motivation: "Great daily habit! Keep logging in daily to unlock larger XP multipliers.",
    };
  }
  return {
    tierName: "Novice Reviewee",
    badgeColor: "bg-muted text-muted-foreground border-border",
    motivation: "Start your daily review journey today and build an unbeatable streak!",
  };
}
