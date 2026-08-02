"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Clock3, MapPinned, RefreshCw, Radio } from "lucide-react";
import { getActiveNow, tierColor, type ActiveNowResponse } from "@/lib/api";

const LiveMap = dynamic(() => import("../../components/LiveMap").then((module) => module.default), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[520px] items-center justify-center rounded-[1.75rem] border border-white/8 bg-slate-950/60 text-slate-400">
      Loading map...
    </div>
  ),
});

export default function LivePage() {
  const [data, setData] = useState<ActiveNowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(60);

  async function load() {
    setLoading(true);
    try {
      const response = await getActiveNow();
      setData(response);
      setCountdown(60);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const refresh = window.setInterval(load, 60_000);
    const tick = window.setInterval(() => setCountdown((current) => Math.max(0, current - 1)), 1000);

    return () => {
      window.clearInterval(refresh);
      window.clearInterval(tick);
    };
  }, []);

  const color = data ? tierColor(data.predicted_tier) : "#f97316";
  const activeFeeders = data?.active_feeders ?? [];
  const islamabadFeeders = activeFeeders.filter((feeder) => feeder.city === "Islamabad");
  const rawalpindiFeeders = activeFeeders.filter((feeder) => feeder.city === "Rawalpindi");

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Live operations</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Outage map control room</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Track feeders currently without power and see the active tier in a clean operational dashboard.</p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="card-shell overflow-hidden rounded-[2rem]">
          {data ? <LiveMap feeders={data.active_feeders} tier={data.predicted_tier} /> : <div className="flex min-h-[520px] items-center justify-center text-slate-400">Loading live outage map...</div>}
        </div>

        <aside className="space-y-4">
          <div className="card-shell rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
              <span>Tier active</span>
              <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-white" style={{ background: `${color}22` }}>{data?.predicted_tier ?? "—"}</span>
            </div>
            <div className="mt-5 text-4xl font-black text-white">{data?.total_affected ?? "—"}</div>
            <p className="mt-2 text-sm text-slate-400">feeders are currently off</p>
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-400"><Clock3 className="h-4 w-4" /> PKT: {data?.current_time ?? "—"}</div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400"><Radio className="h-4 w-4 animate-pulse" /> Refreshing in {countdown}s</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card-shell rounded-[1.5rem] p-5">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Islamabad</div>
              <div className="mt-3 text-3xl font-black text-white">{islamabadFeeders.length}</div>
              <div className="mt-1 text-sm text-slate-400">active feeders now</div>
            </div>
            <div className="card-shell rounded-[1.5rem] p-5">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Rawalpindi</div>
              <div className="mt-3 text-3xl font-black text-white">{rawalpindiFeeders.length}</div>
              <div className="mt-1 text-sm text-slate-400">active feeders now</div>
            </div>
          </div>

          <div className="card-shell rounded-[1.75rem] p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500"><MapPinned className="h-4 w-4" /> Currently off</div>
            <div className="mt-4 max-h-[390px] space-y-2 overflow-y-auto pr-1">
              {activeFeeders.length ? (
                activeFeeders.map((feeder, index) => (
                  <div key={`${feeder.feeder_name}-${index}`} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium text-white">{feeder.feeder_name}</div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                        {feeder.city}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm text-slate-400">
                      <span>{feeder.grid_station}</span>
                      <span className="font-mono text-sky-200">-{feeder.ends_in_mins}m</span>
                    </div>
                  </div>
                ))
              ) : <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-6 text-center text-sm text-emerald-100">No active outages right now.</div>}
            </div>
          </div>
        </aside>
      </section>

    </div>
  );
}