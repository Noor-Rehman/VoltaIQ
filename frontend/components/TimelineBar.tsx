"use client";

import { tierColor, formatTime, type FeederSlot } from "@/lib/api";

interface Props {
  slots: FeederSlot[];
  tier: string;
}

export default function TimelineBar({ slots, tier }: Props) {
  const color = tierColor(tier);
  const currentHour = new Date().getHours();

  const uniqueSlots = slots.filter((slot, index, array) => {
    return array.findIndex((candidate) => candidate.slot_start === slot.slot_start && candidate.slot_end === slot.slot_end) === index;
  });

  const blocks = Array.from({ length: 24 }, (_, hour) => {
    const isOff = uniqueSlots.some((slot) => {
      const startHour = Number(slot.slot_start.split(":")[0]);
      const endHour = Number(slot.slot_end.split(":")[0]) || 24;
      return hour >= startHour && hour < endHour;
    });
    return { hour, isOff };
  });

  return (
    <section className="card-shell rounded-[1.75rem] p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Outage timeline</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">24-hour grid view</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: color }} />Outage</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-slate-700" />On</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-24 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
        {blocks.map(({ hour, isOff }) => (
          <div key={hour} className="space-y-2">
            <div
              className={`relative h-10 rounded-xl border transition-all ${isOff ? "border-transparent" : "border-white/8"}`}
              style={{ background: isOff ? color : "rgba(15, 23, 42, 0.95)" }}
              title={`${hour}:00 - ${isOff ? "Outage" : "Power on"}`}
            >
              {hour === currentHour && <div className="absolute inset-0 rounded-xl ring-2 ring-white/80" />}
            </div>
            {hour % 6 === 0 ? <div className="text-[11px] text-slate-500">{hour === 0 ? "12am" : hour === 12 ? "12pm" : hour > 12 ? `${hour - 12}pm` : `${hour}am`}</div> : <div className="h-[14px]" />}
          </div>
        ))}
      </div>

      {uniqueSlots.length > 0 && (
        <div className="mt-6 border-t border-white/8 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Windows</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {uniqueSlots.map((slot) => (
              <span key={`${slot.slot_start}-${slot.slot_end}-${slot.raw_slot}`} className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                {formatTime(slot.slot_start)} - {formatTime(slot.slot_end)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}