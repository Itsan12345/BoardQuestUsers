"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Flame,
  Target,
  Calendar,
  Trophy,
  Check,
  Sparkles,
  ChevronRight,
  X,
  GraduationCap,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  generateDynamicNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from '@/lib/notifications';
import {
  getStudentGuidanceAssignmentsAction,
  type GuidanceAssignmentRecord,
} from '@/app/actions/guidance';
import { GuidanceCounselingDialog } from '@/components/guidance/GuidanceCounselingDialog';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  user: any;
}

export function NotificationBell({ user }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [guidanceList, setGuidanceList] = useState<GuidanceAssignmentRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedGuidance, setSelectedGuidance] = useState<GuidanceAssignmentRecord | null>(null);
  const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);

  const fetchGuidanceAndSync = useCallback(async () => {
    try {
      const res = await getStudentGuidanceAssignmentsAction();
      const list = res.success && res.data ? res.data : [];
      setGuidanceList(list);
      const notifs = generateDynamicNotifications(user, list);
      setNotifications(notifs);
    } catch (e) {
      const notifs = generateDynamicNotifications(user, []);
      setNotifications(notifs);
    }
  }, [user]);

  useEffect(() => {
    fetchGuidanceAndSync();

    const handleSync = () => {
      fetchGuidanceAndSync();
    };

    window.addEventListener('bq_settings_updated', handleSync);
    window.addEventListener('bq_stats_updated', handleSync);
    window.addEventListener('bq_guidance_updated', handleSync);

    return () => {
      window.removeEventListener('bq_settings_updated', handleSync);
      window.removeEventListener('bq_stats_updated', handleSync);
      window.removeEventListener('bq_guidance_updated', handleSync);
    };
  }, [fetchGuidanceAndSync]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(notifications);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleItemClick = (n: AppNotification) => {
    markNotificationAsRead(n.id);
    setNotifications(prev =>
      prev.map(item => (item.id === n.id ? { ...item, read: true } : item))
    );

    if (n.type === 'guidance' || n.type === 'guidance_resolved') {
      if (n.guidanceData) {
        setSelectedGuidance(n.guidanceData);
      } else if (n.guidanceId) {
        const found = guidanceList.find(g => g.id === n.guidanceId);
        if (found) setSelectedGuidance(found);
      }
      setIsGuidanceDialogOpen(true);
      setOpen(false);
      return;
    }

    setOpen(false);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    markNotificationAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />

            {/* Red Notification Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          collisionPadding={10}
          className="w-[calc(100vw-20px)] max-w-[380px] sm:w-[410px] max-h-[75vh] sm:max-h-[82vh] overflow-y-auto p-0 rounded-2xl border border-border shadow-2xl bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red-500/15 text-red-600 border border-red-500/30 text-[10px] font-bold px-1.5 py-0">
                  {unreadCount} New
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium"
              >
                <Check className="w-3.5 h-3.5" /> Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="p-2 space-y-2">
            {notifications.length > 0 ? (
              notifications.map(n => {
                const isGuidance = n.type === 'guidance';
                const isGuidanceResolved = n.type === 'guidance_resolved';

                const Icon = isGuidance || isGuidanceResolved
                  ? GraduationCap
                  : n.type === 'streak_warning' || n.type === 'streak_lost'
                  ? Flame
                  : n.type === 'daily_goal'
                  ? Target
                  : n.type === 'achievement'
                  ? Trophy
                  : Calendar;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      'group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2',
                      isGuidance
                        ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/60 hover:bg-amber-500/15 shadow-sm'
                        : isGuidanceResolved
                        ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/15'
                        : n.type === 'streak_lost'
                        ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/15'
                        : n.isUrgent
                        ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10'
                        : n.type === 'achievement'
                        ? 'bg-amber-500/5 border-amber-500/25 hover:bg-amber-500/10'
                        : n.read
                        ? 'bg-background border-border/60 hover:bg-muted/40'
                        : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            'p-1.5 rounded-lg shrink-0',
                            isGuidance
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : isGuidanceResolved
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : n.type === 'streak_lost'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                              : n.isUrgent
                              ? 'bg-red-100 dark:bg-red-950 text-red-600'
                              : n.type === 'achievement'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={cn(
                              'text-xs font-bold block truncate',
                              isGuidance
                                ? 'text-amber-800 dark:text-amber-300'
                                : isGuidanceResolved
                                ? 'text-emerald-800 dark:text-emerald-300'
                                : n.type === 'streak_lost'
                                ? 'text-rose-700 dark:text-rose-400'
                                : n.isUrgent
                                ? 'text-red-700 dark:text-red-400'
                                : n.type === 'achievement'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-foreground'
                            )}
                          >
                            {n.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {n.timestamp}
                        </span>
                        <button
                          onClick={e => handleDismiss(e, n.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-muted text-muted-foreground transition-opacity"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Guidance Specific Advisor Tag */}
                    {(isGuidance || isGuidanceResolved) && n.advisorName && (
                      <div className="flex items-center gap-2 pl-7 flex-wrap">
                        <span className="text-[11px] font-semibold text-foreground/80 bg-background/80 px-2 py-0.5 rounded-md border border-border/60 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-primary" /> Advisor: {n.advisorName}
                        </span>
                        {n.subjectCategory && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            {n.subjectCategory}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                      {n.message}
                    </p>

                    {/* Action Button */}
                    <div className="pl-7 pt-1">
                      {isGuidance || isGuidanceResolved ? (
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleItemClick(n);
                          }}
                          className={cn(
                            'h-7 rounded-lg text-xs font-bold px-3 flex items-center gap-1 shadow-sm',
                            isGuidance
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          )}
                        >
                          {n.actionLabel || 'View Guidance Brief'} <ChevronRight className="w-3 h-3" />
                        </Button>
                      ) : n.link ? (
                        <Link href={n.link} onClick={() => setOpen(false)}>
                          <Button
                            size="sm"
                            className={cn(
                              'h-7 rounded-lg text-xs font-bold px-3 flex items-center gap-1',
                              n.type === 'streak_lost'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : n.isUrgent
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : n.type === 'achievement'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-primary hover:bg-primary/90 text-white'
                            )}
                          >
                            {n.actionLabel || 'View'} <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      ) : null}
                    </div>

                    {/* Unread indicator dot */}
                    {!n.read && (
                      <div
                        className={cn(
                          'absolute top-3 right-2 w-2 h-2 rounded-full',
                          isGuidance ? 'bg-amber-500 ring-2 ring-amber-500/30' : 'bg-red-600'
                        )}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">
                  No active streak alerts or unread guidance referrals right now.
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Global Guidance Counseling Dialog */}
      <GuidanceCounselingDialog
        guidance={selectedGuidance}
        open={isGuidanceDialogOpen}
        onOpenChange={setIsGuidanceDialogOpen}
        onAcknowledged={fetchGuidanceAndSync}
      />
    </>
  );
}
