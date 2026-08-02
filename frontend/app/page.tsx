"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock3, ExternalLink, RefreshCw, Zap, ZapOff } from "lucide-react";
import { getActiveNow, getTodayPrediction, tierColor, type ActiveNowResponse, type TierPrediction } from "@/lib/api";
import TierBadge from "@/components/TierBadge";
import WeatherCard from "@/components/WeatherCard";
import WeatherChart from "@/components/WeatherChart";
import TimelineBar from "@/components/TimelineBar";

export default function DashboardPage() {
  const [prediction, setPrediction] = useState<TierPrediction | null>(null);
  const [activeNow, setActiveNow] = useState<ActiveNowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [nextPrediction, liveData] = await Promise.all([getTodayPrediction(), getActiveNow()]);
      setPrediction(nextPrediction);
      setActiveNow(liveData);
      setLastUpdated(new Date().toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi" }));
    } catch {
      setError("The backend is not reachable. Start FastAPI on port 8000 and reload the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(loadData, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[72vh] max-w-7xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/8 bg-white/5 px-8 py-10 text-center shadow-2xl shadow-black/20">
          <div className="h-14 w-14 rounded-full border-4 border-orange-400/30 border-t-orange-400 animate-spin" />
          <div>
            <div className="text-lg font-semibold text-white">Loading control room</div>
            <p className="mt-1 text-sm text-slate-400">Fetching prediction, weather, and live outage data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[72vh] max-w-2xl items-center justify-center px-4">
        <div className="card-shell rounded-[2rem] p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-300" />
          <h1 className="mt-4 text-3xl font-semibold text-white">Connection error</h1>
          <p className="mt-3 text-slate-300">{error}</p>
          <button
            onClick={loadData}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.95fr] lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">Control the day before it controls you.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                VoltaIQ predicts today&apos;s tier, surfaces live outages, and helps you move from scattered data to a proper operations view.
              </p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <TierBadge tier={prediction.predicted_tier} hours={prediction.predicted_hours} meaning={prediction.tier_meaning} />
        </div>

        <aside className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="card-shell rounded-[1.5rem] p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
              <span>Current outages</span>
              <ZapOff className="h-4 w-4 text-red-300" />
            </div>
            <div className="mt-4 text-4xl font-black text-white">{activeNow?.total_affected ?? "—"}</div>
            <p className="mt-2 text-sm text-slate-400">feeders are off right now</p>
          </div>

          <div className="card-shell rounded-[1.5rem] p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
              <span>Predicted hours</span>
              <Clock3 className="h-4 w-4 text-orange-300" />
            </div>
            <div className="mt-4 text-4xl font-black text-white">{prediction.predicted_hours.toFixed(1)}</div>
            <p className="mt-2 text-sm text-slate-400">hours of load-shedding today</p>
          </div>

          <div className="card-shell rounded-[1.5rem] p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
              <span>Total feeders</span>
              <Zap className="h-4 w-4 text-blue-300" />
            </div>
            <div className="mt-4 text-4xl font-black text-white">622</div>
            <p className="mt-2 text-sm text-slate-400">Islamabad + Rawalpindi</p>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <WeatherCard weather={prediction.weather_used} />
          <WeatherChart weather={prediction.weather_used} />
        </div>

        <div className="card-shell rounded-[1.75rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Live snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Updated at {lastUpdated || "—"}</h2>
            </div>
            <Link href="/live" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
              Open map
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {activeNow?.active_feeders.slice(0, 12).map((feeder) => (
              <div key={`${feeder.feeder_name}-${feeder.slot_start}`} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{feeder.feeder_name}</div>
                    <div className="text-sm text-slate-400">{feeder.grid_station}</div>
                  </div>
                  <div className="text-right text-sm text-orange-200">
                    <div>{feeder.slot_start} - {feeder.slot_end}</div>
                    <div className="text-xs text-slate-400">ends in {feeder.ends_in_mins}m</div>
                  </div>
                </div>
              </div>
            ))}

            {(!activeNow || activeNow.active_feeders.length === 0) && (
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-6 text-center text-sm text-emerald-100">
                No feeders are currently off in the predicted tier.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <TimelineBar slots={activeNow?.active_feeders.map((feeder) => ({ slot_start: feeder.slot_start, slot_end: feeder.slot_end, duration_hours: 0, raw_slot: `${feeder.slot_start}-${feeder.slot_end}` })) ?? []} tier={prediction.predicted_tier} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/feeders" className="card-shell rounded-[1.5rem] p-6 transition hover:-translate-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Find a feeder</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Search by name or grid station</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">Build a proper lookup experience for users trying to find exact outage windows.</p>
        </Link>
        <Link href="/live" className="card-shell rounded-[1.5rem] p-6 transition hover:-translate-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Live map</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">See the current outages on a map</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">Monitor active feeder outages in a control-room style interface.</p>
        </Link>
      </section>
    </div>
  );
}