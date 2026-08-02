import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "VoltaIQ",
  description: "A polished load-shedding intelligence dashboard for Islamabad and Rawalpindi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_24%),linear-gradient(180deg,#060816_0%,#0a1024_55%,#050814_100%)]" />
        <Navbar />
        <main className="relative pt-24 sm:pt-28">{children}</main>
      </body>
    </html>
  );
}