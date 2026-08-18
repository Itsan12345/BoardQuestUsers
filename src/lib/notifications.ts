"use client";

export type NotificationType =
  | 'guidance'
  | 'guidance_resolved'
  | 'streak_warning'
  | 'streak_lost'
  | 'daily_goal'
  | 'milestone'
  | 'achievement';

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
  // Guidance counseling metadata
  guidanceId?: string;
  guidanceData?: any;
  advisorName?: string;
  advisorEmail?: string;
  advisorRole?: string;
  subjectCategory?: string;
  guidanceNotes?: string;
  guidanceStatus?: string;
}

export function getHoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
}

export function buildGuidanceNotifications(guidanceList: any[] = []): AppNotification[] {
  if (!Array.isArray(guidanceList)) return [];

  const notifications: AppNotification[] = [];
  const readIds: string[] = [];

  if (typeof window !== 'undefined') {
    try {
      const savedRead = localStorage.getItem('bq_read_notifications');
      if (savedRead) {
        readIds.push(...JSON.parse(savedRead));
      }
    } catch (e) {}
  }

  guidanceList.forEach(item => {
    const isResolved = item.status === 'RESOLVED' || item.status === 'COMPLETED';
    const notifId = `guidance_${item.id}_${item.status}`;
    const advisorName = item.advisor?.name || 'Faculty Advisor';
    const advisorRole = item.advisor?.role || 'Advisor';
    const subject = item.subjectCategory || 'Board Exam Domain';
    const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();

    const formattedTime = (() => {
      try {
        const diffHours = Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.round(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch (e) {
        return 'Recent';
      }
    })();

    if (isResolved) {
      notifications.push({
        id: notifId,
        type: 'guidance_resolved',
        title: `✅ Academic Guidance Completed: ${subject}`,
        message: `Your counseling session with ${advisorName} for ${subject} has been marked as resolved. Keep up the high standard!`,
        timestamp: formattedTime,
        actionLabel: 'View Summary',
        isUrgent: false,
        read: readIds.includes(notifId),
        guidanceId: item.id,
        guidanceData: item,
        advisorName,
        advisorEmail: item.advisor?.email,
        advisorRole,
        subjectCategory: subject,
        guidanceNotes: item.guidanceNotes,
        guidanceStatus: item.status,
      });
    } else {
      const notesSnippet = item.guidanceNotes
        ? ` Action plan: "${item.guidanceNotes.length > 70 ? item.guidanceNotes.slice(0, 67) + '...' : item.guidanceNotes}"`
        : '';

      notifications.push({
        id: notifId,
        type: 'guidance',
        title: `🎓 Faculty Guidance Assigned: ${subject}`,
        message: `You have been assigned to ${advisorName} (${advisorRole}) for academic counseling in ${subject}.${notesSnippet}`,
        timestamp: formattedTime,
        actionLabel: 'View Guidance Plan',
        isUrgent: true,
        read: readIds.includes(notifId),
        guidanceId: item.id,
        guidanceData: item,
        advisorName,
        advisorEmail: item.advisor?.email,
        advisorRole,
        subjectCategory: subject,
        guidanceNotes: item.guidanceNotes,
        guidanceStatus: item.status,
      });
    }
  });

  return notifications;
}

export function generateDynamicNotifications(user: any, guidanceList: any[] = []): AppNotification[] {
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

  // 0. 🎓 Academic Guidance & Faculty Counseling Notifications (from MongoDB GuidanceAssignment)
  const guidanceNotifs = buildGuidanceNotifications(guidanceList);
  notifications.push(...guidanceNotifs);

  // Check if user has real quest/exam history
  const questAchievements = (user?.achievements || []).filter(
    (a: any) => a.type === 'quest' && a.subject !== 'Daily Attendance'
  );
  const hasStudyHistory = questAchievements.length > 0 || (user?.todayQuestions || 0) > 0 || (user?.totalQuestions || 0) > 0;

  // 1. 🔥 Daily Streak Protection Alert (Only if study history exists, streak > 0, and user hasn't played today)
  if (streakAlertsEnabled && hasStudyHistory && userStreak > 0 && todayQuestions === 0) {
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

  // 1b. 💔 Daily Streak Lost / Broken Alert (When streak is broken, previous study history exists, and user hasn't played today)
  if (streakAlertsEnabled && hasStudyHistory && userStreak === 0 && todayQuestions === 0 && user?.streakBroken && (user?.previousStreak || 0) > 0) {
    const streakLostId = `streak_lost_${new Date().toISOString().slice(0, 10)}`;
    const prevMsg = `Your ${user.previousStreak}-day study streak was lost because no review quest was completed yesterday.`;

    notifications.push({
      id: streakLostId,
      type: 'streak_lost',
      title: '💔 Daily Streak Lost',
      message: `${prevMsg} Complete a review quest today to ignite a brand new streak!`,
      timestamp: 'Streak Broken',
      link: '/quest',
      actionLabel: 'Restart Streak',
      isUrgent: true,
      read: readIds.includes(streakLostId),
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

  // 3. 📅 Target MTLE Milestone Alert (Only if target exam date has been explicitly set)
  const savedExamDate = localStorage.getItem('bq_pref_target_exam_date');
  if (countdownAlertsEnabled && savedExamDate) {
    const targetBatch = localStorage.getItem('bq_pref_target_batch') || 'Target MTLE Board Exam';
    const examDate = new Date(savedExamDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDay = new Date(examDate);
    examDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((examDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const milestoneId = `milestone_${targetBatch.replace(/\s+/g, '_')}`;
    const daysText = diffDays > 0 ? `${diffDays} days left` : diffDays === 0 ? 'Exam Today!' : `${Math.abs(diffDays)} days ago`;

    notifications.push({
      id: milestoneId,
      type: 'milestone',
      title: '📅 Board Exam Preparation',
      message: `Target Exam: ${targetBatch} (${daysText}). Maintain consistent daily quest practice for optimal recall.`,
      timestamp: daysText,
      link: '/profile',
      actionLabel: 'View Schedule',
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
