"use client";

import type { WeatherData } from "@/lib/api";

interface Props {
  weather: WeatherData;
}

const series = [
  { label: "Temp", max: 45, color: "#fb923c" },
  { label: "Feels", max: 50, color: "#f59e0b" },
  { label: "Humidity", max: 100, color: "#60a5fa" },
  { label: "Wind", max: 25, color: "#22d3ee" },
  { label: "Solar", max: 500, color: "#facc15" },
  { label: "Rain", max: 12, color: "#a78bfa" },
] as const;

function weatherNarrative(weather: WeatherData) {
  const heat = weather.avg_temp >= 35 ? "High" : weather.avg_temp >= 30 ? "Moderate" : "Mild";
  const humidity = weather.avg_humidity >= 60 ? "Sticky" : weather.avg_humidity >= 40 ? "Balanced" : "Dry";
  const wind = weather.avg_wind >= 10 ? "Ventilated" : "Still";
  const rain = weather.total_precip > 0 ? "Rain present" : "Dry day";

  return { heat, humidity, wind, rain };
}

export default function WeatherChart({ weather }: Props) {
  const narrative = weatherNarrative(weather);
  const values = {
    Temp: weather.avg_temp,
    Feels: weather.avg_apparent_temp,
    Humidity: weather.avg_humidity,
    Wind: weather.avg_wind,
    Solar: weather.avg_radiation,
    Rain: weather.total_precip,
  } as const;

  return (
    <section className="card-shell rounded-[1.75rem] p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Weather chart</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Forecast feature profile</h3>
        </div>
        <div className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-300">
          Islamabad weather inputs
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-slate-950/50 p-5">
        <div className="flex min-h-[200px] items-end justify-between gap-3">
          {series.map((item) => {
            const value = values[item.label as keyof typeof values];
            const height = Math.max(20, Math.min(160, (value / item.max) * 160));
            return (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex min-h-[170px] w-full items-end justify-center">
                  <div
                    className="w-12 rounded-t-2xl rounded-b-lg transition-all duration-300"
                    style={{
                      height: `${height}px`,
                      background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}44 100%)`,
                      boxShadow: `0 15px 35px ${item.color}33, inset 0 1px 0 ${item.color}88`,
                      minHeight: "20px",
                    }}
                  />
                </div>
                <div className="text-lg font-bold text-white">
                  {item.label === "Humidity" ? value.toFixed(0) : value.toFixed(item.label === "Rain" ? 1 : 1)}
                </div>
                <div className="text-xs font-medium text-slate-400">{item.label}</div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-400">
          The chart summarizes the weather inputs behind today&apos;s prediction without repeating the same values in another panel.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Heat stress</div>
          <div className="mt-2 text-2xl font-bold text-white">{narrative.heat}</div>
          <div className="mt-1 text-sm text-slate-400">avg temp {weather.avg_temp.toFixed(1)}°C</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Humidity</div>
          <div className="mt-2 text-2xl font-bold text-white">{narrative.humidity}</div>
          <div className="mt-1 text-sm text-slate-400">{weather.avg_humidity.toFixed(0)}% relative humidity</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Wind</div>
          <div className="mt-2 text-2xl font-bold text-white">{narrative.wind}</div>
          <div className="mt-1 text-sm text-slate-400">{weather.avg_wind.toFixed(1)} km/h average</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Rain signal</div>
          <div className="mt-2 text-2xl font-bold text-white">{narrative.rain}</div>
          <div className="mt-1 text-sm text-slate-400">{weather.total_precip.toFixed(1)} mm today</div>
        </div>
      </div>
    </section>
  );
}