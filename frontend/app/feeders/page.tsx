"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Loader2, Search } from "lucide-react";
import { getTodayPrediction, getFeederSchedule, searchFeeders, type FeederInfo, type FeederSchedule, type TierPrediction } from "@/lib/api";
import FeederCard from "@/components/FeederCard";

const cityFilters = [
  { value: "all", label: "All cities" },
  { value: "islamabad", label: "Islamabad" },
  { value: "rawalpindi", label: "Rawalpindi" },
] as const;

export default function FeedersPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<(typeof cityFilters)[number]["value"]>("all");
  const [prediction, setPrediction] = useState<TierPrediction | null>(null);
  const [results, setResults] = useState<FeederInfo[]>([]);
  const [schedules, setSchedules] = useState<Record<string, FeederSchedule>>({});
  const [loading, setLoading] = useState(false);
  const [loadingNames, setLoadingNames] = useState<string[]>([]);

  useEffect(() => {
    void getTodayPrediction().then(setPrediction).catch(() => setPrediction(null));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const feeders = await searchFeeders(trimmed);
        const filtered = city === "all" ? feeders : feeders.filter((feeder) => feeder.source_file.toLowerCase().includes(city));
        setResults(filtered);

        const nextLoading = filtered.map((feeder) => feeder.feeder_name);
        setLoadingNames(nextLoading);

        const schedulePairs = await Promise.allSettled(
          filtered.map((feeder) => getFeederSchedule(feeder.feeder_name, prediction?.predicted_tier)),
        );

        setSchedules((current) => {
          const next = { ...current };
          schedulePairs.forEach((result, index) => {
            if (result.status === "fulfilled") next[filtered[index].feeder_name] = result.value;
          });
          return next;
        });
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setLoadingNames([]);
      }
    }, 320);

    return () => window.clearTimeout(timer);
  }, [city, prediction?.predicted_tier, query]);

  const statusText = useMemo(() => {
    if (query.trim().length < 2) return "Type at least 2 characters to begin.";
    if (loading) return "Searching feeders and preparing schedules...";
    if (results.length === 0) return "No feeders found for that query.";
    return `${results.length} result${results.length === 1 ? "" : "s"} found.`;
  }, [loading, query, results.length]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <section className="card-shell rounded-[2rem] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Feeder search</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Find the exact feeder and schedule.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Search by feeder name or grid station, then open the schedule card to see the outage windows in a polished operator view.
        </p>

        {prediction && (
          <div className="mt-5 inline-flex rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-sm text-orange-100">
            Today&apos;s predicted tier: <span className="ml-2 font-semibold">{prediction.predicted_tier}</span>
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by feeder or grid station..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-4 pl-12 pr-12 text-base text-white outline-none placeholder:text-slate-500 focus:border-orange-400/40"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-500" />}
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <select
              value={city}
              onChange={(event) => setCity(event.target.value as typeof city)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/60 py-4 pl-12 pr-4 text-base text-white outline-none focus:border-orange-400/40"
            >
              {cityFilters.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-400">{statusText}</p>
      </section>

      <section className="mt-6 space-y-4">
        {results.map((feeder) => {
          const schedule = schedules[feeder.feeder_name];
          const loadingName = loadingNames.includes(feeder.feeder_name);

          if (loadingName && !schedule) {
            return (
              <div key={feeder.feeder_name} className="card-shell rounded-[1.5rem] p-5 text-slate-400">
                <Loader2 className="inline-block h-4 w-4 animate-spin" /> Preparing {feeder.feeder_name}...
              </div>
            );
          }

          return schedule ? <FeederCard key={feeder.feeder_name} schedule={schedule} /> : (
            <div key={feeder.feeder_name} className="card-shell rounded-[1.5rem] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">{feeder.feeder_name}</div>
                  <div className="mt-1 text-sm text-slate-400">{feeder.grid_station}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-200">
                  Schedule unavailable
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {query.trim().length < 2 && (
        <section className="mt-8 rounded-[2rem] border border-white/8 bg-white/3 p-8 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-4 text-2xl font-semibold text-white">Start with a feeder name</h2>
          <p className="mt-2 text-slate-400">Try keywords like F-7, G-9, Saddar, or Filtration.</p>
        </section>
      )}
    </div>
  );
}