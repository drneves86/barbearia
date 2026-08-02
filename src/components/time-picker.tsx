"use client";

import { useEffect } from "react";
import type { Slot } from "@/lib/types";
import { formatDateBR } from "@/lib/whatsapp";

export function TimePicker({
  open,
  onClose,
  date,
  barberName,
  slots,
  selectedTime,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  barberName: string;
  slots: Slot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const available = slots.filter((s) => !s.booked).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-line bg-panel p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-cream">Escolha o horário</h3>
            <p className="text-sm text-muted">
              {formatDateBR(date)} • {barberName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:text-cream"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {available === 0 ? (
          <p className="mt-4 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-red-200">
            Não há horários disponíveis para este barbeiro nesta data.
          </p>
        ) : null}

        <div className="mt-4 grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
          {slots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                disabled={slot.booked}
                onClick={() => {
                  onSelect(slot.time);
                  onClose();
                }}
                className={`flex h-12 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                  slot.booked
                    ? "cursor-not-allowed border-line bg-panel-2/50 text-muted/40 line-through"
                    : isSelected
                      ? "border-gold bg-gold text-ink"
                      : "border-line bg-panel-2 text-cream hover:border-gold/50 hover:text-gold"
                }`}
              >
                {slot.time}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-12 w-full rounded-xl border border-line text-sm text-muted transition hover:text-cream"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
