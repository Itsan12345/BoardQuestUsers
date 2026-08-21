"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  LayoutGrid, 
  GraduationCap, 
  Sword, 
  Trophy, 
  Medal, 
  User as UserIcon,
  X,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MobileFloatingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function MobileFloatingSidebar({
  isOpen,
  onClose,
  user,
}: MobileFloatingSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Nav Groups matching design
  const navSections = [
    {
      id: 'overview',
      items: [
        { name: 'Dashboard', icon: LayoutGrid, href: '/' },
      ]
    },
    {
      id: 'learning',
      items: [
        { name: 'Study Subjects', icon: GraduationCap, href: '/study' },
        { name: 'Quest Arena', icon: Sword, href: '/quest' },
      ]
    },
    {
      id: 'analytics',
      items: [
        { name: 'Leaderboard', icon: Trophy, href: '/ranks' },
        { name: 'Performance Mastery', icon: Medal, href: '/performance' },
      ]
    },
    {
      id: 'user',
      items: [
        { name: 'My Profile', icon: UserIcon, href: '/profile' },
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
        aria-hidden="true"
      />

      {/* Floating Card Sidebar */}
      <div 
        className={cn(
          "fixed top-3 bottom-3 left-3 w-[calc(100%-1.5rem)] max-w-[340px] sm:max-w-[360px]",
          "bg-card text-card-foreground rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]",
          "border border-border/80 p-4 sm:p-5 flex flex-col justify-between",
          "z-[101] overflow-y-auto no-scrollbar",
          "animate-in slide-in-from-left duration-300 ease-out"
        )}
      >
        <div className="space-y-3 sm:space-y-3.5">
          {/* User Profile Card */}
          <Link
            href="/profile"
            onClick={onClose}
            className="group flex items-center justify-between p-3.5 bg-muted/50 hover:bg-muted/80 rounded-[22px] border border-border/50 transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="h-11 w-11 shrink-0 rounded-full border-2 border-background shadow-md shadow-primary/10">
                <AvatarImage 
                  src={user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} 
                  alt={user?.name || 'User avatar'}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || 'BQ'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                  {user?.name || "Student"}
                </h4>
                <p className="text-[11.5px] text-muted-foreground truncate leading-tight mt-0.5">
                  {user?.email || "student@eduph.edu"}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </Link>

          {/* Navigation Sections */}
          <div className="space-y-2 sm:space-y-2.5 pt-1">
            {navSections.map((section) => (
              <div 
                key={section.id} 
                className="bg-muted/40 rounded-[22px] p-1.5 sm:p-2 space-y-1 border border-border/40"
              >
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3.5 px-3.5 py-2.5 sm:py-3 rounded-[16px] transition-all duration-200 active:scale-[0.98]",
                        isActive 
                          ? "bg-background text-primary font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-border" 
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50 font-medium"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-primary stroke-[2.2]" : "text-muted-foreground stroke-[1.8]"
                      )} />
                      <span className="text-[13.5px] sm:text-sm tracking-tight truncate">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Mobile Theme Switcher Segment Card */}
          {mounted && (
            <div className="bg-muted/40 rounded-[22px] p-2.5 border border-border/40 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Appearance
                </span>
                <span className="text-[10px] font-semibold text-primary capitalize">
                  {theme || "System"} Mode
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-background/60 p-1 rounded-2xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95",
                    theme === 'light'
                      ? "bg-background text-primary shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  title="Light Mode"
                >
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95",
                    theme === 'dark'
                      ? "bg-background text-primary shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  title="Dark Mode"
                >
                  <Moon className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95",
                    theme === 'system'
                      ? "bg-background text-primary shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  title="System Default"
                >
                  <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Auto</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Version Footer */}
        <div className="pt-3 px-2 flex items-center justify-between">
          <p className="text-[11px] sm:text-xs text-muted-foreground/70 font-medium tracking-wide">
            BoardQuest v1.0.0
          </p>
          <span className="text-[10px] text-muted-foreground/60">
            MedTech RPG
          </span>
        </div>
      </div>
    </div>
  );
}
