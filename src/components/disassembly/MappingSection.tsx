import { For, Show, createEffect } from "solid-js";
import { useDisassemblyContext } from "./DisassemblyContext";
import ExportSidebar from "./ExportSidebar";
import InstrumentMappingCard from "./InstrumentMappingCard";
import { PROSE_CLASSNAME } from "../../constants/class-names";

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
          class="surface-card grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(290px,340px)]"
          ref={element => {
            sectionRef = element;
          }}
        >
          <div class="space-y-6">
            <div class="space-y-3">
              <h2 class="max-w-3xl text-2xl font-bold tracking-tight text-base-content md:text-3xl">
                General MIDI Instruments Mapping
              </h2>
              <div class={PROSE_CLASSNAME}>
                <p>
                  Melodic mappings stay on the source channel&apos;s melody track. Drum mappings are written to that
                  source channel&apos;s dedicated channel 10 drum track. Skip leaves the MML and samples alone but mutes
                  the source instrument in the MIDI export.
                </p>
                <p>
                  Drum mappings now follow the GM channel 10 key map, and you can override the target drum sound for
                  every source pitch.
                </p>
              </div>
            </div>

            <div class="grid gap-4 md:gap-6">
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
