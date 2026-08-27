import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';

interface CustomCalendarProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

export function CustomCalendar({ selected, onSelect, disabled }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = calendarStart;

  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="w-full max-w-[320px] p-2 sm:p-4 mx-auto select-none">
      {/* Header with Month/Year and Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 sm:p-2 hover:bg-secondary rounded-lg transition-colors text-foreground/70 hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-foreground">{format(currentMonth, 'MMMM')}</h2>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">{format(currentMonth, 'yyyy')}</p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 sm:p-2 hover:bg-secondary rounded-lg transition-colors text-foreground/70 hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
        {dayNames.map((dayName) => (
          <div key={dayName} className="text-center text-[10px] sm:text-xs font-bold uppercase text-muted-foreground py-1 sm:py-2">
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selected && isSameDay(day, selected);
          const isDisabled = disabled?.(day) || false;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => !isDisabled && onSelect(day)}
              disabled={isDisabled}
              className={`
                h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center
                ${!isCurrentMonth ? 'text-muted-foreground/30' : 'text-foreground'}
                ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-lg ring-2 ring-primary/30 scale-105' : ''}
                ${!isSelected && isCurrentMonth && !isDisabled ? 'hover:bg-secondary cursor-pointer' : ''}
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:cursor-pointer'}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
