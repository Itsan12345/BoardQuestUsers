import React, { useState, useEffect } from 'react';
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
  startOfDay
} from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRangeSelection {
  startDate: Date;
  endDate: Date;
}

interface CustomCalendarProps {
  startDate?: Date | null;
  endDate?: Date | null;
  selected?: Date | null;
  minDate?: Date | null;
  maxDate?: Date | null;
  onSelectRange?: (range: DateRangeSelection) => void;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

export function CustomCalendar({
  startDate,
  endDate,
  selected,
  minDate,
  maxDate,
  onSelectRange,
  onSelect,
  disabled
}: CustomCalendarProps) {
  const initialStart = startDate || selected || null;
  const initialEnd = endDate || selected || null;

  const [rangeStart, setRangeStart] = useState<Date | null>(initialStart);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEnd);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const [currentMonth, setCurrentMonth] = useState<Date>(initialStart || new Date());

  useEffect(() => {
    if (startDate) setRangeStart(startDate);
    if (endDate) setRangeEnd(endDate);
    if (!startDate && !endDate && selected) {
      setRangeStart(selected);
      setRangeEnd(selected);
    }
  }, [startDate, endDate, selected]);

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

  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const isDateDisabled = (targetDate: Date) => {
    if (minDate && startOfDay(targetDate) < startOfDay(minDate)) return true;
    if (maxDate && startOfDay(targetDate) > startOfDay(maxDate)) return true;
    if (disabled?.(targetDate)) return true;
    return false;
  };

  const canGoPrev = !minDate || startOfMonth(currentMonth) > startOfMonth(minDate);
  const canGoNext = !maxDate || startOfMonth(currentMonth) < startOfMonth(maxDate);

  // Determine effective range for visual highlights
  let effectiveStart: Date | null = rangeStart;
  let effectiveEnd: Date | null = rangeEnd;

  if (rangeStart && !rangeEnd && hoverDate) {
    if (hoverDate < rangeStart) {
      effectiveStart = hoverDate;
      effectiveEnd = rangeStart;
    } else {
      effectiveStart = rangeStart;
      effectiveEnd = hoverDate;
    }
  } else if (rangeStart && rangeEnd) {
    if (rangeEnd < rangeStart) {
      effectiveStart = rangeEnd;
      effectiveEnd = rangeStart;
    }
  }

  const handleDateClick = (clickedDate: Date) => {
    if (isDateDisabled(clickedDate)) return;

    const cleanClicked = startOfDay(clickedDate);

    if (!rangeStart || (rangeStart && rangeEnd)) {
      // First click: Set Start Date
      setRangeStart(cleanClicked);
      setRangeEnd(null);
      setHoverDate(null);
    } else if (rangeStart && !rangeEnd) {
      // Second click: Set End Date or reset if earlier
      const cleanStart = startOfDay(rangeStart);
      if (cleanClicked < cleanStart) {
        setRangeStart(cleanClicked);
        setRangeEnd(null);
      } else {
        setRangeEnd(cleanClicked);
        const finalStart = cleanStart;
        const finalEnd = cleanClicked;

        if (onSelectRange) {
          onSelectRange({ startDate: finalStart, endDate: finalEnd });
        }
        if (onSelect) {
          onSelect(finalEnd);
        }
      }
    }
  };

  return (
    <div className="w-full max-w-[320px] sm:max-w-[340px] p-2 sm:p-4 mx-auto select-none space-y-3 sm:space-y-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between px-1 sm:px-2">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => canGoPrev && setCurrentMonth(subMonths(currentMonth, 1))}
          className={cn(
            "p-1.5 sm:p-2 rounded-xl transition-colors",
            canGoPrev
              ? "hover:bg-secondary text-foreground/70 hover:text-foreground cursor-pointer"
              : "text-muted-foreground/30 cursor-not-allowed opacity-40"
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black text-foreground uppercase tracking-tight leading-tight">
            {format(currentMonth, 'MMMM')}
          </h2>
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
            {format(currentMonth, 'yyyy')}
          </p>
        </div>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => canGoNext && setCurrentMonth(addMonths(currentMonth, 1))}
          className={cn(
            "p-1.5 sm:p-2 rounded-xl transition-colors",
            canGoNext
              ? "hover:bg-secondary text-foreground/70 hover:text-foreground cursor-pointer"
              : "text-muted-foreground/30 cursor-not-allowed opacity-40"
          )}
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Day Names Grid */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((dayName) => (
          <div key={dayName} className="text-center text-[10px] sm:text-xs font-extrabold uppercase text-muted-foreground/70 py-1">
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-0" onMouseLeave={() => setHoverDate(null)}>
        {days.map((dayItem, idx) => {
          const isCurrentMonth = isSameMonth(dayItem, currentMonth);
          const isDisabled = isDateDisabled(dayItem);
          const isDeadline = maxDate && isSameDay(dayItem, maxDate);

          const isStart = effectiveStart && isSameDay(dayItem, effectiveStart);
          const isEnd = effectiveEnd && isSameDay(dayItem, effectiveEnd);
          const isInRange = effectiveStart && effectiveEnd && dayItem >= effectiveStart && dayItem <= effectiveEnd;
          const isSingleDay = isStart && isEnd;

          return (
            <div key={idx} className="relative py-0.5 flex items-center justify-center">
              {/* Highlighted Range Strip Band */}
              {isInRange && !isSingleDay && (
                <div
                  className={cn(
                    "absolute inset-y-1 bg-primary/20 dark:bg-primary/35 transition-all",
                    isStart && "left-1/2 right-0 rounded-l-none",
                    isEnd && "right-1/2 left-0 rounded-r-none",
                    !isStart && !isEnd && "left-0 right-0"
                  )}
                />
              )}

              {/* Day Circle Button */}
              <button
                type="button"
                onClick={() => handleDateClick(dayItem)}
                onMouseEnter={() => rangeStart && !rangeEnd && !isDisabled && setHoverDate(dayItem)}
                disabled={isDisabled}
                title={isDeadline ? `Final Deadline (${format(maxDate, "MMM dd, yyyy")})` : undefined}
                className={cn(
                  "relative z-10 h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center justify-center",
                  !isCurrentMonth && "text-muted-foreground/30",
                  (isStart || isEnd) && "bg-primary text-primary-foreground font-black shadow-md scale-105 ring-2 ring-primary/40",
                  !isStart && !isEnd && isInRange && "text-primary dark:text-primary-foreground font-black",
                  !isStart && !isEnd && !isInRange && isCurrentMonth && !isDisabled && "hover:bg-primary/10 cursor-pointer text-foreground",
                  !isStart && !isEnd && isDeadline && !isDisabled && "ring-2 ring-primary/40 font-bold",
                  isDisabled && "opacity-25 cursor-not-allowed"
                )}
              >
                {format(dayItem, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
