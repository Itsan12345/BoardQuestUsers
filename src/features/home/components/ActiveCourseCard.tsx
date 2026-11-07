"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FolderKanban,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Sparkles,
  PlayCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveCourseInfo } from '../types';

interface ActiveCourseCardProps {
  activeCourseInfo: ActiveCourseInfo;
}

export const ActiveCourseCard: React.FC<ActiveCourseCardProps> = ({ activeCourseInfo }) => {
  return (
    <Card
      id="tour-dashboard-studyplan"
      className="border-2 border-border shadow-md rounded-2xl bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden relative group transition-all duration-300 hover:shadow-lg"
    >
      {/* Top Badge & Header Pill */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between gap-3 border-b border-border/60 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {activeCourseInfo.status === 'no_modules' ? (
            <>
              <FolderKanban className="w-4 h-4 text-amber-500 shrink-0" />
              <span
                className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest truncate"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Curriculum Overview • {activeCourseInfo.subject}
              </span>
            </>
          ) : activeCourseInfo.status === 'completed' ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span
                className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest truncate"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Completed • {activeCourseInfo.subject}
              </span>
            </>
          ) : activeCourseInfo.status === 'not_started' ? (
            <>
              <span
                className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-widest truncate"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Ready to Begin • {activeCourseInfo.subject}
              </span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span
                className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-widest truncate"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                In Progress • {activeCourseInfo.subject}
              </span>
            </>
          )}
        </div>

        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0",
            activeCourseInfo.status === 'no_modules'
              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
              : activeCourseInfo.status === 'completed'
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-primary/10 text-primary border-primary/30"
          )}
        >
          {activeCourseInfo.status === 'no_modules'
            ? '0 Modules Available'
            : activeCourseInfo.status === 'completed'
              ? `All ${activeCourseInfo.totalLessons} Modules Mastered 🎉`
              : `${activeCourseInfo.completedCount}/${activeCourseInfo.totalLessons} Modules`}
        </Badge>
      </div>

      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Fallback View: No Modules in Database */}
        {activeCourseInfo.status === 'no_modules' ? (
          <div className="py-4 sm:py-6 px-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3
                  className="text-base sm:text-lg font-bold text-foreground"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  No Learning Modules Uploaded Yet
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Curriculum materials for {activeCourseInfo.subject} are currently being prepared. Check back soon or select another subject in Study Subjects.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Main Subject & Current Module Title */
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                {activeCourseInfo.status === 'not_started'
                  ? 'Recommended Starting Point'
                  : activeCourseInfo.status === 'completed'
                    ? 'Subject Completed'
                    : 'Current Module'}
              </span>
            </div>
            <h3
              className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {activeCourseInfo.currentModuleTitle}
            </h3>
            {activeCourseInfo.currentModuleDesc && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {activeCourseInfo.currentModuleDesc}
              </p>
            )}
          </div>
        )}

        {/* Progress Bar & Percentage */}
        <div className="space-y-2.5 bg-muted/30 p-3.5 sm:p-4 rounded-xl border border-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary shrink-0" /> Subject Mastery & Completion
            </span>
            <span className="font-bold text-primary text-sm">{activeCourseInfo.progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/40">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 shadow-xs",
                activeCourseInfo.status === 'completed'
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-primary/80 to-primary"
              )}
              style={{ width: `${activeCourseInfo.progressPercent}%` }}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground font-medium gap-1 pt-0.5">
            <span>
              {activeCourseInfo.status === 'no_modules'
                ? 'Awaiting module deployment by review center'
                : activeCourseInfo.status === 'not_started'
                  ? `0 of ${activeCourseInfo.totalLessons} lessons completed • Ready to start`
                  : `${activeCourseInfo.completedCount} of ${activeCourseInfo.totalLessons} lessons completed`}
            </span>
            <span>
              {activeCourseInfo.status === 'completed'
                ? 'All subject lessons complete 🎉'
                : activeCourseInfo.status === 'no_modules'
                  ? '0 lessons available'
                  : `${activeCourseInfo.totalLessons - activeCourseInfo.completedCount} lessons left`}
            </span>
          </div>
        </div>

        {/* Up Next Module Section */}
        {activeCourseInfo.upNextModule && activeCourseInfo.status !== 'no_modules' && (
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  {activeCourseInfo.status === 'completed' ? 'Up Next Subject' : 'Up Next'}
                </span>
                {activeCourseInfo.upNextModule.duration && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    • {activeCourseInfo.upNextModule.duration}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                {activeCourseInfo.upNextModule.title}
              </p>
            </div>
          </div>
        )}

        {/* Responsive Dynamic CTA Action Button */}
        <div className="pt-1 w-full">
          <Link
            href={
              activeCourseInfo.status === 'no_modules'
                ? '/study'
                : `/study?subject=${encodeURIComponent(activeCourseInfo.subject)}${
                    activeCourseInfo.currentModuleId ? '&module=' + activeCourseInfo.currentModuleId : ''
                  }`
            }
            className="block w-full"
          >
            <Button
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <PlayCircle className="w-4 h-4 fill-current shrink-0" />
              <span>
                {activeCourseInfo.status === 'no_modules'
                  ? 'Explore Study Subjects'
                  : activeCourseInfo.status === 'not_started'
                    ? 'Start Learning Module'
                    : activeCourseInfo.status === 'completed'
                      ? 'Review Subject Material'
                      : 'Resume Learning'}
              </span>
              <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

