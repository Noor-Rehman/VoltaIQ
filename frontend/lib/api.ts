const API_ROOT = "/api";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface TierPrediction {
  predicted_tier: string;
  predicted_hours: number;
  tier_meaning: string;
  weather_used: WeatherData;
}

export interface WeatherData {
  month: number;
  avg_temp: number;
  max_temp: number;
  min_temp: number;
  avg_humidity: number;
  avg_apparent_temp: number;
  total_precip: number;
  avg_wind: number;
  avg_radiation: number;
  max_radiation: number;
}

export interface FeederInfo {
  feeder_name: string;
  grid_station: string;
  disco: string;
  source_file: string;
}

export interface FeederSlot {
  slot_start: string;
  slot_end: string;
  duration_hours: number;
  raw_slot: string;
}

export interface FeederSchedule {
  feeder_name: string;
  grid_station: string;
  predicted_tier: string;
  predicted_hours: number;
  slots: FeederSlot[];
  total_outage_hours: number;
  is_currently_off: boolean;
  next_outage_slot: string | null;
}

export interface ActiveFeeder {
  feeder_name: string;
  grid_station: string;
  city: string;
  slot_start: string;
  slot_end: string;
  ends_in_mins: number;
}

export interface ActiveNowResponse {
  current_time: string;
  predicted_tier: string;
  active_feeders: ActiveFeeder[];
  total_affected: number;
}

export async function getHealth(): Promise<{ status: string; database: string; app?: string; version?: string }> {
  return requestJson("/health");
}

export async function getTodayPrediction(): Promise<TierPrediction> {
  return requestJson("/predict/today");
}

export async function predictTier(weather: WeatherData): Promise<TierPrediction> {
  return requestJson("/predict/tier", {
    method: "POST",
    body: JSON.stringify(weather),
  });
}

export async function getFeeders(source?: string, disco?: string): Promise<FeederInfo[]> {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (disco) params.set("disco", disco);
  return requestJson(`/feeders${params.toString() ? `?${params.toString()}` : ""}`);
}

export async function searchFeeders(q: string): Promise<FeederInfo[]> {
  if (q.trim().length < 2) return [];
  return requestJson(`/feeders/search?q=${encodeURIComponent(q.trim())}`);
}

export async function getFeederSchedule(feederName: string, tier?: string): Promise<FeederSchedule> {
  const params = new URLSearchParams();
  if (tier) params.set("tier", tier);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestJson(`/schedule/${encodeURIComponent(feederName)}${suffix}`);
}

export async function getActiveNow(): Promise<ActiveNowResponse> {
  return requestJson("/schedule/active-now");
}

export function tierColor(tier: string): string {
  const palette: Record<string, string> = {
    "2HR": "#22c55e",
    "4HR": "#84cc16",
    "6HR": "#eab308",
    "8HR": "#f97316",
    "10HR": "#ef4444",
    "12HR": "#8b5cf6",
  };
  return palette[tier] ?? "#94a3b8";
}

export function formatTime(value: string): string {
  const [hourString, minuteString] = value.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function cityFromSource(source: string): string {
  return source.toLowerCase().includes("rawalpindi") ? "Rawalpindi" : "Islamabad";
}
