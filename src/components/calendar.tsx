"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAY_LONG = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function Calendar({
  selected,
  onSelect,
  isSelectable,
  today,
  blockedDates,
}: {
  selected: string | null;
  onSelect: (date: string) => void;
  isSelectable: (date: string) => boolean;
  today: string;
  blockedDates?: Set<string>;
}) {
  const [cursor, setCursor] = useState(() => {
    const base = today ? new Date(today + "T12:00:00") : new Date();
    return startOfMonth(base);
  });

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  const monthLabel = format(cursor, "MMMM yyyy");

  const canPrev = cursor >= startOfMonth(new Date(today + "T12:00:00"));

  return (
    <div className="select-none rounded-2xl border border-line bg-panel/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-cream transition hover:border-gold/50 hover:text-gold disabled:opacity-30"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-base font-semibold capitalize text-cream">
            {monthLabel}
          </p>
          <p className="text-xs text-muted">
            {WEEKDAY_LONG[new Date(cursor).getDay()]} •{" "}
            {format(cursor, "yyyy")}
          </p>
        </div>
        <button
          type="button"
          disabled={cursor >= startOfMonth(addMonths(new Date(today + "T12:00:00"), 2))}
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-cream transition hover:border-gold/50 hover:text-gold disabled:opacity-30"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="pb-1 text-center text-xs font-semibold uppercase text-muted"
          >
            {d}
          </div>
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const selectable = isSelectable(dateStr);
          const isSelected = selected === dateStr;
          const inMonth = isSameMonth(day, cursor);
          const isToday = dateStr === today;
          const isBlocked = blockedDates?.has(dateStr) ?? false;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!selectable || isBlocked}
              onClick={() => onSelect(dateStr)}
              className={`relative flex h-11 items-center justify-center rounded-lg text-sm transition ${
                !inMonth
                  ? "text-muted/30"
                  : isBlocked
                    ? "text-red-400/50 line-through"
                    : selectable
                      ? "text-cream hover:bg-panel-2"
                      : "text-muted/30 line-through"
              } ${
                isSelected
                  ? "bg-gold font-bold text-ink shadow-[0_6px_20px_rgba(212,175,55,0.35)] hover:bg-gold"
                  : ""
              } ${
                isToday && !isSelected
                  ? "ring-1 ring-inset ring-green-500/70"
                  : ""
              }`}
            >
              {format(day, "d")}
              {isBlocked && inMonth && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-red-400" />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 border-t border-line pt-3 text-center text-xs text-muted">
        Dias bloqueados pelo barbeiro aparecem em vermelho.
      </p>
    </div>
  );
}
