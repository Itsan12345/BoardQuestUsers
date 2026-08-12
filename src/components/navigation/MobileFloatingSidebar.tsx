"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  GraduationCap, 
  Sword, 
  Trophy, 
  Medal, 
  User as UserIcon,
  X
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
        { name: 'Study Curriculum', icon: GraduationCap, href: '/study' },
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
        { name: 'My profile', icon: UserIcon, href: '/profile' },
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
          "bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)]",
          "border border-black/[0.04] p-4 sm:p-5 flex flex-col justify-between",
          "z-[101] overflow-y-auto no-scrollbar",
          "animate-in slide-in-from-left duration-300 ease-out"
        )}
      >
        <div className="space-y-3 sm:space-y-3.5">
          {/* User Profile Card */}
          <Link
            href="/profile"
            onClick={onClose}
            className="group flex items-center justify-between p-3.5 bg-[#F6F7F9] hover:bg-[#EEF0F4] rounded-[22px] border border-black/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="h-11 w-11 shrink-0 rounded-full border-2 border-white shadow-md shadow-blue-500/10">
                <AvatarImage 
                  src={user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} 
                  alt={user?.name || 'User avatar'}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || 'BQ'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-neutral-900 truncate leading-tight group-hover:text-primary transition-colors">
                  {user?.name || "Student"}
                </h4>
                <p className="text-[11.5px] text-neutral-500 truncate leading-tight mt-0.5">
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
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </Link>

          {/* Navigation Sections */}
          <div className="space-y-2.5 sm:space-y-3 pt-1">
            {navSections.map((section) => (
              <div 
                key={section.id} 
                className="bg-[#F6F7F9] rounded-[22px] p-1.5 sm:p-2 space-y-1 border border-black/[0.02]"
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
                          ? "bg-white text-primary font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03]" 
                          : "text-neutral-700 hover:text-neutral-950 hover:bg-white/60 font-medium"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-primary stroke-[2.2]" : "text-neutral-600 stroke-[1.8]"
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
        </div>

        {/* Version Footer */}
        <div className="pt-4 px-2">
          <p className="text-[11px] sm:text-xs text-neutral-400 font-medium tracking-wide">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
