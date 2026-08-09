"use client";

export type NotificationType = 'streak_warning' | 'daily_goal' | 'milestone' | 'achievement';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  link?: string;
  actionLabel?: string;
  isUrgent?: boolean;
  read?: boolean;
}

export function getHoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
}

export function generateDynamicNotifications(user: any): AppNotification[] {
  if (typeof window === 'undefined') return [];

  const notifications: AppNotification[] = [];
  const readIds: string[] = [];

  try {
    const savedRead = localStorage.getItem('bq_read_notifications');
    if (savedRead) {
      readIds.push(...JSON.parse(savedRead));
    }
  } catch (e) {}

  const streakAlertsEnabled = localStorage.getItem('bq_pref_streak_alerts') !== 'false';
  const countdownAlertsEnabled = localStorage.getItem('bq_pref_countdown_alerts') !== 'false';
  const dailyQuota = parseInt(localStorage.getItem('bq_pref_daily_quota') || '50', 10);
  const todayQuestions = user?.todayQuestions || 0;
  const userStreak = user?.streak || 0;
  const hoursLeft = getHoursUntilMidnight();

  // 1. 🔥 Daily Streak Protection Alert (Only if streak exists AND user hasn't played today)
  if (streakAlertsEnabled && userStreak > 0 && todayQuestions === 0) {
    const streakId = `streak_warning_${new Date().toISOString().slice(0, 10)}`;
    notifications.push({
      id: streakId,
      type: 'streak_warning',
      title: '🔥 Daily Streak at Risk!',
      message: `Your active ${userStreak}-day streak will reset in ${hoursLeft} hours! Complete a review quest now to protect it.`,
      timestamp: `Resets in ${hoursLeft}h`,
      link: '/quest',
      actionLabel: 'Save Streak',
      isUrgent: true,
      read: readIds.includes(streakId),
    });
  }

  // 2. 🎯 Daily Question Target Progress or Achievement
  if (todayQuestions >= dailyQuota) {
    const goalId = `daily_goal_achieved_${new Date().toISOString().slice(0, 10)}`;
    notifications.push({
      id: goalId,
      type: 'daily_goal',
      title: '🎉 Daily Target Achieved!',
      message: `You completed ${todayQuestions}/${dailyQuota} questions today! Your active study streak is protected.`,
      timestamp: 'Today',
      link: '/quest',
      actionLabel: 'Keep Pushing',
      isUrgent: false,
      read: readIds.includes(goalId),
    });
  } else {
    const goalId = `daily_goal_progress_${new Date().toISOString().slice(0, 10)}`;
    const remaining = dailyQuota - todayQuestions;
    notifications.push({
      id: goalId,
      type: 'daily_goal',
      title: '🎯 Daily Target Progress',
      message: `You completed ${todayQuestions}/${dailyQuota} questions today. ${remaining} more to achieve your daily target!`,
      timestamp: 'Today',
      link: '/quest',
      actionLabel: 'Continue Quest',
      isUrgent: false,
      read: readIds.includes(goalId),
    });
  }

  // 3. 📅 Target MTLE Milestone Alert
  if (countdownAlertsEnabled) {
    const targetBatch = localStorage.getItem('bq_pref_target_batch') || 'August 2025 MTLE';
    const milestoneId = `milestone_${targetBatch.replace(/\s+/g, '_')}`;
    notifications.push({
      id: milestoneId,
      type: 'milestone',
      title: '📅 Board Exam Preparation',
      message: `Target Season: ${targetBatch}. Maintain consistent daily quest practice for optimal recall.`,
      timestamp: 'Active Milestone',
      link: '/study',
      actionLabel: 'View Curriculum',
      isUrgent: false,
      read: readIds.includes(milestoneId),
    });
  }

  // 4. 🏆 Badge & Level-Up Achievement Alert
  const achievementAlertsEnabled = localStorage.getItem('bq_pref_achievement_alerts') !== 'false';
  if (achievementAlertsEnabled && user?.achievements && user.achievements.length > 0) {
    const latest = user.achievements[0];
    const achieveId = `achieve_${latest.id || latest.task}`;
    notifications.push({
      id: achieveId,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      message: `You unlocked "${latest.task || latest.badge || 'Aspirant Milestone'}" (+${latest.xp || 50} XP)!`,
      timestamp: 'Recent Milestone',
      link: '/profile',
      actionLabel: 'View Badges',
      isUrgent: false,
      read: readIds.includes(achieveId),
    });
  }

  // Sort urgent first, then unread first
  return notifications.sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    if (!a.read && b.read) return -1;
    if (a.read && !b.read) return 1;
    return 0;
  });
}

export function markNotificationAsRead(id: string) {
  try {
    const saved = localStorage.getItem('bq_read_notifications');
    const readIds: string[] = saved ? JSON.parse(saved) : [];
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('bq_read_notifications', JSON.stringify(readIds));
    }
  } catch (e) {}
}

export function markAllNotificationsAsRead(notifications: AppNotification[]) {
  try {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('bq_read_notifications', JSON.stringify(allIds));
  } catch (e) {}
}
