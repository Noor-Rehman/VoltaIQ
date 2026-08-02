"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinned, Search, Sparkles, Zap } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: Zap },
  { href: "/feeders", label: "Feeders", icon: Search },
  { href: "/live", label: "Live Map", icon: MapPinned },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-amber-400 to-blue-500 shadow-lg shadow-orange-500/25 transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-white">
              Volta<span className="text-orange-400">IQ</span>
            </div>
            <div className="text-xs text-slate-400">Power intelligence control room</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/3 p-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${active ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:bg-white/6 hover:text-white"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:flex sm:items-center sm:gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>
    </header>
  );
}