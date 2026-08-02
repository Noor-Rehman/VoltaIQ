"use client";

import { useEffect, useRef } from "react";
import type { ActiveFeeder } from "@/lib/api";
import { tierColor } from "@/lib/api";

interface Props {
  feeders: ActiveFeeder[];
  tier: string;
}

const GRID_COORDS: Record<string, [number, number]> = {
  "F-6": [33.729, 73.0931],
  "F-7": [33.7215, 73.0588],
  "F-8": [33.7174, 73.0421],
  "F-10": [33.6952, 73.0178],
  "F-11": [33.683, 72.9978],
  "G-5": [33.7301, 73.0701],
  "G-6": [33.7152, 73.0602],
  "G-7": [33.707, 73.0482],
  "G-8": [33.701, 73.0362],
  "G-9": [33.693, 73.0212],
  "I-8": [33.678, 73.082],
  "I-10": [33.659, 73.058],
  "4TH ROAD": [33.6264, 73.0711],
  "5TH ROAD": [33.6234, 73.0738],
  "6TH ROAD": [33.6188, 73.0718],
  "7TH ROAD": [33.6159, 73.0688],
  "8TH ROAD": [33.6132, 73.0638],
  "9TH ROAD": [33.6099, 73.0594],
  "10TH ROAD": [33.6064, 73.0538],
  "11TH ROAD": [33.6019, 73.0486],
  "12TH ROAD": [33.5983, 73.0438],
  "13TH ROAD": [33.5946, 73.0384],
  "14TH ROAD": [33.5904, 73.0334],
  SADDAR: [33.5986, 73.0424],
  CANTT: [33.582, 73.065],
  CHAKLALA: [33.612, 73.098],
  WESTRIDGE: [33.575, 73.028],
  RWP: [33.6287, 73.0787],
};

const RAWALPINDI_HINTS = [
  "RAWAL",
  "RWP",
  "SADDAR",
  "CANTT",
  "CHAKLALA",
  "WESTRIDGE",
  "MURREE ROAD",
  "PESHAWAR ROAD",
  "4TH ROAD",
  "5TH ROAD",
  "6TH ROAD",
  "7TH ROAD",
  "8TH ROAD",
  "9TH ROAD",
  "10TH ROAD",
  "11TH ROAD",
  "12TH ROAD",
  "13TH ROAD",
  "14TH ROAD",
  "WORK SHOP",
  "WORKSHOP",
  "ROSE LINE",
  "ABASSI",
  "A.P.H.S",
  "APHS",
  "AIRPORT",
  "RACE COURSE",
  "MUSLIM TOWN",
  "MURREE",
  "BOSAN",
  "KARACHI COMPANY",
  "DHOK",
  "SULTAN",
  "FAIZABAD",
  "JHANDA",
  "QASIM",
];

function detectCity(value: string): "islamabad" | "rawalpindi" {
  const upper = value.toUpperCase();
  return RAWALPINDI_HINTS.some((hint) => upper.includes(hint)) ? "rawalpindi" : "islamabad";
}

function cityColor(city: "islamabad" | "rawalpindi"): string {
  return city === "rawalpindi" ? "#f59e0b" : "#38bdf8";
}

function cityLabel(city: "islamabad" | "rawalpindi"): string {
  return city === "rawalpindi" ? "Rawalpindi" : "Islamabad";
}

function normalizeCity(city?: string): "islamabad" | "rawalpindi" {
  return (city ?? "Islamabad").toLowerCase().includes("rawalpindi") ? "rawalpindi" : "islamabad";
}

function getCoords(gridStation: string, feederName: string, feederCity: "islamabad" | "rawalpindi"): [number, number] {
  const upper = `${gridStation} ${feederName}`.toUpperCase();
  const direct = GRID_COORDS[upper] ?? GRID_COORDS[gridStation];
  if (direct) return direct;

  const matchedKey = Object.keys(GRID_COORDS).find((key) => upper.includes(key) || key.includes(upper));
  if (matchedKey) return GRID_COORDS[matchedKey];

  const center = feederCity === "rawalpindi" ? [33.6292, 73.0776] : [33.6844, 73.0479];
  return [
    center[0] + (Math.random() - 0.5) * 0.045,
    center[1] + (Math.random() - 0.5) * 0.045,
  ];
}

export default function LiveMap({ feeders, tier }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const color = tierColor(tier);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [33.6844, 73.0479],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      feeders.forEach((feeder) => {
        const city = normalizeCity(feeder.city);
        const [lat, lng] = getCoords(feeder.grid_station, feeder.feeder_name, city);
        const accent = cityColor(city);
        const marker = L.circleMarker([lat, lng], {
          radius: 9,
          color: "#fff",
          weight: 1.5,
          fillColor: accent,
          fillOpacity: 0.92,
          opacity: 0.95,
        }).addTo(map);

        marker.bindTooltip(`
          <div style="font-family:Inter,sans-serif;min-width:180px">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;margin-bottom:4px">${cityLabel(city)}</div>
            <div style="font-weight:700;color:#0f172a;margin-bottom:3px">${feeder.feeder_name}</div>
            <div style="font-size:12px;color:#475569">${feeder.grid_station}</div>
          </div>
        `, { direction: "top", offset: [0, -10], opacity: 1, sticky: true, interactive: false });

        marker.on("mouseover", () => marker.openTooltip());
        marker.on("mouseout", () => marker.closeTooltip());

        L.circleMarker([lat, lng], {
          radius: 18,
          color: accent,
          weight: 1,
          fillColor: accent,
          fillOpacity: 0.16,
          opacity: 0.35,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;padding:4px 2px;min-width:180px">
            <div style="font-weight:700;color:#0f172a;margin-bottom:4px">${feeder.feeder_name}</div>
            <div style="font-size:12px;color:#475569;margin-bottom:4px">Code: ${feeder.grid_station}</div>
            <div style="font-size:11px;color:#0f172a;margin-bottom:4px;font-weight:700;text-transform:uppercase;letter-spacing:.12em">${cityLabel(city)}</div>
            <div style="font-size:12px;color:#ef4444;font-weight:600">${feeder.slot_start} - ${feeder.slot_end}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">Ends in ${feeder.ends_in_mins} mins</div>
          </div>
        `);
      });

      if (feeders.length > 0) {
        const bounds = L.latLngBounds(feeders.map((feeder) => getCoords(feeder.grid_station, feeder.feeder_name, normalizeCity(feeder.city))));
        map.fitBounds(bounds, { padding: [42, 42] });
      }
    }

    void renderMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [feeders, color]);

  return <div ref={mapRef} className="h-full min-h-[520px] w-full" />;
}
