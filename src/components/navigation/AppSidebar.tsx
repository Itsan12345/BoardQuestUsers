"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  User,
  Trophy, 
  LayoutDashboard,
  GraduationCap,
  Sword,
  Medal
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    ]
  },
  {
    label: "LEARNING MANAGEMENT",
    items: [
      { name: 'Study Subjects', icon: GraduationCap, href: '/study' },
      { name: 'Quest Arena', icon: Sword, href: '/quest' },
    ]
  },
  {
    label: "ANALYTICS & RANKING",
    items: [
      { name: 'Leaderboard', icon: Trophy, href: '/ranks' },
      { name: 'Performance Mastery', icon: Medal, href: '/performance' },
    ]
  },
  {
    label: "USER MANAGEMENT",
    items: [
      { name: 'My Profile', icon: User, href: '/profile' },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCollapsed = mounted ? state === "collapsed" : false;

  return (
    <Sidebar id="tour-sidebar-nav" collapsible="icon" className="border-r border-border bg-sidebar text-sidebar-foreground shadow-none transition-colors">
      <SidebarContent className={cn(
        "gap-0 pt-20 transition-all duration-300",
        isCollapsed ? "px-1" : "px-3"
      )}>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className={cn("py-2", isCollapsed && "px-0")}>
            {!isCollapsed && (
              <SidebarGroupLabel className="px-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={cn("gap-1.5", isCollapsed && "gap-4")}>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        tooltip={item.name}
                        className={cn(
                          "transition-all duration-200",
                          isCollapsed 
                            ? "!h-16 !w-16 flex items-center justify-center !p-0 mx-auto rounded-xl" 
                            : "h-14 px-4 rounded-lg",
                          isActive 
                            ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <Icon className={cn(
                            "shrink-0 transition-transform", 
                            isCollapsed ? "h-8 w-8" : "h-6 w-6",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                          {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
