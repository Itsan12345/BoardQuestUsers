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
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import {
  updateUserProfileDetails,
  changeUserPassword,
  exportUserStudyData,
  getUserSettingsAction,
  saveUserSettingsAction,
} from '@/app/actions/user';
import { SUBJECT_AREAS } from '@/lib/game-logic';
import { startTourByKey, isTourCompleted } from '@/lib/tour-config';
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
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  userProfile,
  onProfileUpdated,
}: AccountSettingsDialogProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  // Form states - Profile
  const [name, setName] = useState(userProfile.name || '');
  const [location, setLocation] = useState(userProfile.location || 'Cebu, Philippines');
  const [school, setSchool] = useState('Southwestern University PHINMA');
  const [targetBatch, setTargetBatch] = useState('August 2025 MTLE');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form states - Study Goals
  const [dailyQuota, setDailyQuota] = useState('50');
  const [focusSubject, setFocusSubject] = useState(SUBJECT_AREAS[0]);
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

  // Form states - Data Export
  const [isExporting, setIsExporting] = useState(false);

  // Sync initial user values
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setLocation(userProfile.location || 'Cebu, Philippines');
    }

    async function loadSettings() {
      try {
        const dbSettings = await getUserSettingsAction();
        if (dbSettings) {
          if (dbSettings.dailyQuota) setDailyQuota(String(dbSettings.dailyQuota));
          if (dbSettings.focusSubject) setFocusSubject(dbSettings.focusSubject);
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
          if (dbSettings.targetBatch) setTargetBatch(dbSettings.targetBatch);
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
      const tourKey = `settings_${activeTab}`;
      if (!isTourCompleted(tourKey)) {
        const timer = setTimeout(() => {
          startTourByKey(tourKey, false);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [open]);

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

      // Save academic fields to MongoDB & localStorage
      localStorage.setItem('bq_pref_school', school);
      localStorage.setItem('bq_pref_target_batch', targetBatch);
      await saveUserSettingsAction({ school, targetBatch });

      window.dispatchEvent(new CustomEvent('bq_settings_updated', {
        detail: { school, targetBatch }
      }));

      toast({
        title: 'Profile Updated',
        description: 'Your academic credentials have been saved.',
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
      localStorage.setItem('bq_pref_focus_subject', focusSubject);
      localStorage.setItem('bq_pref_default_diff', defaultDifficulty);
      localStorage.setItem('bq_pref_confidence_prompts', String(confidencePrompts));

      await saveUserSettingsAction({
        dailyQuota: parseInt(dailyQuota, 10),
        focusSubject,
        defaultDifficulty,
        confidencePrompts,
      });

      window.dispatchEvent(new CustomEvent('bq_settings_updated', {
        detail: {
          dailyQuota: parseInt(dailyQuota, 10),
          focusSubject,
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

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'None', color: 'bg-slate-200', width: '0%' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '30%' };
    if (pass.length < 10) return { label: 'Good', color: 'bg-amber-500', width: '65%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-7">
        <DialogHeader className="pb-4 border-b border-border">
          <div id="tour-settings-header" className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#8B0000]/10 border border-[#8B0000]/20 rounded-2xl">
                <Shield className="w-6 h-6 text-[#8B0000]" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                  Account Settings
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Manage your academic credentials, review goals, and security preferences
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleStartTabTour(activeTab, true)}
              className="h-8 px-2.5 sm:px-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold flex items-center gap-1.5 transition-all text-foreground/80 hover:text-primary shrink-0"
              title="Explain current tab settings"
            >
              <Compass className="w-3.5 h-3.5 text-primary shrink-0 transition-transform group-hover:rotate-45" />
              <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Guide</span>
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full pt-2">
          {/* Tabs navigation bar */}
          <TabsList className="w-full flex flex-wrap h-auto p-1.5 bg-muted/60 rounded-2xl border border-border/50 gap-1">
            <TabsTrigger
              id="tour-settings-tab-profile"
              value="profile"
              className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger
              id="tour-settings-tab-goals"
              value="goals"
              className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5" /> Goals
            </TabsTrigger>
            <TabsTrigger
              id="tour-settings-tab-appearance"
              value="appearance"
              className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <Palette className="w-3.5 h-3.5" /> Appearance
            </TabsTrigger>
            <TabsTrigger
              id="tour-settings-tab-audio"
              value="audio"
              className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" /> Audio & FX
            </TabsTrigger>
            <TabsTrigger
              id="tour-settings-tab-alerts"
              value="alerts"
              className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" /> Alerts
            </TabsTrigger>
            <TabsTrigger
              id="tour-settings-tab-security"
              value="security"
              className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" /> Security
            </TabsTrigger>
            <TabsTrigger
              id="tour-settings-tab-records"
              value="records"
              className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Records
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Profile & Academic Identity */}
          <TabsContent value="profile" className="pt-4 space-y-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div id="tour-profile-identity" className="p-4 bg-muted/30 border border-border rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#8B0000] text-white flex items-center justify-center text-xl font-bold border-4 border-primary/20 shadow-md">
                  {name
                    ? name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'A'}
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="font-bold text-base text-foreground">{name || 'Medical Technology Aspirant'}</h3>
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified Candidate
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Level {userProfile.level} • {userProfile.classString}
                  </p>
                </div>
              </div>

              <div id="tour-profile-academic" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Reynaldo Adriano"
                    className="rounded-xl h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Registered Email Address
                  </Label>
                  <Input
                    id="email"
                    value={userProfile.email}
                    disabled
                    className="rounded-xl h-10 text-sm bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="school" className="text-xs font-semibold flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-[#8B0000]" /> University / Review Center
                  </Label>
                  <Input
                    id="school"
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    placeholder="Southwestern University PHINMA"
                    className="rounded-xl h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="targetBatch" className="text-xs font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#8B0000]" /> Target MTLE Season
                  </Label>
                  <Select value={targetBatch} onValueChange={setTargetBatch}>
                    <SelectTrigger className="rounded-xl h-10 text-sm">
                      <SelectValue placeholder="Select target examination batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="August 2025 MTLE">August 2025 MTLE</SelectItem>
                      <SelectItem value="March 2026 MTLE">March 2026 MTLE</SelectItem>
                      <SelectItem value="August 2026 MTLE">August 2026 MTLE</SelectItem>
                      <SelectItem value="March 2027 MTLE">March 2027 MTLE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="location" className="text-xs font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8B0000]" /> Regional Testing Hub / City
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Cebu City, Philippines"
                    className="rounded-xl h-10 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  id="tour-profile-save"
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-[#8B0000] hover:bg-[#660000] text-white rounded-xl font-semibold text-xs px-5 h-9"
                >
                  {isSavingProfile && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Save Profile Details
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: Study Goals & Targets */}
          <TabsContent value="goals" className="pt-4 space-y-5">
            <div className="space-y-4">
              <div id="tour-goals-quota" className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-foreground">Daily Question Target</Label>
                    <p className="text-xs text-muted-foreground">Target questions to complete every day</p>
                  </div>
                  <Badge className="bg-[#8B0000] text-white text-xs font-bold px-2.5 py-0.5">
                    {dailyQuota} Questions/Day
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {['20', '50', '100', '150'].map(quota => (
                    <Button
                      key={quota}
                      type="button"
                      size="sm"
                      variant={dailyQuota === quota ? 'default' : 'outline'}
                      onClick={() => setDailyQuota(quota)}
                      className={cn(
                        'flex-1 rounded-xl text-xs font-semibold h-8',
                        dailyQuota === quota && 'bg-[#8B0000] hover:bg-[#660000] text-white'
                      )}
                    >
                      {quota} Qs
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div id="tour-goals-focus" className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Priority Focus Subject</Label>
                  <p className="text-xs text-muted-foreground">Subject highlighted first in Study Arena</p>
                  <Select value={focusSubject} onValueChange={setFocusSubject}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Select focus subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_AREAS.map(sub => (
                        <SelectItem key={sub} value={sub} className="text-xs">
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div id="tour-goals-diff" className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Starting Quiz Difficulty</Label>
                  <p className="text-xs text-muted-foreground">Default combat difficulty in Boss Rush</p>
                  <Select value={defaultDifficulty} onValueChange={setDefaultDifficulty}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY" className="text-xs">Easy Mode (0.85x Damage)</SelectItem>
                      <SelectItem value="MEDIUM" className="text-xs">Standard Board Simulation (1.0x)</SelectItem>
                      <SelectItem value="HARD" className="text-xs">Hardcore Examiner Mode (1.25x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div id="tour-goals-confidence" className="p-4 bg-muted/20 border border-border rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-sm font-semibold text-foreground">Confidence Rating Prompts</Label>
                  <p className="text-xs text-muted-foreground">
                    Prompt for confidence level (Shaky / Steady / Unyielding) to gain bonus XP multipliers
                  </p>
                </div>
                <Switch checked={confidencePrompts} onCheckedChange={setConfidencePrompts} />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  id="tour-goals-save"
                  type="button"
                  onClick={handleSaveGoals}
                  className="bg-[#8B0000] hover:bg-[#660000] text-white rounded-xl font-semibold text-xs px-5 h-9"
                >
                  Save Study Preferences
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: Audio & RPG FX */}
          <TabsContent value="audio" className="pt-4 space-y-5">
            <div className="space-y-4">
              <div id="tour-audio-sfx" className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#8B0000]" />
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
                  className="bg-[#8B0000] hover:bg-[#660000] text-white rounded-xl font-semibold text-xs px-5 h-9"
                >
                  Save Audio Preferences
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: Notifications & Alerts */}
          <TabsContent value="alerts" className="pt-4 space-y-5">
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
                  className="bg-[#8B0000] hover:bg-[#660000] text-white rounded-xl font-semibold text-xs px-5 h-9"
                >
                  Save Notification Alerts
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: Security & Password */}
          <TabsContent value="security" className="pt-4 space-y-5">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div id="tour-security-password" className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">Update Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition"
                  >
                    {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPasswords ? 'Hide' : 'Show'} Passwords
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="currentPass" className="text-xs font-semibold">Current Password</Label>
                    <Input
                      id="currentPass"
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="newPass" className="text-xs font-semibold">New Password</Label>
                    <Input
                      id="newPass"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="rounded-xl h-9 text-xs"
                    />
                    {newPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all duration-300", passwordStrength.color)} style={{ width: passwordStrength.width }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">Strength: {passwordStrength.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="confirmPass" className="text-xs font-semibold">Confirm New Password</Label>
                    <Input
                      id="confirmPass"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    id="tour-security-save"
                    type="submit"
                    disabled={isChangingPassword}
                    className="bg-[#8B0000] hover:bg-[#660000] text-white rounded-xl font-semibold text-xs px-5 h-9"
                  >
                    {isChangingPassword && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </div>

              {/* Active Session Info */}
              <div id="tour-security-session" className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#8B0000]" />
                    <span className="text-xs font-semibold text-foreground">Current Active Session</span>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                    Active Now
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Signed in via Web Client • TLS 1.3 End-to-End Encryption
                </p>
              </div>
            </form>
          </TabsContent>

          {/* TAB 6: Records & Data Export */}
          <TabsContent value="records" className="pt-4 space-y-5">
            <div className="space-y-4">
              <div id="tour-records-export" className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Certified Study Transcript</h4>
                    <p className="text-xs text-muted-foreground">Download a complete structured record of subject masteries, mock exams, and earned badges</p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="bg-[#8B0000] hover:bg-[#660000] text-white rounded-xl font-semibold text-xs px-4 h-9 flex items-center gap-1.5"
                  >
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Export Data (JSON)
                  </Button>
                </div>
              </div>

              <div id="tour-records-mentor" className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Academic Mentor Verification:</strong>
                  Your study transcripts can be shared with review center professors and mentors to verify diagnostic mastery prior to the board exams.
                </div>
              </div>
            </div>
          </TabsContent>
          {/* TAB 7: Appearance & Theme Mode */}
          <TabsContent value="appearance" className="pt-4 space-y-5">
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
  );
}
