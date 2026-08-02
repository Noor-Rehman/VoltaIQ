"use client";

import { tierColor } from "@/lib/api";

interface Props {
  tier: string;
  hours: number;
  meaning: string;
}

const labels: Record<string, string> = {
  "2HR": "Minimal",
  "4HR": "Low",
  "6HR": "Moderate",
  "8HR": "High",
  "10HR": "Severe",
  "12HR": "Critical",
};

export default function TierBadge({ tier, hours, meaning }: Props) {
  const color = tierColor(tier);
  const label = labels[tier] ?? "Unknown";

  return (
    <section className="hero-glow card-shell relative overflow-hidden rounded-[2rem] p-8 sm:p-10">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl animate-float" />
      <div className="absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-blue-500/15 blur-3xl animate-float-delayed" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Today&apos;s load-shedding tier</p>
          <div className="mt-4 text-7xl font-black tracking-tight sm:text-8xl" style={{ color }}>
            {tier}
          </div>
          <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
            {label} shortfall forecast
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{meaning}</p>
        </div>

        <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/45 p-6 shadow-xl shadow-black/20">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm text-slate-400">Predicted outage today</div>
              <div className="mt-1 text-4xl font-black text-white">{hours.toFixed(1)} hrs</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.28em] text-slate-400">
              Live
            </div>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (hours / 12) * 100)}%`, background: `linear-gradient(90deg, ${color}, rgba(251, 146, 60, 0.55))` }} />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>0 hrs</span>
            <span>12 hrs</span>
          </div>
        </div>
      </div>
    </section>
  );
}