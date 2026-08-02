"use client";

import { CloudRain, Droplets, SunMedium, Thermometer, Wind } from "lucide-react";
import type { WeatherData } from "@/lib/api";

const MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function WeatherCard({ weather }: { weather: WeatherData }) {
  const stats = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: `${weather.avg_temp.toFixed(1)}°C`,
      detail: `${weather.min_temp.toFixed(0)}° – ${weather.max_temp.toFixed(0)}°`,
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${weather.avg_humidity.toFixed(0)}%`,
      detail: "relative",
    },
    {
      icon: Wind,
      label: "Wind",
      value: `${weather.avg_wind.toFixed(1)} km/h`,
      detail: "average",
    },
    {
      icon: SunMedium,
      label: "Solar",
      value: `${weather.avg_radiation.toFixed(0)} W/m²`,
      detail: "avg shortwave",
    },
    {
      icon: CloudRain,
      label: "Precipitation",
      value: `${weather.total_precip.toFixed(1)} mm`,
      detail: "today",
    },
  ];

  return (
    <section className="card-shell rounded-[1.75rem] p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Weather snapshot</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Islamabad forecast inputs</h3>
        </div>
        <div className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-300">
          Month: <span className="font-semibold text-white">{MONTHS[weather.month]}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ icon: Icon, label, value, detail }) => (
          <div key={label} className="soft-panel rounded-2xl p-4">
            <Icon className="h-5 w-5 text-orange-300" />
            <div className="mt-3 text-2xl font-bold text-white">{value}</div>
            <div className="mt-1 text-sm text-slate-400">{label}</div>
            <div className="text-xs text-slate-500">{detail}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-5 text-sm">
        <span className="text-slate-400">Feels like</span>
        <span className="font-semibold text-white">{weather.avg_apparent_temp.toFixed(1)}°C</span>
      </div>
    </section>
  );
}