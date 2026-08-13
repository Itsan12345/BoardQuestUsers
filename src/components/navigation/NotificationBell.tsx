import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Flame, Target, Calendar, Trophy, Check, Sparkles, ChevronRight, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  generateDynamicNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from '@/lib/notifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  user: any;
}

export function NotificationBell({ user }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const notifs = generateDynamicNotifications(user);
    setNotifications(notifs);

    const handleSync = () => {
      setNotifications(generateDynamicNotifications(user));
    };

    window.addEventListener('bq_settings_updated', handleSync);
    window.addEventListener('bq_stats_updated', handleSync);

    // Refresh every 60s
    const interval = setInterval(() => {
      setNotifications(generateDynamicNotifications(user));
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bq_settings_updated', handleSync);
      window.removeEventListener('bq_stats_updated', handleSync);
    };
  }, [user]);

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
    setOpen(false);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    markNotificationAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />

          {/* Facebook-style Red Notification Badge */}
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
        className="w-[calc(100vw-20px)] max-w-[360px] sm:w-96 max-h-[75vh] sm:max-h-[80vh] overflow-y-auto p-0 rounded-2xl border border-border shadow-2xl bg-background"
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
              const Icon =
                n.type === 'streak_warning' || n.type === 'streak_lost'
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
                    'group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2',
                    n.type === 'streak_lost'
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
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'p-1.5 rounded-lg shrink-0',
                          n.type === 'streak_lost'
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
                      <span
                        className={cn(
                          'text-xs font-bold truncate',
                          n.type === 'streak_lost'
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

                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    {n.message}
                  </p>

                  {n.link && (
                    <div className="pl-7 pt-1">
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
                    </div>
                  )}

                  {/* Unread indicator dot */}
                  {!n.read && (
                    <div className="absolute top-3 right-2 w-2 h-2 rounded-full bg-red-600" />
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
                No active streak alerts or unread reminders right now.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
