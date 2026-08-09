import { driver, DriveStep } from 'driver.js';

export interface PageTourConfig {
  key: string;
  name: string;
  path: string;
  steps: DriveStep[];
}

export const TOUR_CONFIGS: Record<string, PageTourConfig> = {
  dashboard: {
    key: 'dashboard',
    name: 'Dashboard Overview',
    path: '/',
    steps: [
      {
        element: '#tour-dashboard-hero',
        popover: {
          title: '⚔️ Welcome to BoardQuest',
          description: 'Your gamified MedTech board review command center. Launch quests, complete daily missions, and level up your mastery.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-dashboard-studyplan',
        popover: {
          title: '🎯 Study Plan & Targets',
          description: 'Keep track of your faculty deadline and milestone countdowns across all laboratory science subjects.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-dashboard-dailygoal',
        popover: {
          title: '🔥 Daily Goals & Missions',
          description: 'Complete your daily question quota to build study streaks and earn bonus EXP rewards.',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: '#tour-sidebar-nav',
        popover: {
          title: '🧭 Seamless Navigation',
          description: 'Jump between your Study Curriculum, Quest Arena, Global Leaderboard, and Performance Analytics anytime.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  study: {
    key: 'study',
    name: 'Study Curriculum Guide',
    path: '/study',
    steps: [
      {
        element: '#tour-study-header',
        popover: {
          title: '📚 Board Curriculum',
          description: 'Browse comprehensive review decks structured according to the official MedTech Licensure Examination syllabus.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-study-subjects',
        popover: {
          title: '🧪 Core Laboratory Subjects',
          description: 'Access Clinical Chemistry, Hematology, Microbiology, Immunohematology, Microscopy, and Histopath/MT Laws.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-study-metrics',
        popover: {
          title: '📊 Subject Mastery Breakdown',
          description: 'Monitor your real-time accuracy and lesson completion status for each discipline.',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: '#tour-study-program',
        popover: {
          title: '📅 Review Center Sync',
          description: 'Configure your enrolled review center schedule and customize your target exam deadlines.',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },

  quest: {
    key: 'quest',
    name: 'Quest Arena Guide',
    path: '/quest',
    steps: [
      {
        element: '#tour-quest-header',
        popover: {
          title: '⚔️ Quest Arena Expeditions',
          description: 'Challenge gamified quiz stages, fight subject bosses, and climb from Novice to Grandmaster.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-quest-map',
        popover: {
          title: '🗺️ Interactive World Map',
          description: 'Traverse subject chapters and battle stages. Clear nodes to earn stars, unlock badges, and earn reagents.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-quest-inventory',
        popover: {
          title: '🧪 Reagents & Power-ups',
          description: 'Use laboratory reagents and consumable buffs to boost your EXP or protect your health during tough boss encounters.',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },

  ranks: {
    key: 'ranks',
    name: 'Global Hall of Fame',
    path: '/ranks',
    steps: [
      {
        element: '#tour-ranks-overview',
        popover: {
          title: '🏆 Rank Standings',
          description: 'See your current Aspirant Level, Total EXP, and how you stack up against other Medical Technology candidates.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-ranks-table',
        popover: {
          title: '🥇 Global Leaderboard',
          description: 'Real-time ranking of top performers nationwide. Earn high quiz scores to secure your spot at the top podium!',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },

  performance: {
    key: 'performance',
    name: 'Performance Mastery Analytics',
    path: '/performance',
    steps: [
      {
        element: '#tour-perf-overview',
        popover: {
          title: '📈 Performance Command Center',
          description: 'Detailed analytics on your board exam readiness, overall accuracy, and questions mastered.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-perf-radar',
        popover: {
          title: '🕸️ Subject Mastery Radar',
          description: 'Identify your strongest subjects and pinpoint weak areas that need more practice before the board exam.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-perf-subjects',
        popover: {
          title: '🔍 Granular Subject Health',
          description: 'Review mastery levels, questions attempted, and recommended study focus per subject.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  profile: {
    key: 'profile',
    name: 'Aspirant Profile & Achievements',
    path: '/profile',
    steps: [
      {
        element: '#tour-profile-card',
        popover: {
          title: '🎖️ Aspirant Identity',
          description: 'Your level tier, avatar, EXP progress to next level, and account details.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-profile-stats',
        popover: {
          title: '📊 Tactical Combat Stats',
          description: 'Review your total quizzes answered, highest streaks, and exam battle history.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-profile-badges',
        popover: {
          title: '🏅 Badges & Trophies',
          description: 'Unlock exclusive achievement badges as you hit major review milestones and mastery feats.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },
};

export function getPageTourConfig(pathname: string): PageTourConfig | null {
  if (pathname === '/') return TOUR_CONFIGS.dashboard;
  if (pathname.startsWith('/study')) return TOUR_CONFIGS.study;
  if (pathname.startsWith('/quest')) return TOUR_CONFIGS.quest;
  if (pathname.startsWith('/ranks')) return TOUR_CONFIGS.ranks;
  if (pathname.startsWith('/performance')) return TOUR_CONFIGS.performance;
  if (pathname.startsWith('/profile')) return TOUR_CONFIGS.profile;
  return null;
}

export function isTourCompleted(tourKey: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(`bq_tour_seen_${tourKey}`) === 'true';
  } catch {
    return false;
  }
}

export function markTourCompleted(tourKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`bq_tour_seen_${tourKey}`, 'true');
  } catch { }
}

export function resetAllTours(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(TOUR_CONFIGS).forEach((key) => {
      localStorage.removeItem(`bq_tour_seen_${key}`);
    });
  } catch { }
}

export function startTourForPage(pathname: string, force: boolean = false): boolean {
  if (typeof window === 'undefined') return false;

  const config = getPageTourConfig(pathname);
  if (!config) return false;

  if (!force && isTourCompleted(config.key)) {
    return false;
  }

  const isMobile = window.innerWidth < 1024;

  // Adapt steps for mobile / desktop visibility
  const availableSteps: DriveStep[] = [];

  for (const step of config.steps) {
    if (typeof step.element === 'string') {
      let targetSelector = step.element;
      let targetPopover = { ...step.popover };

      // If targeting sidebar nav on mobile, adapt to bottom nav if available
      if (targetSelector === '#tour-sidebar-nav' && isMobile) {
        const bottomNavEl = document.querySelector('#tour-bottom-nav');
        if (bottomNavEl) {
          targetSelector = '#tour-bottom-nav';
          targetPopover = {
            title: '🧭 Mobile Navigation',
            description: 'Tap between Curriculum, Quests, Rankings, and your Profile anytime.',
            side: 'top',
            align: 'center',
          };
        }
      }

      const el = document.querySelector(targetSelector) as HTMLElement | null;
      if (el && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)) {
        availableSteps.push({
          ...step,
          element: targetSelector,
          popover: targetPopover,
        });
      }
    } else {
      availableSteps.push(step);
    }
  }

  if (availableSteps.length === 0) return false;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(10, 15, 29, 0.78)',
    stagePadding: isMobile ? 4 : 8,
    stageRadius: isMobile ? 12 : 16,
    popoverClass: 'bq-tour-popover',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Got it! ✨',
    progressText: '{{current}} of {{total}}',
    steps: availableSteps,
    onDestroyStarted: () => {
      markTourCompleted(config.key);
      driverObj.destroy();
    },
  });

  driverObj.drive();
  return true;
}
