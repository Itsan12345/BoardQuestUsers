"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';

export interface MTLEPreset {
  label: string;
  date: Date;
}

export const MTLE_PRESETS: MTLEPreset[] = [
  { label: 'Aug 2026 MTLE', date: new Date(2026, 7, 26) },
  { label: 'Mar 2027 MTLE', date: new Date(2027, 2, 25) },
  { label: 'Aug 2027 MTLE', date: new Date(2027, 7, 25) },
  { label: 'Mar 2028 MTLE', date: new Date(2028, 2, 26) },
];

interface TargetExamCalendarProps {
  selectedDate?: Date | null;
  onSelectDate: (date: Date, batchLabel?: string) => void;
  showHeader?: boolean;
  className?: string;
}

export function TargetExamCalendar({
  selectedDate,
  onSelectDate,
  showHeader = true,
  className,
}: TargetExamCalendarProps) {
  const initialDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime())
    ? selectedDate
    : (selectedDate ? new Date(selectedDate) : new Date());

  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(initialDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDayClick = (clickedDate: Date, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectDate(clickedDate);
    if (!isSameMonth(clickedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(clickedDate));
    }
  };

  const weekDayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className={cn("w-full space-y-2 sm:space-y-3 text-left select-none", className)}>
      {/* Header with Title and Hint */}
      {showHeader && (
        <div className="flex items-center justify-between min-w-0 pb-0.5 gap-1">
          <span className="text-xs sm:text-sm font-bold text-foreground truncate">
            Target MTLE Board Schedule
          </span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium shrink-0">
            Select a date
          </span>
        </div>
      )}

      {/* Embedded Calendar Container */}
      <div className="p-2 sm:p-3.5 bg-muted/20 dark:bg-muted/10 border border-border/70 rounded-xl sm:rounded-2xl space-y-2 sm:space-y-2.5 shadow-inner min-w-0">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-0.5 min-w-0">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border transition-all active:scale-95 cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <h4 className="text-xs sm:text-base font-bold text-foreground tracking-tight select-none truncate">
            {format(currentMonth, 'MMMM yyyy')}
          </h4>

          <button
            type="button"
            onClick={handleNextMonth}
            className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border transition-all active:scale-95 cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Weekday Names */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center min-w-0">
          {weekDayLabels.map(dayName => (
            <span
              key={dayName}
              className="text-[9px] sm:text-[11px] font-bold text-muted-foreground/80 tracking-wider py-0.5 truncate"
            >
              {dayName}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 min-w-0">
          {days.map((d, index) => {
            const isCurrentMonth = isSameMonth(d, currentMonth);
            const isSelected = selectedDate && isSameDay(d, selectedDate);

            return (
              <button
                key={index}
                type="button"
                onClick={(e) => handleDayClick(d, e)}
                className={cn(
                  "h-7 sm:h-8.5 w-full rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all relative select-none cursor-pointer",
                  !isCurrentMonth && "text-muted-foreground/30 hover:text-muted-foreground/60",
                  isCurrentMonth && !isSelected && "text-foreground hover:bg-muted font-medium",
                  isSelected && "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/40 scale-105"
                )}
              >
                {format(d, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
