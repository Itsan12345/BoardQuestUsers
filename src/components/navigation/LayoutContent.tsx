
"use client";

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getUserProfile } from '@/app/actions/user';
import { getLevelProgress } from '@/lib/badge-system';

import { NotificationBell } from '@/components/navigation/NotificationBell';
import { TourButton } from '@/components/tour/TourButton';
import { TourProvider } from '@/components/tour/TourProvider';

export function LayoutContent({ 
  children, 
  isLoggedIn 
}: { 
  children: React.ReactNode; 
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<{ currentLevelXp: number, xpForNextLevel: number, percentage: number } | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (isLoggedIn) {
        const profile = await getUserProfile();
        if (profile) {
          setUser(profile);
          setProgress(getLevelProgress(profile.xp));
        }
      }
    }
    loadUser();

    const handleUpdate = () => {
      loadUser();
    };

    window.addEventListener('bq_settings_updated', handleUpdate);
    window.addEventListener('bq_stats_updated', handleUpdate);

    return () => {
      window.removeEventListener('bq_settings_updated', handleUpdate);
      window.removeEventListener('bq_stats_updated', handleUpdate);
    };
  }, [isLoggedIn, pathname]); // Re-fetch on navigation and events
  
  // Hide navigation on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  if (isAuthPage) {
    return <div className="w-full min-h-screen">{children}</div>;
  }

  return (
    <TourProvider isLoggedIn={isLoggedIn}>
      <div className="relative flex flex-col min-h-screen w-full pb-20 lg:pb-0">
        {/* Professional Overlapping Top Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur-md px-3 sm:px-4 lg:px-6 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors hidden lg:flex" />
            <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity min-w-0">
              <div className="p-1 sm:p-1.5 rounded-lg shrink-0">
                <img
                  src="/images/boardquestlogo2.png"
                  alt="BoardQuest Logo"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                />
              </div>
              <span className="font-black text-foreground leading-none text-sm sm:text-base lg:text-lg truncate" style={{ fontFamily: "'Akira Expanded', sans-serif" }}>BoardQuest</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3.5 shrink-0">
            {/* Interactive Feature Guide Tour Button */}
            <TourButton />

            {/* Dynamic Notification Bell */}
            <NotificationBell user={user} />

            <Link href="/profile">
              <Avatar className="h-8 w-8 lg:h-9 lg:w-9 border border-border shadow-sm hover:ring-2 ring-primary/20 transition-all cursor-pointer">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                  {user?.name?.substring(0, 2).toUpperCase() || 'AR'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <div className="flex flex-1 pt-16">
          {/* Sidebar visible only on desktop */}
          <div className="hidden lg:block">
            <AppSidebar />
          </div>
          <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {children}
          </main>
        </div>

        {/* Bottom Nav visible only on mobile/tablet */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </TourProvider>
  );
}
