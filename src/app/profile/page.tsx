"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, MapPin, Mail, Calendar as CalendarIcon, Zap, Trophy, Clock, Award, Shield, Swords, Heart, Crosshair, Sparkles, FlaskConical, Target, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { logout } from '@/app/actions/auth';
import { getUserProfile } from '@/app/actions/user';
import { useToast } from '@/hooks/use-toast';
import { BADGES, BadgeId, getLevelProgress, getRankTitle } from '@/lib/badge-system';
import { calculatePlayerStats } from '@/lib/game-logic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const BADGE_SPRITE_DEFINITIONS: Record<string, {
  title: string;
  sprite: string;
  bgGradient: string;
  borderColor: string;
}> = {
  speed: {
    title: 'Speed Master',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  'swift-solver': {
    title: 'Speed Master',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  master: {
    title: 'Master',
    sprite: '/ui/master-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  adept: {
    title: 'Adept',
    sprite: '/ui/adept-badge.png',
    bgGradient: 'from-[#7986CB] via-[#5C6BC0] to-[#3F51B5]',
    borderColor: 'border-[#303F9F]',
  },
  bronze: {
    title: 'Bronze',
    sprite: '/ui/bronze-badge.png',
    bgGradient: 'from-[#9C7A68] via-[#5D4037] to-[#2E1C14]',
    borderColor: 'border-[#271B17]',
  },
  gold: {
    title: 'Gold',
    sprite: '/ui/gold-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  silver: {
    title: 'Silver',
    sprite: '/ui/silver-badge.png',
    bgGradient: 'from-[#EEEEEE] via-[#757575] to-[#37474F]',
    borderColor: 'border-[#263238]',
  },
  'streak-7': {
    title: 'Adept',
    sprite: '/ui/adept-badge.png',
    bgGradient: 'from-[#7986CB] via-[#5C6BC0] to-[#3F51B5]',
    borderColor: 'border-[#303F9F]',
  },
  'streak-14': {
    title: 'Master',
    sprite: '/ui/master-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
  'streak-30': {
    title: 'Speed Master',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
  },
};

const DEFAULT_SHOWCASE_BADGES = [
  BADGE_SPRITE_DEFINITIONS.speed,
  BADGE_SPRITE_DEFINITIONS.master,
  BADGE_SPRITE_DEFINITIONS.adept,
  BADGE_SPRITE_DEFINITIONS.bronze,
  BADGE_SPRITE_DEFINITIONS.gold,
  BADGE_SPRITE_DEFINITIONS.silver,
];

const ALL_BADGE_TYPES = [
  {
    id: 'gold',
    title: 'Master Gold',
    sprite: '/ui/gold-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
    unlockCondition: 'Complete a quest with 100% accuracy',
    description: 'Perfect execution! Awarded for answering all quest questions correctly.',
    xpReward: 200,
  },
  {
    id: 'silver',
    title: 'Adept Silver',
    sprite: '/ui/silver-badge.png',
    bgGradient: 'from-[#EEEEEE] via-[#757575] to-[#37474F]',
    borderColor: 'border-[#263238]',
    unlockCondition: 'Complete a quest with 60-79% accuracy',
    description: 'Solid performance demonstrating strong diagnostic capability.',
    xpReward: 100,
  },
  {
    id: 'bronze',
    title: 'Bronze Aspirant',
    sprite: '/ui/bronze-badge.png',
    bgGradient: 'from-[#9C7A68] via-[#5D4037] to-[#2E1C14]',
    borderColor: 'border-[#271B17]',
    unlockCondition: 'Complete a quest with 40-59% accuracy',
    description: 'Completed a diagnostic quest with good effort.',
    xpReward: 50,
  },
  {
    id: 'speed',
    title: 'Speed Master',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
    unlockCondition: 'Complete a quest in under 2 minutes',
    description: 'Lightning fast problem solving under extreme time pressure!',
    xpReward: 75,
  },
  {
    id: 'streak-7',
    title: '7-Day Champion',
    sprite: '/ui/adept-badge.png',
    bgGradient: 'from-[#7986CB] via-[#5C6BC0] to-[#3F51B5]',
    borderColor: 'border-[#303F9F]',
    unlockCondition: 'Maintain a 7-day study streak',
    description: 'Demonstrated dedication with 7 continuous days of learning.',
    xpReward: 150,
  },
  {
    id: 'streak-14',
    title: '14-Day Unstoppable',
    sprite: '/ui/master-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
    unlockCondition: 'Maintain a 14-day study streak',
    description: 'Unstoppable momentum! 14 days of active questing.',
    xpReward: 200,
  },
  {
    id: 'streak-30',
    title: '30-Day Legend',
    sprite: '/ui/speedmaster-badge.png',
    bgGradient: 'from-[#FFB732] via-[#FFA000] to-[#F57C00]',
    borderColor: 'border-[#E67E22]',
    unlockCondition: 'Maintain a 30-day study streak',
    description: 'True legendary pathology master! 30 consecutive days.',
    xpReward: 300,
  },
];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  equippedItem?: string | null;
  inventory?: string | Record<string, number>;
  location: string;
  createdAt: Date;
  classString: string;
  userRank: number;
  rankingPercentage: number;
  achievements: Array<{
    id: string;
    task: string;
    type: string;
    xp: number;
    timestamp: Date;
    badge?: string;
    confidenceLevel?: string;
    accuracy?: number;
  }>;
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAllBadgesOpen, setViewAllBadgesOpen] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getUserProfile() as UserProfile | null;

        if (!profile) {
          // User doesn't exist, redirect to login
          router.replace('/login');
          return;
        }

        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data.",
        });
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "See you next time!",
      });
      // Use router.replace instead of window.location for better Next.js integration
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout. Please try again.",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  // Extract initials from name
  const initialsFromName = userProfile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Profile Header Card */}
        <Card className="border border-border shadow-xl rounded-2xl sm:rounded-3xl bg-background overflow-hidden">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 sm:gap-8 w-full">
              <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start md:items-center justify-between">
                {/* Avatar and Info */}
                <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
                  <Avatar className="h-16 w-16 sm:h-24 sm:w-24 border-4 border-primary/20 shrink-0">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-[#8B0000] text-white text-xl sm:text-2xl font-semibold">
                      {initialsFromName}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
                    <div>
                      <h1 className="text-xl sm:text-3xl font-semibold text-foreground truncate">{userProfile.name}</h1>
                      <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1 mt-0.5 sm:mt-1">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {userProfile.location}
                      </p>
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 flex-wrap mt-1">
                      <Badge className="bg-[#8B0000] text-white font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1">
                        LVL {userProfile.level} {getRankTitle(userProfile.level).toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="border-[#8B0000] text-[#8B0000] font-semibold text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1">
                        {userProfile.classString}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none rounded-xl border-[#8B0000] text-[#8B0000] font-semibold text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                  >
                    <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Account Settings
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 md:flex-none rounded-xl bg-[#8B0000] hover:bg-[#660000] text-white font-semibold text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Logout
                  </Button>
                </div>
              </div>

              {/* XP Progress Bar */}
              {(() => {
                const progress = getLevelProgress(userProfile.xp);
                return (
                  <div className="flex flex-col gap-1 w-full mt-1 sm:mt-2">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">XP Progress</span>
                      <span className="text-[10px] font-bold text-[#8B0000]">
                        {progress.currentLevelXp} <span className="text-muted-foreground">/ {progress.xpForNextLevel}</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-[#8B0000]/80 to-[#8B0000] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Stats and Achievements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="space-y-6">
            {/* Subtle & Minimalistic RPG Combat Stats Card */}
            {(() => {
              const localEquipped = typeof window !== 'undefined' ? localStorage.getItem('boardquest_equipped_reagent') : null;
              const activeEquippedItem = userProfile.equippedItem && userProfile.equippedItem !== 'none' ? userProfile.equippedItem : localEquipped;
              const stats = calculatePlayerStats(userProfile.level, userProfile.streak, activeEquippedItem);

              return (
                <Card className="border border-border shadow-md rounded-2xl bg-card overflow-hidden">
                  <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Swords className="w-4 h-4 text-[#8B0000]" />
                      Combat Attributes
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-semibold text-[#8B0000] border-[#8B0000]/30 px-2 py-0.5">
                      LVL {userProfile.level}
                    </Badge>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 pt-1 space-y-3">
                    {/* Minimal Stat Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Health Points (HP) */}
                      <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600/20" />
                          <span className="text-xs font-medium text-muted-foreground">Health</span>
                        </div>
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                          {stats.maxHp} HP
                        </span>
                      </div>

                      {/* Attack Damage (ATK) */}
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Swords className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-medium text-muted-foreground">Damage</span>
                        </div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          {stats.totalDamage} DMG
                        </span>
                      </div>

                      {/* Defense (Armor) */}
                      <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-sky-600" />
                          <span className="text-xs font-medium text-muted-foreground">Defense</span>
                        </div>
                        <span className="text-xs font-bold text-sky-700 dark:text-sky-400">
                          {stats.defense} DEF
                        </span>
                      </div>

                      {/* Precision / Crit Rate */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-xs font-medium text-muted-foreground">Crit Rate</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {stats.critRate}%
                        </span>
                      </div>
                    </div>

                    {/* Multiplier & Equipped Gear Minimal Row */}
                    <div className="flex items-center justify-between pt-1.5 text-xs border-t border-border/50">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                        <span className="text-[11px]">Boost: <strong className="text-foreground">{stats.multiplier}x</strong></span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                        <span>{stats.equippedItemIcon}</span>
                        <span className="truncate max-w-[130px]" title={stats.equippedItemName}>
                          {stats.equippedItemName}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Aspirants Stats Card */}
            <Card className="border border-border shadow-lg rounded-2xl">
              <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                  Aspirants Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 shrink-0" />
                    <span className="font-semibold text-xs sm:text-sm text-foreground">{userProfile.streak} Days Streak</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 font-semibold text-[10px]">+20% XP</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                    <span className="text-slate-600 font-medium truncate" title={userProfile.email}>{userProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                    <span className="text-slate-600 font-medium">
                      Joined {format(new Date(userProfile.createdAt), 'MMMM yyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Ranking Card */}
            <Card className="border border-border shadow-lg rounded-2xl bg-[#8B0000] text-white">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-semibold">Top {userProfile.rankingPercentage}%</p>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-white/80 mt-1">
                    Global Ranking
                  </p>
                </div>
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 shrink-0" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Achievements and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Achievements/Badges Grid (Dynamic Earned Badges Only) */}
            <Card className="border border-border shadow-lg rounded-2xl overflow-hidden bg-background">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-[#8B0000]" />
                    <CardTitle className="text-xl font-bold text-foreground">
                      Achievements
                    </CardTitle>
                  </div>
                  <button
                    onClick={() => setViewAllBadgesOpen(true)}
                    className="text-sm font-semibold text-[#8B0000] underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    View ALL
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Badges earned through your BoardQuest journey.
                </p>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-2 sm:pt-2 pb-4 sm:pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                  {(() => {
                    const earnedBadgeMap = new Map<string, typeof BADGE_SPRITE_DEFINITIONS[string]>();
                    userProfile.achievements?.forEach(a => {
                      if (a.badge && BADGE_SPRITE_DEFINITIONS[a.badge]) {
                        const def = BADGE_SPRITE_DEFINITIONS[a.badge];
                        if (!earnedBadgeMap.has(def.title)) {
                          earnedBadgeMap.set(def.title, def);
                        }
                      }
                    });

                    const earnedBadgesList = Array.from(earnedBadgeMap.values());
                    const lockedCount = Math.max(0, 8 - earnedBadgesList.length);

                    return (
                      <>
                        {earnedBadgesList.map((badge, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "relative aspect-[0.95/1] rounded-[18px] sm:rounded-[22px] p-2.5 sm:p-3 flex flex-col items-center justify-between border-2 shadow-md hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden group bg-gradient-to-b animate-in fade-in zoom-in duration-300",
                              badge.bgGradient,
                              badge.borderColor
                            )}
                            title={badge.title}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20 pointer-events-none" />

                            <div className="flex-1 flex items-center justify-center w-full pt-1">
                              <img
                                src={badge.sprite}
                                alt={badge.title}
                                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] group-hover:scale-110 transition-transform duration-200"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            </div>

                            <span
                              className="font-bytebounce text-white text-[10px] sm:text-sm md:text-base tracking-wide text-center leading-none mb-0.5"
                              style={{
                                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8)'
                              }}
                            >
                              {badge.title}
                            </span>
                          </div>
                        ))}

                        {[...Array(lockedCount)].map((_, i) => (
                          <div
                            key={`locked-${i}`}
                            className="aspect-[0.95/1] rounded-[18px] sm:rounded-[22px] bg-[#EBEBEB] border-2 border-transparent flex items-center justify-center p-3 sm:p-4"
                          >
                            <Shield className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#8B0000] stroke-[2.2]" />
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-border shadow-lg rounded-2xl">
              <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B0000] shrink-0" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-2.5 sm:space-y-3">
                  {userProfile.achievements && userProfile.achievements.length > 0 ? (
                    userProfile.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center justify-between p-2.5 sm:p-3 border border-border rounded-lg hover:bg-muted transition gap-2"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B0000]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{achievement.task}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {format(new Date(achievement.timestamp), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-[#8B0000] text-xs sm:text-sm shrink-0">+{achievement.xp} XP</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No activities yet. Start questing!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hall of Achievements Dialog */}
      <Dialog open={viewAllBadgesOpen} onOpenChange={setViewAllBadgesOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          {(() => {
            if (!userProfile) return null;

            const earnedBadgeIds = new Set(
              userProfile.achievements
                ?.map(a => a.badge)
                .filter((b): b is string => Boolean(b)) || []
            );

            const earnedCount = ALL_BADGE_TYPES.filter(b => 
              earnedBadgeIds.has(b.id) || (b.id === 'speed' && earnedBadgeIds.has('swift-solver'))
            ).length;

            const filteredBadges = ALL_BADGE_TYPES.filter(badge => {
              const isEarned = earnedBadgeIds.has(badge.id) || (badge.id === 'speed' && earnedBadgeIds.has('swift-solver'));
              if (badgeFilter === 'earned') return isEarned;
              if (badgeFilter === 'locked') return !isEarned;
              return true;
            });

            return (
              <>
                <DialogHeader className="pb-3 sm:pb-4 border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pr-6">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="p-2 sm:p-2.5 bg-[#8B0000]/10 border border-[#8B0000]/20 rounded-xl sm:rounded-2xl shrink-0">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B0000]" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg sm:text-2xl font-bold text-foreground">
                          Hall of Achievements
                        </DialogTitle>
                        <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                          All badges unlocked through your BoardQuest journey
                        </DialogDescription>
                      </div>
                    </div>

                    <Badge className="bg-[#8B0000] text-white font-bold text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 self-start sm:self-auto">
                      {earnedCount} / {ALL_BADGE_TYPES.length} UNLOCKED
                    </Badge>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-1.5 sm:gap-2 pt-3 sm:pt-4 flex-wrap">
                    <Button
                      size="sm"
                      variant={badgeFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setBadgeFilter('all')}
                      className={cn("rounded-xl text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 h-7 sm:h-8 flex-1 sm:flex-none justify-center", badgeFilter === 'all' && "bg-[#8B0000] hover:bg-[#660000] text-white")}
                    >
                      All Badges ({ALL_BADGE_TYPES.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={badgeFilter === 'earned' ? 'default' : 'outline'}
                      onClick={() => setBadgeFilter('earned')}
                      className={cn("rounded-xl text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 h-7 sm:h-8 flex-1 sm:flex-none justify-center", badgeFilter === 'earned' && "bg-[#8B0000] hover:bg-[#660000] text-white")}
                    >
                      Unlocked ({earnedCount})
                    </Button>
                    <Button
                      size="sm"
                      variant={badgeFilter === 'locked' ? 'default' : 'outline'}
                      onClick={() => setBadgeFilter('locked')}
                      className={cn("rounded-xl text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 h-7 sm:h-8 flex-1 sm:flex-none justify-center", badgeFilter === 'locked' && "bg-[#8B0000] hover:bg-[#660000] text-white")}
                    >
                      Locked ({ALL_BADGE_TYPES.length - earnedCount})
                    </Button>
                  </div>
                </DialogHeader>

                {/* Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-3">
                  {filteredBadges.map((badge) => {
                    const earnedAchievement = userProfile.achievements?.find(
                      a => a.badge === badge.id || (badge.id === 'speed' && a.badge === 'swift-solver')
                    );
                    const isEarned = !!earnedAchievement;

                    return (
                      <div
                        key={badge.id}
                        className={cn(
                          "p-3 sm:p-3.5 rounded-2xl border flex items-start gap-3 sm:gap-3.5 transition-all",
                          isEarned
                            ? "bg-card border-amber-300/80 dark:border-amber-900/50 shadow-sm"
                            : "bg-muted/30 border-border/50 opacity-80"
                        )}
                      >
                        {/* Badge Sprite / Lock Icon */}
                        <div className="relative shrink-0">
                          <div className={cn(
                            "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-1.5 flex items-center justify-center border-2 shadow-sm bg-gradient-to-b",
                            isEarned ? `${badge.bgGradient} ${badge.borderColor}` : "from-slate-200 to-slate-300 border-slate-300 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700"
                          )}>
                            {isEarned ? (
                              <img
                                src={badge.sprite}
                                alt={badge.title}
                                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            ) : (
                              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                            )}
                          </div>
                          {isEarned && (
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Badge Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{badge.title}</h4>
                            <Badge
                              variant={isEarned ? "default" : "secondary"}
                              className={cn("text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 uppercase tracking-wider font-semibold shrink-0", isEarned ? "bg-amber-500 text-black" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}
                            >
                              {isEarned ? `+${badge.xpReward} XP` : "Locked"}
                            </Badge>
                          </div>

                          <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                            {badge.description}
                          </p>

                          <div className="pt-0.5 text-[10px] text-muted-foreground font-medium">
                            {isEarned && earnedAchievement?.timestamp ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                Unlocked {format(new Date(earnedAchievement.timestamp), 'MMM dd, yyyy')}
                              </span>
                            ) : (
                              <span className="text-slate-500">
                                Requirement: {badge.unlockCondition}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
