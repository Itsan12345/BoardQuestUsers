import { differenceInCalendarDays, endOfDay } from 'date-fns';

export interface RemainingTimeResult {
  formatted: string;
  short: string;
  calendarDays: number;
  hours: number;
  minutes: number;
  isEndingToday: boolean;
  isEndingTomorrow: boolean;
  isCritical: boolean;
  isExpired: boolean;
}

/**
 * Calculates progressive granularity countdown for study deadlines and review blocks.
 * Automatically treats calendar target dates as inclusive of the full target day (endOfDay).
 */
export function calculateRemainingTime(
  targetDate: string | Date | undefined | null,
  now: Date = new Date(),
  options?: { inclusiveEndOfDay?: boolean }
): RemainingTimeResult {
  if (!targetDate) {
    return {
      formatted: 'No deadline set',
      short: 'None',
      calendarDays: 0,
      hours: 0,
      minutes: 0,
      isEndingToday: false,
      isEndingTomorrow: false,
      isCritical: false,
      isExpired: false,
    };
  }

  try {
    const rawDate = new Date(targetDate);
    if (isNaN(rawDate.getTime())) {
      throw new Error('Invalid date');
    }

    const isInclusive = options?.inclusiveEndOfDay !== false;
    const target = isInclusive ? endOfDay(rawDate) : rawDate;
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) {
      return {
        formatted: 'Concluded',
        short: 'Ended',
        calendarDays: 0,
        hours: 0,
        minutes: 0,
        isEndingToday: false,
        isEndingTomorrow: false,
        isCritical: false,
        isExpired: true,
      };
    }

    const calendarDays = differenceInCalendarDays(target, now);
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (calendarDays > 1) {
      return {
        formatted: `${calendarDays} days remaining`,
        short: `${calendarDays}d left`,
        calendarDays,
        hours,
        minutes: mins,
        isEndingToday: false,
        isEndingTomorrow: false,
        isCritical: false,
        isExpired: false,
      };
    }

    if (calendarDays === 1) {
      return {
        formatted: '1 day remaining • Ends tomorrow',
        short: 'Ends tomorrow',
        calendarDays,
        hours,
        minutes: mins,
        isEndingToday: false,
        isEndingTomorrow: true,
        isCritical: false,
        isExpired: false,
      };
    }

    // Same calendar day (calendarDays === 0)
    if (hours === 0) {
      const minCount = Math.max(1, mins);
      return {
        formatted: `Ends in ${minCount}m`,
        short: `${minCount}m left`,
        calendarDays: 0,
        hours: 0,
        minutes: minCount,
        isEndingToday: true,
        isEndingTomorrow: false,
        isCritical: true,
        isExpired: false,
      };
    }

    const timeLabel = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    return {
      formatted: `Ends today • ${timeLabel} remaining`,
      short: `${hours}h left`,
      calendarDays: 0,
      hours,
      minutes: mins,
      isEndingToday: true,
      isEndingTomorrow: false,
      isCritical: false,
      isExpired: false,
    };
  } catch {
    return {
      formatted: 'Invalid date',
      short: 'Error',
      calendarDays: 0,
      hours: 0,
      minutes: 0,
      isEndingToday: false,
      isEndingTomorrow: false,
      isCritical: false,
      isExpired: false,
    };
  }
}

