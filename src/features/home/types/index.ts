export interface ActiveCourseInfo {
  status: 'not_started' | 'in_progress' | 'completed' | 'no_modules';
  subject: string;
  currentModuleTitle: string;
  currentModuleDesc?: string;
  currentModuleId?: string;
  completedCount: number;
  totalLessons: number;
  progressPercent: number;
  upNextModule?: { title: string; duration?: string } | null;
}

export interface NextMilestone {
  subject: string;
  date: Date;
}

