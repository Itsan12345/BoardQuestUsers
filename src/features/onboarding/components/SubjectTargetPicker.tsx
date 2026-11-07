"use client";

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SubjectPickerProps } from '../types';

export function SubjectTargetPicker({ subject, date, onSelect, maxDate }: SubjectPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-muted-foreground uppercase tracking-wider">
        {subject}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-start text-left font-normal rounded-xl h-12 border-2 px-3 transition-all outline-none',
              !date && 'text-muted-foreground border-border hover:border-primary/30',
              date && 'border-primary/20 bg-primary/5 text-primary'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="text-sm font-bold">
              {mounted && date ? format(date, 'PPP') : 'Set Target Date'}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onSelect(newDate);
              setOpen(false);
            }}
            disabled={(currentDate) => {
              const today = startOfDay(new Date());
              return currentDate < today || currentDate > maxDate;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

