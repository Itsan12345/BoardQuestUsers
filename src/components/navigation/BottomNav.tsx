
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Trophy, Send, User, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Study', icon: BookOpen, href: '/study' },
    { name: 'Quest', icon: Send, href: '/quest' },
    { name: 'Mastery', icon: Medal, href: '/performance' },
    { name: 'Ranks', icon: Trophy, href: '/ranks' },
    { name: 'Profile', icon: User, href: '/profile' },
  ];

  return (
    <nav id="tour-bottom-nav" className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border flex items-center justify-around px-1 z-50 transition-colors">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name} 
            href={item.href} 
            className="flex flex-col items-center gap-1 group flex-1 min-w-0"
          >
            <div className={cn(
              "p-2 rounded-xl transition-colors",
              isActive ? "bg-primary text-white" : "text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-tighter truncate w-full text-center px-1",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
