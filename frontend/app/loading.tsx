export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-white/8 bg-white/5 px-5 py-3 text-sm text-slate-300">
        <span className="h-3 w-3 rounded-full bg-orange-400 animate-pulse" />
        Loading...
      </div>
    </div>
  );
}