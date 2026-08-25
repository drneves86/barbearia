import { addMinutes, format, parse } from "date-fns";
import {
  CLOSE_TIME,
  DAYS_OFF,
  LUNCH_BREAK,
  MAX_FUTURE_DAYS,
  OPEN_TIME,
  SLOT_MINUTES,
  WORKING_DAYS,
} from "./config";
import { addDaysToDate, nowTimeInTZ, todayInTZ } from "./date";
import type { BarberSchedule, Slot } from "./types";

function generateSlotsInRange(start: string, end: string): string[] {
  const slots: string[] = [];
  let current = parse(start, "HH:mm", new Date());
  const close = parse(end, "HH:mm", new Date());
  const lunchStart = parse(LUNCH_BREAK.start, "HH:mm", new Date());
  const lunchEnd = parse(LUNCH_BREAK.end, "HH:mm", new Date());

  while (current < close) {
    if (!(current >= lunchStart && current < lunchEnd)) {
      slots.push(format(current, "HH:mm"));
    }
    current = addMinutes(current, SLOT_MINUTES);
  }
  return slots;
}

export function generateAllSlots(openTime = OPEN_TIME, closeTime = CLOSE_TIME): string[] {
  return generateSlotsInRange(openTime, closeTime);
}

export function isWorkingDay(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay();
  return WORKING_DAYS.includes(jsDay as (typeof WORKING_DAYS)[number]) && !DAYS_OFF.includes(date);
}

export function isDateInPast(date: string): boolean {
  return date < todayInTZ();
}

export function isDateBeyondHorizon(date: string): boolean {
  const horizon = addDaysToDate(todayInTZ(), MAX_FUTURE_DAYS);
  return date > horizon;
}

export function isDateSelectable(date: string): boolean {
  return !isDateInPast(date) && !isDateBeyondHorizon(date) && isWorkingDay(date);
}

export function availableSlotsFor(
  date: string,
  booked: string[],
  schedule?: BarberSchedule | null,
  defaultOpen?: string,
  defaultClose?: string
): Slot[] {
  let slots: string[];

  if (schedule && !schedule.available && !schedule.startTime && (!schedule.blockedSlots || schedule.blockedSlots.length === 0)) {
    return [];
  } else if (schedule && !schedule.available && schedule.blockedSlots?.length) {
    const allSlots = generateAllSlots(defaultOpen, defaultClose);
    const blockedSet = new Set(schedule.blockedSlots);
    slots = allSlots.filter((s) => !blockedSet.has(s));
  } else {
    slots = generateAllSlots(defaultOpen, defaultClose);
  }

  const bookedSet = new Set(booked);
  const today = todayInTZ();
  const nowHHmm = nowTimeInTZ();

  return slots.map((time) => ({
    time,
    booked:
      bookedSet.has(time) || (date === today && time <= nowHHmm),
  }));
}
