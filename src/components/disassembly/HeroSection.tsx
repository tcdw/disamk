import AnalyzePanel from "./AnalyzePanel";

export default function HeroSection() {
  return (
    <section class="surface-card relative overflow-hidden rounded-[2rem] p-6 md:p-8">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_right,rgba(214,110,146,0.30),transparent_60%),radial-gradient(circle_at_top_left,rgba(74,127,167,0.16),transparent_45%)]" />
      <div class="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div class="space-y-5">
          <div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            AddmusicK 1.0.x SPC Disassembler
          </div>
          <div class="space-y-4">
            <h1 class="max-w-3xl text-4xl font-bold tracking-tight text-base-content md:text-5xl">
              Parse first… then decide how each source instrument should behave in General MIDI
            </h1>
            <p class="max-w-2xl text-base leading-7 text-base-content/70 md:text-lg">
              This build keeps the MML and sample export you already had, then pauses before download so you can route
              every detected instrument to a GM program, channel 10 drums, or silence.
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-3xl border border-base-300/70 bg-base-100/75 p-4 shadow-sm">
              <div class="text-sm font-semibold text-base-content/60">Export flow</div>
              <div class="mt-2 text-lg font-bold text-base-content">Parse / Map / Download</div>
            </div>
            <div class="rounded-3xl border border-base-300/70 bg-base-100/75 p-4 shadow-sm">
              <div class="text-sm font-semibold text-base-content/60">MIDI layout</div>
              <div class="mt-2 text-lg font-bold text-base-content">8 melodic + 8 drum tracks</div>
            </div>
            <div class="rounded-3xl border border-base-300/70 bg-base-100/75 p-4 shadow-sm">
              <div class="text-sm font-semibold text-base-content/60">Runs entirely</div>
              <div class="mt-2 text-lg font-bold text-base-content">In your browser</div>
            </div>
          </div>
        </div>

        <AnalyzePanel />
      </div>
    </section>
  );
}
