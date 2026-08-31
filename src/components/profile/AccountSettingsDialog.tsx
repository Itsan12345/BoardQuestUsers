"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Target,
  Volume2,
  Bell,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Lock,
  School,
  MapPin,
  Sparkles,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  Laptop,
  Check,
  Calendar,
  Compass,
  Sun,
  Moon,
  Palette,
  AlertTriangle,
  Smartphone,
  RefreshCw,
  Trash2,
  GraduationCap,
  Pencil,
} from 'lucide-react';
import { getActiveSessionsAction, terminateSessionAction, type ActiveSessionRecord } from '@/app/actions/session';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import {
  updateUserProfileDetails,
  changeUserPassword,
  exportUserStudyData,
  getUserSettingsAction,
  saveUserSettingsAction,
  deleteUserAccountAction,
  checkUserReviewCenterEnrollmentAction,
  type ReviewCenterEnrollmentInfo,
} from '@/app/actions/user';
import { SUBJECT_AREAS } from '@/lib/game-logic';
import { getSubjects } from '@/app/actions/study';
import { startTourByKey, isTourCompleted } from '@/lib/tour-config';
import { TargetExamCalendar } from '@/components/profile/TargetExamCalendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format, differenceInCalendarDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: {
    id: string;
    name: string;
    email: string;
    level: number;
    xp: number;
    streak: number;
    location: string;
    classString: string;
  };
  onProfileUpdated: (updatedUser: any) => void;
  initialTab?: string;
  autoOpenTargetExamCalendar?: boolean;
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  userProfile,
  onProfileUpdated,
  initialTab = 'profile',
  autoOpenTargetExamCalendar = false,
}: AccountSettingsDialogProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Form states - Profile
  const [name, setName] = useState(userProfile.name || '');
  const [location, setLocation] = useState(userProfile.location || 'Cebu, Philippines');
  const [school, setSchool] = useState('');
  const [targetBatch, setTargetBatch] = useState('');
  const [targetExamDate, setTargetExamDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(autoOpenTargetExamCalendar);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // Form states - Study Goals
  const [dailyQuota, setDailyQuota] = useState('50');
  const [focusSubject, setFocusSubject] = useState<string>('none');
  const [dynamicSubjects, setDynamicSubjects] = useState<string[]>([]);
  const [defaultDifficulty, setDefaultDifficulty] = useState('MEDIUM');
  const [confidencePrompts, setConfidencePrompts] = useState(true);

  // Form states - Audio & FX
  const [sfxVolume, setSfxVolume] = useState([80]);
  const [ambientMusic, setAmbientMusic] = useState(true);
  const [floatingDamageText, setFloatingDamageText] = useState(true);
  const [hitScreenFlash, setHitScreenFlash] = useState(true);

  // Form states - Notifications
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [countdownAlerts, setCountdownAlerts] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);

  // Form states - Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states - Delete Account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Form states - Data Export
  const [isExporting, setIsExporting] = useState(false);

  // Active Sessions state
  const [activeSessions, setActiveSessions] = useState<ActiveSessionRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);

  // Review Center Enrollment state
  const [reviewCenterEnrollment, setReviewCenterEnrollment] = useState<ReviewCenterEnrollmentInfo>(() => {
    return (userProfile as any)?.reviewCenterEnrollment || { isEnrolled: false };
  });
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false);

  const fetchActiveSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await getActiveSessionsAction();
      if (res.success && res.sessions) {
        setActiveSessions(res.sessions);
      }
    } catch (e) {
      console.error('Failed to fetch active sessions:', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    async function checkEnrollment() {
      setIsCheckingEnrollment(true);
      try {
        const info = await checkUserReviewCenterEnrollmentAction();
        if (info) {
          setReviewCenterEnrollment(info);
          if (info.isEnrolled && info.companyName) {
            setSchool(info.companyName);
          }
        }
      } catch (e) {
        console.warn('Review center candidate check notice:', e);
      } finally {
        setIsCheckingEnrollment(false);
      }
    }

    if (open) {
      setIsEditingName(false);
      fetchActiveSessions();
      checkEnrollment();
    }
  }, [open]);

  // Sync initial user values
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setLocation(userProfile.location || 'Cebu, Philippines');
      if ((userProfile as any).reviewCenterEnrollment) {
        const rcInfo = (userProfile as any).reviewCenterEnrollment;
        setReviewCenterEnrollment(rcInfo);
        if (rcInfo.isEnrolled && rcInfo.companyName) {
          setSchool(rcInfo.companyName);
        }
      }
    }

    async function loadSettings() {
      try {
        const [dbSettings, dbSubjects] = await Promise.all([
          getUserSettingsAction(),
          getSubjects().catch(() => [])
        ]);

        if (dbSubjects && dbSubjects.length > 0) {
          setDynamicSubjects(dbSubjects.map(s => s.name));
        } else {
          setDynamicSubjects([]);
        }

        if (dbSettings) {
          if (dbSettings.dailyQuota) setDailyQuota(String(dbSettings.dailyQuota));
          if (dbSettings.focusSubject) setFocusSubject(dbSettings.focusSubject);
          else setFocusSubject('none');
          if (dbSettings.defaultDifficulty) setDefaultDifficulty(dbSettings.defaultDifficulty);
          if (dbSettings.confidencePrompts !== undefined) setConfidencePrompts(dbSettings.confidencePrompts);
          if (dbSettings.sfxVolume !== undefined) setSfxVolume([dbSettings.sfxVolume]);
          if (dbSettings.ambientMusic !== undefined) setAmbientMusic(dbSettings.ambientMusic);
          if (dbSettings.floatingDamageText !== undefined) setFloatingDamageText(dbSettings.floatingDamageText);
          if (dbSettings.hitScreenFlash !== undefined) setHitScreenFlash(dbSettings.hitScreenFlash);
          if (dbSettings.streakAlerts !== undefined) setStreakAlerts(dbSettings.streakAlerts);
          if (dbSettings.countdownAlerts !== undefined) setCountdownAlerts(dbSettings.countdownAlerts);
          if (dbSettings.achievementAlerts !== undefined) setAchievementAlerts(dbSettings.achievementAlerts);
          if (dbSettings.school) setSchool(dbSettings.school);
          else setSchool('');
          if (dbSettings.targetBatch) setTargetBatch(dbSettings.targetBatch);
          else setTargetBatch('');
          if (dbSettings.targetExamDate) setTargetExamDate(new Date(dbSettings.targetExamDate));
          else setTargetExamDate(null);
        } else {
          // Fallback to client localStorage
          const savedQuota = localStorage.getItem('bq_pref_daily_quota');
          if (savedQuota) setDailyQuota(savedQuota);

          const savedSubject = localStorage.getItem('bq_pref_focus_subject');
          if (savedSubject) setFocusSubject(savedSubject);

          const savedDiff = localStorage.getItem('bq_pref_default_diff');
          if (savedDiff) setDefaultDifficulty(savedDiff);

          const savedConf = localStorage.getItem('bq_pref_confidence_prompts');
          if (savedConf !== null) setConfidencePrompts(savedConf === 'true');

          const savedSfx = localStorage.getItem('bq_pref_sfx_vol');
          if (savedSfx) setSfxVolume([parseInt(savedSfx, 10)]);

          const savedMusic = localStorage.getItem('bq_pref_ambient_music');
          if (savedMusic !== null) setAmbientMusic(savedMusic === 'true');

          const savedFloating = localStorage.getItem('bq_pref_floating_damage');
          if (savedFloating !== null) setFloatingDamageText(savedFloating === 'true');

          const savedFlash = localStorage.getItem('bq_pref_hit_flash');
          if (savedFlash !== null) setHitScreenFlash(savedFlash === 'true');

          const savedStreakAlert = localStorage.getItem('bq_pref_streak_alerts');
          if (savedStreakAlert !== null) setStreakAlerts(savedStreakAlert === 'true');

          const savedCountdown = localStorage.getItem('bq_pref_countdown_alerts');
          if (savedCountdown !== null) setCountdownAlerts(savedCountdown === 'true');

          const savedAchieve = localStorage.getItem('bq_pref_achievement_alerts');
          if (savedAchieve !== null) setAchievementAlerts(savedAchieve === 'true');

          const savedSchool = localStorage.getItem('bq_pref_school');
          if (savedSchool) setSchool(savedSchool);

          const savedBatch = localStorage.getItem('bq_pref_target_batch');
          if (savedBatch) setTargetBatch(savedBatch);

          const savedDate = localStorage.getItem('bq_pref_target_exam_date');
          if (savedDate) setTargetExamDate(new Date(savedDate));
        }
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
    loadSettings();
  }, [userProfile]);

  // Function to launch spotlight guide for the currently selected tab
  const handleStartTabTour = (tabKey: string, force: boolean = false) => {
    const tourKey = `settings_${tabKey}`;
    startTourByKey(tourKey, force);
  };

  // Handle Tab Switch & trigger tab walkthrough on first visit
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const tourKey = `settings_${newTab}`;
    if (!isTourCompleted(tourKey)) {
      setTimeout(() => {
        startTourByKey(tourKey, false);
      }, 350);
    }
  };

  // Auto-start tour on first time opening Account Settings (default 'profile' tab)
  useEffect(() => {
    if (open) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (autoOpenTargetExamCalendar) {
        setCalendarOpen(true);
      }
      const tourKey = `settings_${initialTab || activeTab}`;
      if (!isTourCompleted(tourKey)) {
        const timer = setTimeout(() => {
          startTourByKey(tourKey, false);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [open, initialTab, autoOpenTargetExamCalendar]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter your full name.',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateUserProfileDetails({
        name,
        location,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update profile');
      }

      const dateIso = targetExamDate ? targetExamDate.toISOString() : null;

      // Save academic fields to MongoDB & localStorage
      localStorage.setItem('bq_pref_school', school);
      localStorage.setItem('bq_pref_target_batch', targetBatch);
      if (dateIso) {
        localStorage.setItem('bq_pref_target_exam_date', dateIso);
      } else {
        localStorage.removeItem('bq_pref_target_exam_date');
      }

      await saveUserSettingsAction({
        school,
        targetBatch,
        targetExamDate: dateIso,
      });

      window.dispatchEvent(new CustomEvent('bq_settings_updated', {
        detail: { school, targetBatch, targetExamDate: dateIso }
      }));

      toast({
        title: 'Profile Updated',
        description: 'Your academic credentials and target exam schedule have been saved.',
      });

      if (res.user) {
        onProfileUpdated(res.user);
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Save Goals
  const handleSaveGoals = async () => {
    try {
      localStorage.setItem('bq_pref_daily_quota', dailyQuota);
      localStorage.setItem('bq_pref_focus_subject', focusSubject || 'none');
      localStorage.setItem('bq_pref_default_diff', defaultDifficulty);
      localStorage.setItem('bq_pref_confidence_prompts', String(confidencePrompts));

      await saveUserSettingsAction({
        dailyQuota: parseInt(dailyQuota, 10),
        focusSubject: focusSubject || 'none',
        defaultDifficulty,
        confidencePrompts,
      });

      window.dispatchEvent(new CustomEvent('bq_settings_updated', {
        detail: {
          dailyQuota: parseInt(dailyQuota, 10),
          focusSubject: focusSubject || 'none',
          defaultDifficulty,
          confidencePrompts,
        }
      }));

      toast({
        title: 'Study Goals Saved',
        description: 'Your daily review targets have been configured.',
      });

      onOpenChange(false);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save study goals.',
      });
    }
  };

  // Handle Save Audio & FX
  const handleSaveAudio = async () => {
    try {
      localStorage.setItem('bq_pref_sfx_vol', String(sfxVolume[0]));
      localStorage.setItem('bq_pref_ambient_music', String(ambientMusic));
      localStorage.setItem('bq_pref_floating_damage', String(floatingDamageText));
      localStorage.setItem('bq_pref_hit_flash', String(hitScreenFlash));

      await saveUserSettingsAction({
        sfxVolume: sfxVolume[0],
        ambientMusic,
        floatingDamageText,
        hitScreenFlash,
      });

      window.dispatchEvent(new CustomEvent('bq_settings_updated', {
        detail: {
          sfxVolume: sfxVolume[0],
          ambientMusic,
          floatingDamageText,
          hitScreenFlash,
        }
      }));

      toast({
        title: 'Preferences Saved',
        description: 'RPG audio and visual preferences updated.',
      });

      onOpenChange(false);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save audio preferences.',
      });
    }
  };

  // Handle Save Notifications
  const handleSaveNotifications = async () => {
    try {
      localStorage.setItem('bq_pref_streak_alerts', String(streakAlerts));
      localStorage.setItem('bq_pref_countdown_alerts', String(countdownAlerts));
      localStorage.setItem('bq_pref_achievement_alerts', String(achievementAlerts));

      await saveUserSettingsAction({
        streakAlerts,
        countdownAlerts,
        achievementAlerts,
      });

      window.dispatchEvent(new CustomEvent('bq_settings_updated', {
        detail: {
          streakAlerts,
          countdownAlerts,
          achievementAlerts,
        }
      }));

      toast({
        title: 'Notifications Updated',
        description: 'Streak protection & milestone alert settings saved.',
      });

      onOpenChange(false);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save notification preferences.',
      });
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter your current password.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password Too Short',
        description: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeUserPassword({
        currentPassword,
        newPassword,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update password');
      }

      toast({
        title: 'Password Changed',
        description: 'Your account password was updated successfully.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not change password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Data Export
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await exportUserStudyData();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Export failed');
      }

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `BoardQuest_Transcript_${userProfile.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast({
        title: 'Study Record Exported',
        description: 'Official BoardQuest performance report downloaded.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error.message || 'Failed to generate study export.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Permanent Delete Account
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationText.trim() !== 'DELETE') {
      toast({
        variant: 'destructive',
        title: 'Confirmation Mismatch',
        description: 'Please type DELETE in all uppercase to confirm.',
      });
      return;
    }

    if (!deletePassword) {
      toast({
        variant: 'destructive',
        title: 'Password Required',
        description: 'Please enter your current password to authorize account deletion.',
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await deleteUserAccountAction({
        password: deletePassword,
        confirmationText: deleteConfirmationText.trim(),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to delete account');
      }

      // Clear all client-side cached storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) { }

      toast({
        title: 'Account Permanently Deleted',
        description: 'Your account and all associated study data have been completely wiped.',
      });

      setDeleteDialogOpen(false);
      onOpenChange(false);

      // Force clean redirect to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'An error occurred while deleting your account.',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'None', color: 'bg-slate-200', width: '0%' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '30%' };
    if (pass.length < 10) return { label: 'Good', color: 'bg-amber-500', width: '65%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const today = startOfDay(new Date());
  const daysRemaining = targetExamDate ? differenceInCalendarDays(startOfDay(targetExamDate), today) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[88vh] flex flex-col bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 overflow-hidden">
          <DialogHeader className="pb-2.5 sm:pb-3 border-b border-border text-left shrink-0">
            <div id="tour-settings-header" className="flex items-start sm:items-center justify-between pr-6 gap-3 text-left">
              <div className="text-left min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground text-left truncate">
                  Account Settings
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 text-left leading-relaxed line-clamp-1">
                  Manage academic credentials, review goals, and security
                </DialogDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleStartTabTour(activeTab, true)}
                className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg sm:rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-all text-foreground/80 hover:text-primary shrink-0"
                title="Explain current tab settings"
              >
                <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0 transition-transform group-hover:rotate-45" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Guide</span>
              </Button>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col min-h-0 pt-1.5 min-w-0 overflow-hidden">
            {/* Tabs navigation bar */}
            <TabsList className="w-full grid grid-cols-4 md:grid-cols-7 h-auto p-1 bg-muted/60 rounded-xl sm:rounded-2xl border border-border/50 gap-1 min-w-0 shrink-0">
              <TabsTrigger
                id="tour-settings-tab-profile"
                value="profile"
                className="min-w-0 text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1"
              >
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Profile</span>
              </TabsTrigger>
              <TabsTrigger
                id="tour-settings-tab-goals"
                value="goals"
                className="min-w-0 text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1"
              >
                <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Goals</span>
              </TabsTrigger>
              <TabsTrigger
                id="tour-settings-tab-appearance"
                value="appearance"
                className="min-w-0 text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1"
              >
                <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Theme</span>
              </TabsTrigger>
              <TabsTrigger
                id="tour-settings-tab-audio"
                value="audio"
                className="min-w-0 text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1"
              >
                <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Audio</span>
              </TabsTrigger>
              <TabsTrigger
                id="tour-settings-tab-alerts"
                value="alerts"
                className="min-w-0 text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1"
              >
                <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Alerts</span>
              </TabsTrigger>
              <TabsTrigger
                id="tour-settings-tab-security"
                value="security"
                className="min-w-0 text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1"
              >
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Security</span>
              </TabsTrigger>
              <TabsTrigger
                id="tour-settings-tab-records"
                value="records"
                className="col-span-2 md:col-span-1 min-w-0 text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1"
              >
                <FileSpreadsheet className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Records</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Profile & Academic Identity */}
            <TabsContent value="profile" className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pt-3 space-y-3 sm:space-y-3.5 min-w-0 max-w-full focus-visible:outline-none">
              <form onSubmit={handleSaveProfile} className="space-y-3.5 min-w-0 max-w-full">
                <div id="tour-profile-identity" className="p-2.5 sm:p-3 bg-muted/30 border border-border rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3.5 w-full min-w-0 max-w-full overflow-hidden">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm sm:text-lg font-bold border-2 border-primary/20 shadow-md shrink-0">
                    {name
                      ? name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                      : 'A'}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <h3 className="font-bold text-xs sm:text-base text-foreground truncate">{name || 'Medical Technology Aspirant'}</h3>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] px-1.5 py-0 flex items-center gap-0.5 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </Badge>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      Level {userProfile.level} • {userProfile.classString}
                    </p>
                  </div>
                </div>

                <div id="tour-profile-academic" className="space-y-3 w-full max-w-full min-w-0">
                {/* Candidate Official Status Banner */}
                {reviewCenterEnrollment.isEnrolled ? (
                  <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 min-w-0 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {reviewCenterEnrollment.companyName}
                          </span>
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] px-1.5 py-0 font-bold shrink-0">
                            Enrolled
                          </Badge>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          S.Y. {reviewCenterEnrollment.schoolYear}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 min-w-0 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <School className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                            Independent / Self-Study Candidate
                          </span>
                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px] sm:text-[10px] px-1.5 py-0 font-bold shrink-0">
                            Not Enrolled
                          </Badge>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          Not currently linked to an official Review Center partner
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 1: Full Name & Registered Email Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-full min-w-0">
                  <div className="space-y-1 w-full min-w-0">
                    <Label htmlFor="name" className="text-[11px] sm:text-xs font-semibold flex items-center justify-between">
                      <span>Full Name</span>
                      {isEditingName && (
                        <span className="text-[10px] text-primary font-bold animate-pulse">Editing Enabled</span>
                      )}
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        id="name"
                        value={name}
                        disabled={!isEditingName}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ethan Gabriel Rolloque"
                        className={cn(
                          "rounded-xl h-9 sm:h-10 text-xs sm:text-sm w-full min-w-0 pr-9 transition-all",
                          !isEditingName
                            ? "bg-muted/50 text-foreground cursor-not-allowed border-border/60"
                            : "bg-background text-foreground ring-2 ring-primary/40 border-primary"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !isEditingName;
                          setIsEditingName(nextState);
                          if (nextState) {
                            setTimeout(() => document.getElementById('name')?.focus(), 50);
                          }
                        }}
                        className={cn(
                          "absolute right-2 text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg",
                          isEditingName && "text-primary bg-primary/10"
                        )}
                        title={isEditingName ? "Click to lock name editing" : "Click edit icon to change full name"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 w-full min-w-0">
                    <Label htmlFor="email" className="text-[11px] sm:text-xs font-semibold">
                      Registered Email Address
                    </Label>
                    <Input
                      id="email"
                      value={userProfile.email}
                      disabled
                      className="rounded-xl h-9 sm:h-10 text-xs sm:text-sm bg-muted text-muted-foreground cursor-not-allowed w-full min-w-0 truncate"
                    />
                  </div>
                </div>

                {/* Row 2: Review Center & Target MTLE Board Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 items-end w-full max-w-full min-w-0">
                  <div className="space-y-1 w-full min-w-0">
                    <Label htmlFor="school" className="text-[11px] sm:text-xs font-semibold flex items-center gap-1 truncate">
                      <School className="w-3.5 h-3.5 text-primary shrink-0" /> Review Center
                    </Label>
                    <Input
                      id="school"
                      value={
                        reviewCenterEnrollment.isEnrolled
                          ? (school || reviewCenterEnrollment.companyName || 'Enrolled Review Center')
                          : 'Not Enrolled in a Review Center'
                      }
                      disabled
                      placeholder="Not Enrolled in a Review Center"
                      className="rounded-xl h-9 sm:h-10 text-xs sm:text-sm bg-muted/50 text-muted-foreground cursor-not-allowed w-full min-w-0 truncate border-border/60"
                    />
                  </div>
                  <div id="tour-profile-target-exam" className="space-y-1.5 w-full min-w-0">
                    <div className="flex items-center justify-between min-w-0 gap-1">
                      <Label className="text-xs font-semibold flex items-center gap-1 truncate">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Target MTLE Board Schedule
                      </Label>
                      {daysRemaining > 0 && (
                        <span className="text-xs font-bold text-primary shrink-0">
                          {daysRemaining} days left
                        </span>
                      )}
                    </div>

                    <Popover modal={true} open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full h-10 px-3 bg-background hover:bg-muted/50 border border-input hover:border-primary/50 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between transition-all group shadow-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/30 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <Calendar className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate text-xs sm:text-sm font-normal text-foreground">
                              {targetExamDate ? format(targetExamDate, 'MMMM d, yyyy') : 'Pick examination date'}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg shrink-0 transition-colors ml-1">
                            Pick Date
                          </span>
                        </button>
                      </PopoverTrigger>

                      <PopoverContent
                        className="w-[calc(100vw-28px)] max-w-[340px] p-2.5 sm:p-4 bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl z-[150]"
                        align="end"
                        side="top"
                        sideOffset={8}
                        collisionPadding={10}
                      >
                        <TargetExamCalendar
                          selectedDate={targetExamDate}
                          onSelectDate={(newDate, batchLabel) => {
                            setTargetExamDate(newDate);
                            if (batchLabel) {
                              setTargetBatch(batchLabel);
                            }
                          }}
                          showHeader={true}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Row 3: Regional Testing Hub / City */}
                <div className="space-y-1 w-full min-w-0">
                  <Label htmlFor="location" className="text-[11px] sm:text-xs font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> Regional Testing Hub / City
                  </Label>
                  <Input
                    id="location"
                    value={location || 'Philippines'}
                    disabled
                    placeholder="Philippines"
                    className="rounded-xl h-9 sm:h-10 text-xs sm:text-sm bg-muted/50 text-muted-foreground cursor-not-allowed w-full min-w-0 border-border/60"
                  />
                </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border/50">
                  <Button
                    id="tour-profile-save"
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-xs px-6 h-10 shadow-sm"
                  >
                    {isSavingProfile && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Save Profile Details
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB 2: Study Goals & Targets */}
            <TabsContent value="goals" className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pt-3 space-y-3 sm:space-y-3.5 min-w-0 max-w-full focus-visible:outline-none">
              <div className="space-y-3 sm:space-y-4 w-full max-w-full">
                {/* Daily Question Target */}
                <div id="tour-goals-quota" className="p-3.5 sm:p-4 bg-muted/20 border border-border rounded-2xl space-y-3 w-full max-w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                    <div className="min-w-0">
                      <Label className="text-sm font-semibold text-foreground">Daily Question Target</Label>
                      <p className="text-xs text-muted-foreground">Target questions to complete every day</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[11px] sm:text-xs font-bold px-2.5 py-0.5 w-fit shrink-0">
                      {dailyQuota} Questions/Day
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                    {['20', '50', '100', '150'].map(quota => (
                      <Button
                        key={quota}
                        type="button"
                        size="sm"
                        variant={dailyQuota === quota ? 'default' : 'outline'}
                        onClick={() => setDailyQuota(quota)}
                        className={cn(
                          'w-full rounded-xl text-xs font-bold h-9 sm:h-8 transition-all',
                          dailyQuota === quota ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'hover:bg-muted/80'
                        )}
                      >
                        {quota} Qs
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Priority Subject & Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full">
                  <div id="tour-goals-focus" className="p-3.5 sm:p-4 bg-muted/20 border border-border rounded-2xl space-y-2 min-w-0 overflow-hidden">
                    <div className="min-w-0">
                      <Label className="text-sm font-semibold text-foreground">Priority Focus Subject</Label>
                      <p className="text-xs text-muted-foreground truncate">Subject highlighted first in Study Arena</p>
                    </div>
                    <Select value={focusSubject || 'none'} onValueChange={setFocusSubject}>
                      <SelectTrigger className="rounded-xl h-9 text-xs w-full min-w-0 max-w-full overflow-hidden">
                        <SelectValue placeholder="Select focus subject" className="truncate" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[90vw] sm:max-w-sm">
                        <SelectItem value="none" className="text-xs font-medium">
                          None (No Priority Subject)
                        </SelectItem>
                        {dynamicSubjects.map(sub => (
                          <SelectItem key={sub} value={sub} className="text-xs truncate max-w-full">
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div id="tour-goals-diff" className="p-3.5 sm:p-4 bg-muted/20 border border-border rounded-2xl space-y-2 min-w-0 overflow-hidden">
                    <div className="min-w-0">
                      <Label className="text-sm font-semibold text-foreground">Starting Quiz Difficulty</Label>
                      <p className="text-xs text-muted-foreground truncate">Default combat difficulty in Boss Rush</p>
                    </div>
                    <Select value={defaultDifficulty} onValueChange={setDefaultDifficulty}>
                      <SelectTrigger className="rounded-xl h-9 text-xs w-full min-w-0 max-w-full overflow-hidden">
                        <SelectValue placeholder="Select difficulty" className="truncate" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[90vw] sm:max-w-sm">
                        <SelectItem value="EASY" className="text-xs">Easy Mode (0.85x Damage)</SelectItem>
                        <SelectItem value="MEDIUM" className="text-xs">Standard Board Simulation (1.0x)</SelectItem>
                        <SelectItem value="HARD" className="text-xs">Hardcore Examiner Mode (1.25x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Confidence Rating Prompts */}
                <div id="tour-goals-confidence" className="p-3.5 sm:p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between gap-3 w-full max-w-full">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label className="text-sm font-semibold text-foreground">Confidence Rating Prompts</Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Prompt for confidence level (Shaky / Steady / Unyielding) to gain bonus XP multipliers
                    </p>
                  </div>
                  <Switch checked={confidencePrompts} onCheckedChange={setConfidencePrompts} className="shrink-0" />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2 w-full">
                  <Button
                    id="tour-goals-save"
                    type="button"
                    onClick={handleSaveGoals}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs px-5 h-10 sm:h-9 shadow-sm"
                  >
                    Save Study Preferences
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Audio & RPG FX */}
            <TabsContent value="audio" className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pt-3 space-y-3 sm:space-y-3.5 min-w-0 max-w-full focus-visible:outline-none">
              <div className="space-y-4">
                <div id="tour-audio-sfx" className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">Sound Effects (SFX) Volume</Label>
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground">{sfxVolume[0]}%</span>
                  </div>
                  <Slider
                    value={sfxVolume}
                    onValueChange={setSfxVolume}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div id="tour-audio-music" className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-foreground">Background Ambient Music</Label>
                    <p className="text-xs text-muted-foreground">Enable medieval atmospheric music during dungeon quizzes</p>
                  </div>
                  <Switch checked={ambientMusic} onCheckedChange={setAmbientMusic} />
                </div>

                <div id="tour-audio-combat" className="space-y-4 p-4 bg-muted/20 border border-border rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground">Floating Combat Text</Label>
                      <p className="text-xs text-muted-foreground">Render animated pixel damage indicators when attacking</p>
                    </div>
                    <Switch checked={floatingDamageText} onCheckedChange={setFloatingDamageText} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground">Screen Flash on Damage</Label>
                      <p className="text-xs text-muted-foreground">Red pulse screen flash when taking damage (toggle off for battery saver)</p>
                    </div>
                    <Switch checked={hitScreenFlash} onCheckedChange={setHitScreenFlash} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    id="tour-audio-save"
                    type="button"
                    onClick={handleSaveAudio}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-xs px-5 h-9"
                  >
                    Save Audio Preferences
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Notifications & Alerts */}
            <TabsContent value="alerts" className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pt-3 space-y-3 sm:space-y-3.5 min-w-0 max-w-full focus-visible:outline-none">
              <div className="space-y-4">
                <div id="tour-alerts-streak" className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm font-semibold text-foreground">Daily Streak Protection Alerts</Label>
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px]">Recommended</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Get notified at 8:00 PM if you have not completed your daily review to preserve your active streak</p>
                  </div>
                  <Switch checked={streakAlerts} onCheckedChange={setStreakAlerts} />
                </div>

                <div id="tour-alerts-countdown" className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-foreground">Board Exam Milestone Countdowns</Label>
                    <p className="text-xs text-muted-foreground">Receive weekly countdown milestones leading up to your target MTLE date</p>
                  </div>
                  <Switch checked={countdownAlerts} onCheckedChange={setCountdownAlerts} />
                </div>

                <div id="tour-alerts-milestones" className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-foreground">Badge & Level-Up Milestones</Label>
                    <p className="text-xs text-muted-foreground">Instant alerts in the top nav when earning new badges or leveling up</p>
                  </div>
                  <Switch checked={achievementAlerts} onCheckedChange={setAchievementAlerts} />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    id="tour-alerts-save"
                    type="button"
                    onClick={handleSaveNotifications}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-xs px-5 h-9"
                  >
                    Save Notification Alerts
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: Security & Password */}
            <TabsContent value="security" className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pt-3 space-y-3 sm:space-y-3.5 min-w-0 max-w-full focus-visible:outline-none">
              <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-3.5">
                <div id="tour-security-password" className="p-3.5 sm:p-4 bg-muted/20 border border-border rounded-xl sm:rounded-2xl space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm font-semibold text-foreground">Update Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition"
                    >
                      {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showPasswords ? 'Hide' : 'Show'} Passwords
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="currentPass" className="text-[11px] sm:text-xs font-semibold">Current Password</Label>
                      <Input
                        id="currentPass"
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="rounded-xl h-8.5 sm:h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="newPass" className="text-[11px] sm:text-xs font-semibold">New Password</Label>
                      <Input
                        id="newPass"
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="rounded-xl h-8.5 sm:h-9 text-xs"
                      />
                      {newPassword && (
                        <div className="space-y-1 pt-0.5">
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-300", passwordStrength.color)} style={{ width: passwordStrength.width }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">Strength: {passwordStrength.label}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="confirmPass" className="text-[11px] sm:text-xs font-semibold">Confirm New Password</Label>
                      <Input
                        id="confirmPass"
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="rounded-xl h-8.5 sm:h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      id="tour-security-save"
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs px-5 h-9"
                    >
                      {isChangingPassword && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </div>

                {/* Active Session Info - Dynamic Multi-device tracking */}
                <div id="tour-security-session" className="p-3.5 sm:p-4 bg-muted/20 border border-border rounded-xl sm:rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-bold text-foreground">Active Signed-in Sessions</span>
                      <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0">
                        {activeSessions.length} {activeSessions.length === 1 ? 'Device' : 'Devices'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={fetchActiveSessions}
                      disabled={loadingSessions}
                      className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
                    >
                      {loadingSessions ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                      Refresh
                    </Button>
                  </div>

                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Devices currently signed into your BoardQuest account. Signed-in devices appear dynamically below.
                  </p>

                  {loadingSessions && activeSessions.length === 0 ? (
                    <div className="py-4 text-center">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                      <span className="text-xs text-muted-foreground mt-1 inline-block">Checking active sessions...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {activeSessions.map((sess) => {
                        const isMobile = /iphone|ipad|android/i.test(sess.os);

                        return (
                          <div
                            key={sess.id}
                            className={cn(
                              "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                              sess.isCurrent
                                ? "bg-emerald-500/5 border-emerald-500/30"
                                : "bg-background/80 border-border/60"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "p-2 rounded-xl border shrink-0",
                                sess.isCurrent
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-muted/40 border-border text-muted-foreground"
                              )}>
                                {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-foreground truncate">{sess.deviceName}</span>
                                  {sess.isCurrent ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0 font-bold">
                                      Current Device (Active Now)
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground font-medium">
                                      Active Device
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                  {sess.isCurrent
                                    ? 'This session is currently in use on your current browser'
                                    : `Last active: ${format(new Date(sess.lastActive), 'MMM dd, yyyy • h:mm a')}`}
                                </p>
                              </div>
                            </div>

                            {!sess.isCurrent && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={terminatingSessionId === sess.sessionId}
                                onClick={async () => {
                                  setTerminatingSessionId(sess.sessionId);
                                  const res = await terminateSessionAction(sess.sessionId);
                                  setTerminatingSessionId(null);
                                  if (res.success) {
                                    toast({
                                      title: "Session Terminated",
                                      description: "The remote device session was logged out.",
                                    });
                                    fetchActiveSessions();
                                  }
                                }}
                                className="text-[10px] h-7 px-2.5 rounded-lg border-red-500/30 text-red-600 hover:bg-red-500/10 shrink-0 font-semibold"
                              >
                                {terminatingSessionId === sess.sessionId ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Log Out Device'
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Danger Zone: Permanent Account Deletion */}
                <div id="tour-security-danger-zone" className="p-3.5 sm:p-4 bg-red-500/5 border border-red-500/25 rounded-xl sm:rounded-2xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-red-600 dark:text-red-400">Danger Zone: Delete Account</h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                          Permanently wipe your aspirant account, diagnostic records, quest progression, and credentials.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDeletePassword('');
                        setDeleteConfirmationText('');
                        setDeleteDialogOpen(true);
                      }}
                      className="w-full sm:w-auto shrink-0 border-red-500/40 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold text-xs px-3.5 h-8.5 sm:h-9 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Account
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* TAB 6: Records & Data Export */}
            <TabsContent value="records" className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pt-3 space-y-3 sm:space-y-3.5 min-w-0 max-w-full focus-visible:outline-none">
              <div className="space-y-3 sm:space-y-4">
                {/* Main Transcript Card */}
                <div id="tour-records-export" className="p-4 sm:p-5 bg-muted/20 border border-border rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground">Certified Study Transcript</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Download a complete structured JSON record of your diagnostic mastery, mock exam results, and earned achievements.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs px-5 h-10 sm:h-9 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                    >
                      {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Export Data (JSON)
                    </Button>
                  </div>

                  {/* Included Records Summary Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
                    <div className="p-2 rounded-lg bg-background/60 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">Subject Masteries</span>
                    </div>
                    <div className="p-2 rounded-lg bg-background/60 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">Mock Exam Scores</span>
                    </div>
                    <div className="p-2 rounded-lg bg-background/60 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">Earned Badges</span>
                    </div>
                    <div className="p-2 rounded-lg bg-background/60 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">XP & Rank History</span>
                    </div>
                  </div>
                </div>

                {/* Mentor Verification Notice */}
                <div id="tour-records-mentor" className="p-3.5 sm:p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 sm:gap-3 text-xs text-amber-900 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <strong className="font-semibold block sm:inline mr-1">Academic Mentor Verification:</strong>
                    <span>Your study transcripts can be shared with review center professors and mentors to verify diagnostic mastery prior to the board exams.</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            {/* TAB 7: Appearance & Theme Mode */}
            <TabsContent value="appearance" className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pt-3 space-y-3 sm:space-y-3.5 min-w-0 max-w-full focus-visible:outline-none">
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">Theme & Visual Experience</Label>
                    </div>
                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold capitalize">
                      {theme || 'system'} mode active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select how BoardQuest looks across your desktop, tablet, and mobile devices.
                  </p>
                </div>

                {/* 3 Theme Choice Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Light Mode Card */}
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      "relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 group active:scale-[0.98]",
                      theme === 'light'
                        ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md"
                        : "bg-muted/20 border-border hover:bg-muted/40 hover:border-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                        <Sun className="w-5 h-5" />
                      </div>
                      {theme === 'light' && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">Active</Badge>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        Light Mode
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Crisp, high-clarity off-white theme ideal for well-lit daytime study environments.
                      </p>
                    </div>
                  </button>

                  {/* Dark Mode Card */}
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 group active:scale-[0.98]",
                      theme === 'dark'
                        ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md"
                        : "bg-muted/20 border-border hover:bg-muted/40 hover:border-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Moon className="w-5 h-5" />
                      </div>
                      {theme === 'dark' && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">Active</Badge>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        Dark Mode
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Sophisticated obsidian palette crafted for eye comfort during late-night questing.
                      </p>
                    </div>
                  </button>

                  {/* System Auto Card */}
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={cn(
                      "relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 group active:scale-[0.98]",
                      theme === 'system'
                        ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md"
                        : "bg-muted/20 border-border hover:bg-muted/40 hover:border-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-muted-foreground">
                        <Laptop className="w-5 h-5" />
                      </div>
                      {theme === 'system' && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">Active</Badge>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        System Preference
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        Automatically synchronizes with your device's operating system schedule.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Theme changes take effect instantly across all tabs and components without page reload.</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Account Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto bg-background border border-red-500/30 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
          <DialogHeader className="text-left space-y-2 pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-red-600 dark:text-red-400">
                  Delete Aspirant Account
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  This action is permanent and cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Purge Warning List */}
          <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-2 text-xs text-muted-foreground">
            <span className="font-bold text-foreground block">The following data will be permanently wiped:</span>
            <ul className="space-y-1.5 list-none pl-0 text-[11px] sm:text-xs">
              <li className="flex items-start gap-1.5 text-red-700 dark:text-red-400">
                <span className="shrink-0">✕</span>
                <span>All MTLE diagnostic records, quiz logs, and mock exam scores</span>
              </li>
              <li className="flex items-start gap-1.5 text-red-700 dark:text-red-400">
                <span className="shrink-0">✕</span>
                <span>Quest Arena chapter progression, combat stars, and boss medals</span>
              </li>
              <li className="flex items-start gap-1.5 text-red-700 dark:text-red-400">
                <span className="shrink-0">✕</span>
                <span>Aspirant XP, level status, streak counter, and reagent inventory</span>
              </li>
              <li className="flex items-start gap-1.5 text-red-700 dark:text-red-400">
                <span className="shrink-0">✕</span>
                <span>Personalized study targets, audio settings, and login credentials</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleDeleteAccount} className="space-y-4 pt-1">
            {/* Password Verification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="deletePass" className="text-xs font-semibold text-foreground">
                  Confirm Current Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition"
                >
                  {showDeletePassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showDeletePassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                id="deletePass"
                type={showDeletePassword ? 'text' : 'password'}
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Enter your current password"
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>

            {/* Verification Phrase Input */}
            <div className="space-y-1.5">
              <Label htmlFor="deleteConfirmText" className="text-xs font-semibold text-foreground">
                Type <span className="font-black text-red-600 dark:text-red-400">DELETE</span> in uppercase to confirm
              </Label>
              <Input
                id="deleteConfirmText"
                type="text"
                value={deleteConfirmationText}
                onChange={e => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                required
                className="rounded-xl h-10 text-xs font-mono font-bold tracking-wider"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeletingAccount}
                className="w-full sm:w-auto rounded-xl text-xs h-10 sm:h-9 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isDeletingAccount || deleteConfirmationText.trim() !== 'DELETE' || !deletePassword}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs h-10 sm:h-9 font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    Wiping Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanently Delete
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
