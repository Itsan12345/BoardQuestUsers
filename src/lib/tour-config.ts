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
          description: 'Jump between your Study Subjects, Quest Arena, Global Leaderboard, and Performance Analytics anytime.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  study: {
    key: 'study',
    name: 'Study Subjects Guide',
    path: '/study',
    steps: [
      {
        element: '#tour-study-header',
        popover: {
          title: '📚 Board Subjects',
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
          title: '📅 Faculty Clearance Cutoff',
          description: 'The institutional cutoff date that serves as the final gateway where faculty determines if you have achieved the required Board Readiness and are fully cleared to take the actual licensure examination.',
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

  settings_profile: {
    key: 'settings_profile',
    name: 'Profile & Academic Credentials',
    path: '#settings-profile',
    steps: [
      {
        element: '#tour-profile-identity',
        popover: {
          title: '🎖️ Aspirant Identity & Status',
          description: 'Your level tier, class batch, and verified candidate status on BoardQuest.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-profile-academic',
        popover: {
          title: '🏛️ Academic Institution & Hub',
          description: 'Set your full name, registered email, university / review center, and regional exam testing hub.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-profile-target-exam',
        popover: {
          title: '🎯 Target MTLE Board Schedule',
          description: 'The official PRC Licensure Examination date you are targeting. This sets your countdown clock and guides your review pacing toward the actual examination day.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-profile-save',
        popover: {
          title: '💾 Save Profile Details',
          description: 'Saves your academic identity and synchronizes it across all leaderboards and certificates.',
          side: 'top',
          align: 'end',
        },
      },
    ],
  },

  settings_goals: {
    key: 'settings_goals',
    name: 'Study Goals & Targets',
    path: '#settings-goals',
    steps: [
      {
        element: '#tour-goals-quota',
        popover: {
          title: '🎯 Daily Question Target',
          description: 'Choose your daily quota (20, 50, 100, or 150 questions) to maintain your review streak and earn bonus EXP.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-goals-focus',
        popover: {
          title: '🔬 Priority Focus Subject',
          description: 'Designate the laboratory subject you want prioritized in your daily curriculum.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-goals-diff',
        popover: {
          title: '⚔️ Default Quiz Difficulty',
          description: 'Set your baseline combat challenge: Easy (0.85x), Standard (1.0x), or Hardcore Examiner (1.25x).',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-goals-confidence',
        popover: {
          title: '⚡ Confidence Rating Prompts',
          description: 'Evaluate your confidence (Shaky, Steady, Unyielding) per question to unlock bonus XP multipliers.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-goals-save',
        popover: {
          title: '💾 Save Study Preferences',
          description: 'Applies your daily targets and difficulty parameters to all quiz arenas.',
          side: 'top',
          align: 'end',
        },
      },
    ],
  },

  settings_audio: {
    key: 'settings_audio',
    name: 'Audio & RPG Combat Effects',
    path: '#settings-audio',
    steps: [
      {
        element: '#tour-audio-sfx',
        popover: {
          title: '🔊 Sound Effects (SFX) Volume',
          description: 'Control the master volume for button clicks, attack strikes, and quiz audio feedback.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-audio-music',
        popover: {
          title: '🎵 Background Ambient Music',
          description: 'Toggle atmospheric retro background tracks during study sessions and dungeon quests.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-audio-combat',
        popover: {
          title: '💥 Visual Damage FX & Screen Flash',
          description: 'Toggle floating combat damage numbers and red screen flash pulses when taking monster damage.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-audio-save',
        popover: {
          title: '💾 Save Audio Preferences',
          description: 'Applies your sound preferences immediately to the audio manager.',
          side: 'top',
          align: 'end',
        },
      },
    ],
  },

  settings_alerts: {
    key: 'settings_alerts',
    name: 'Notification & Streak Alerts',
    path: '#settings-alerts',
    steps: [
      {
        element: '#tour-alerts-streak',
        popover: {
          title: '🔥 Daily Streak Protection Alert',
          description: 'Receive an 8:00 PM reminder if you have not completed your daily review so your streak is never lost.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-alerts-countdown',
        popover: {
          title: '⏳ MTLE Board Exam Countdown',
          description: 'Get weekly milestone countdown alerts leading up to your target board examination date.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-alerts-milestones',
        popover: {
          title: '🏅 Badge & Level-Up Alerts',
          description: 'Instant notifications whenever you unlock rare achievement badges or reach new level tiers.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-alerts-save',
        popover: {
          title: '💾 Save Alert Preferences',
          description: 'Updates your notification channels and alert triggers.',
          side: 'top',
          align: 'end',
        },
      },
    ],
  },

  settings_security: {
    key: 'settings_security',
    name: 'Security & Password Credentials',
    path: '#settings-security',
    steps: [
      {
        element: '#tour-security-password',
        popover: {
          title: '🔑 Update Account Password',
          description: 'Change your login password with real-time password strength evaluation.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-security-session',
        popover: {
          title: '🛡️ Active Session & TLS Security',
          description: 'View your current encrypted web session and authentication status.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-security-save',
        popover: {
          title: '💾 Update Password',
          description: 'Securely hashes and updates your credentials in MongoDB.',
          side: 'top',
          align: 'end',
        },
      },
    ],
  },

  settings_records: {
    key: 'settings_records',
    name: 'Diagnostic Records & Study Transcript',
    path: '#settings-records',
    steps: [
      {
        element: '#tour-records-export',
        popover: {
          title: '📄 Certified Study Transcript Export',
          description: 'Download a complete structured JSON record of your quiz attempts, subject mastery levels, and exam history.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-records-mentor',
        popover: {
          title: '🎓 Academic Mentor Verification',
          description: 'Official transcripts can be shared with review center professors and mentors to verify exam readiness.',
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

export function startTourByKey(tourKey: string, force: boolean = false): boolean {
  if (typeof window === 'undefined') return false;

  const config = TOUR_CONFIGS[tourKey];
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

      // If targeting sidebar nav on mobile, adapt to mobile menu trigger if available
      if (targetSelector === '#tour-sidebar-nav' && isMobile) {
        const mobileTriggerEl = document.querySelector('#tour-mobile-nav-trigger');
        if (mobileTriggerEl) {
          targetSelector = '#tour-mobile-nav-trigger';
          targetPopover = {
            title: '🧭 Mobile Navigation',
            description: 'Tap the menu to jump between your Study Subjects, Quest Arena, Leaderboard, and Profile anytime.',
            side: 'bottom',
            align: 'start',
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

  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const overlayColor = isDarkMode ? 'rgba(0, 0, 0, 0.55)' : 'rgba(15, 23, 42, 0.35)';

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: overlayColor,
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

export function startTourForPage(pathname: string, force: boolean = false): boolean {
  const config = getPageTourConfig(pathname);
  if (!config) return false;
  return startTourByKey(config.key, force);
}
