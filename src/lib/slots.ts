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

export function generateAllSlots(): string[] {
  const slots: string[] = [];
  let current = parse(OPEN_TIME, "HH:mm", new Date());
  const close = parse(CLOSE_TIME, "HH:mm", new Date());
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

function generateSlotsForRange(start: string, end: string): string[] {
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
  schedule?: BarberSchedule | null
): Slot[] {
  let slots: string[];

  if (schedule && !schedule.available) {
    return [];
  } else if (schedule?.available && schedule.startTime && schedule.endTime) {
    slots = generateSlotsForRange(schedule.startTime, schedule.endTime);
  } else {
    slots = generateAllSlots();
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
