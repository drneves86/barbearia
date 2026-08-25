"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/config";
import type { Service } from "@/lib/types";

export function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data.services) setServices(data.services);
      } catch {}
    }
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (services.length === 0) return null;

  return (
    <section className="rounded-3xl border border-line bg-ink-soft/60 p-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
        Serviços
      </h2>
      <ul className="divide-y divide-line">
        {services.map((s) => (
          <li key={s.name} className="flex items-center gap-3 py-2.5">
            {s.imageUrl ? (
              <Image
                src={s.imageUrl}
                alt={s.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <span className="text-lg">{s.emoji}</span>
            )}
            <span className="flex-1 text-cream">{s.name}</span>
            <span className="font-semibold text-gold">
              {formatPrice(s.priceCents)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
