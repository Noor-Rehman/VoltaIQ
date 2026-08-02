export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <section className="card-shell rounded-[2rem] p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">How it works</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">A proper application, not scattered screens.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          VoltaIQ combines weather-driven tier prediction, feeder lookup, and a live outage map into one clean control room interface.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="soft-panel rounded-[1.5rem] p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">1. Predict</div>
            <h2 className="mt-3 text-2xl font-semibold text-white">Weather goes in.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">The model converts temperature, humidity, wind, solar radiation, and precipitation into a tier forecast.</p>
          </div>
          <div className="soft-panel rounded-[1.5rem] p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">2. Search</div>
            <h2 className="mt-3 text-2xl font-semibold text-white">Find your feeder.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Users search by feeder name or grid station and see the exact windows for the current tier.</p>
          </div>
          <div className="soft-panel rounded-[1.5rem] p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">3. Monitor</div>
            <h2 className="mt-3 text-2xl font-semibold text-white">Watch live outages.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">A live map helps operations and users see which feeders are off right now.</p>
          </div>
        </div>
      </section>
    </div>
  );
}