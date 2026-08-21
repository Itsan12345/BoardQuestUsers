
"use client";

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { MobileFloatingSidebar } from '@/components/navigation/MobileFloatingSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getUserProfile } from '@/app/actions/user';
import { getLevelProgress } from '@/lib/badge-system';

import { NotificationBell } from '@/components/navigation/NotificationBell';
import { TourButton } from '@/components/tour/TourButton';
import { TourProvider } from '@/components/tour/TourProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    async function loadUser() {
      if (isLoggedIn) {
        try {
          const profile = await getUserProfile();
          if (profile && isSubscribed) {
            setUser(profile);
            setProgress(getLevelProgress(profile.xp));
          }
        } catch (error) {
          console.warn('Failed to load user profile in layout:', error);
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
      isSubscribed = false;
      window.removeEventListener('bq_settings_updated', handleUpdate);
      window.removeEventListener('bq_stats_updated', handleUpdate);
    };
  }, [isLoggedIn]); // Re-fetch on auth and event triggers, avoiding redundant calls on route navigation

  // Hide navigation on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';

  if (isAuthPage) {
    return <div className="w-full min-h-screen bg-background">{children}</div>;
  }

  return (
    <TourProvider isLoggedIn={isLoggedIn}>
      <div className="relative flex flex-col min-h-screen w-full bg-background text-foreground">
        {/* Professional Overlapping Top Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-3 sm:px-4 lg:px-6 shadow-sm transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
            {/* Desktop Sidebar Toggle */}
            <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors hidden lg:flex" />

            {/* Mobile Floating Menu Hamburger Trigger */}
            <Button
              id="tour-mobile-nav-trigger"
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-foreground hover:text-primary hover:bg-muted h-9 w-9 -ml-1 rounded-xl transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/images/boardquestlogo2.png"
                alt="BoardQuest Logo"
                width={28}
                height={28}
                priority
                className="h-7 w-7 mt-2 object-contain"
              />
              <span className="font-black text-foreground leading-none text-base lg:text-lg hidden sm:inline-block" style={{ fontFamily: "'Akira Expanded', sans-serif" }}>BoardQuest</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* Theme Toggle (Desktop Only - Mobile uses Floating Sidebar) */}
            <ThemeToggle className="hidden lg:inline-flex" />

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

        {/* Floating Sidebar Navigation on Mobile/Tablet */}
        <MobileFloatingSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          user={user}
        />
      </div>
    </TourProvider>
  );
}
