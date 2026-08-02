"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Zap, ZapOff } from "lucide-react";
import { formatTime, tierColor, type FeederSchedule } from "@/lib/api";

interface Props {
  schedule: FeederSchedule;
}

export default function FeederCard({ schedule }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = tierColor(schedule.predicted_tier);

  const activeSlot = useMemo(() => {
    const nowHour = new Date().getHours();
    return schedule.slots.find((slot) => {
      const startHour = Number(slot.slot_start.split(":")[0]);
      const endHour = Number(slot.slot_end.split(":")[0]) || 24;
      return nowHour >= startHour && nowHour < endHour;
    });
  }, [schedule.slots]);

  return (
    <article className="card-shell rounded-[1.5rem] p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-start justify-between gap-4 text-left">
        <div className="flex min-w-0 items-start gap-4">
          <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${schedule.is_currently_off ? "bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.45)]" : "bg-emerald-400"}`} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{schedule.feeder_name}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{schedule.grid_station}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${schedule.is_currently_off ? "border-red-400/20 bg-red-400/10 text-red-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
            {schedule.is_currently_off ? <ZapOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            {schedule.is_currently_off ? "Off now" : "On"}
          </span>
          <span className="rounded-full border border-white/8 px-3 py-1 text-xs font-semibold text-white" style={{ background: `${color}1c` }}>{schedule.predicted_tier}</span>
          {expanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-5 border-t border-white/8 pt-5 animate-slide-up">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-slate-400">Total outage today: <span className="font-semibold text-white">{schedule.total_outage_hours} hrs</span></p>
            {schedule.next_outage_slot && <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-200">Next: {schedule.next_outage_slot}</span>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {schedule.slots.map((slot, index) => {
              const isActive = activeSlot?.slot_start === slot.slot_start;
              return (
                <div key={`${slot.slot_start}-${slot.slot_end}-${index}`} className="rounded-2xl border p-3 text-center transition-colors" style={isActive ? { background: `${color}18`, borderColor: `${color}44` } : { background: "rgba(15, 23, 42, 0.88)", borderColor: "rgba(148, 163, 184, 0.12)" }}>
                  <div className="text-sm font-semibold text-white">{formatTime(slot.slot_start)}</div>
                  <div className="text-xs text-slate-500">to</div>
                  <div className="text-sm font-semibold text-white">{formatTime(slot.slot_end)}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            {Array.from({ length: 24 }, (_, hour) => {
              const isOff = schedule.slots.some((slot) => {
                const startHour = Number(slot.slot_start.split(":")[0]);
                const endHour = Number(slot.slot_end.split(":")[0]) || 24;
                return hour >= startHour && hour < endHour;
              });
              return <div key={hour} className="h-full flex-1" style={{ background: isOff ? color : "transparent" }} />;
            })}
          </div>
        </div>
      )}
    </article>
  );
}