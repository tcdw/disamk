import { For, Show, createEffect } from "solid-js";
import { useDisassemblyContext } from "./DisassemblyContext";
import ExportSidebar from "./ExportSidebar";
import InstrumentMappingCard from "./InstrumentMappingCard";

export default function MappingSection() {
  const app = useDisassemblyContext();
  let sectionRef: HTMLElement | undefined;

  createEffect(() => {
    if (app.parsed() === null) {
      return;
    }

    requestAnimationFrame(() => {
      sectionRef?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  return (
    <Show when={app.parsed()}>
      {parsedResult => (
        <section
          class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(290px,340px)]"
          ref={element => {
            sectionRef = element;
          }}
        >
          <div class="surface-card rounded-[2rem] p-6 md:p-8">
            <div class="flex flex-col gap-4 border-b border-base-300/70 pb-5 md:flex-row md:items-end md:justify-between">
              <div class="space-y-2">
                <div class="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/50">
                  General MIDI Mapping
                </div>
                <h2 class="text-3xl font-bold tracking-tight text-base-content">
                  Route each detected source instrument
                </h2>
                <p class="max-w-3xl text-sm leading-6 text-base-content/70">
                  Melodic mappings stay on the source channel&apos;s melody track. Drum mappings are written to that
                  source channel&apos;s dedicated channel 10 drum track. Skip leaves the MML and samples alone but mutes
                  the source instrument in the MIDI export.
                </p>
              </div>
              <div class="rounded-3xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
                Drum mappings now follow the GM channel 10 key map, and you can override the target drum sound for every
                source pitch.
              </div>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-3xl border border-base-300/70 bg-base-100/80 p-4 shadow-sm">
                <div class="text-sm font-semibold text-base-content/55">Detected instruments</div>
                <div class="mt-2 text-3xl font-bold text-base-content">
                  {parsedResult().midiData.instrumentUsages.length}
                </div>
              </div>
              <div class="rounded-3xl border border-base-300/70 bg-base-100/80 p-4 shadow-sm">
                <div class="text-sm font-semibold text-base-content/55">Active source channels</div>
                <div class="mt-2 text-3xl font-bold text-base-content">{parsedResult().midiData.channels.length}</div>
              </div>
              <div class="rounded-3xl border border-base-300/70 bg-base-100/80 p-4 shadow-sm">
                <div class="text-sm font-semibold text-base-content/55">Recovered samples</div>
                <div class="mt-2 text-3xl font-bold text-base-content">{parsedResult().samples.length}</div>
              </div>
              <div class="rounded-3xl border border-base-300/70 bg-base-100/80 p-4 shadow-sm">
                <div class="text-sm font-semibold text-base-content/55">ZIP output</div>
                <div class="mt-2 text-3xl font-bold text-base-content">MML + BRR + MIDI</div>
              </div>
            </div>

            <div class="mt-6 grid gap-4">
              <For each={parsedResult().midiData.instrumentUsages}>
                {usage => <InstrumentMappingCard usage={usage} />}
              </For>
            </div>
          </div>

          <ExportSidebar />
        </section>
      )}
    </Show>
  );
}
