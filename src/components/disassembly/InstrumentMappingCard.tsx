import { For, Match, Switch } from "solid-js";
import { GENERAL_MIDI_INSTRUMENTS } from "../../core/generalMidi";
import type { InstrumentMappingMode, InstrumentUsage } from "../../core/renderTypes";
import { useDisassemblyContext } from "./DisassemblyContext";
import DrumMappingPanel from "./DrumMappingPanel";

interface InstrumentMappingCardProps {
  usage: InstrumentUsage;
}

export default function InstrumentMappingCard(props: InstrumentMappingCardProps) {
  const app = useDisassemblyContext();
  const currentMapping = () => app.getCurrentMapping(props.usage);

  return (
    <article class="surface-card-inner p-5 md:p-6">
      <div class="flex flex-col gap-4">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <div class="badge badge-primary badge-lg gap-2 px-3 py-3 font-mono">@{props.usage.instrument}</div>
            <div class="badge badge-soft badge-lg gap-2 px-3 py-3">{props.usage.noteCount} Notes</div>
          </div>
          <div>
            <div class="text-sm font-semibold">Seen on source channels</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <For each={props.usage.channels}>
                {channel => <span class="badge badge-ghost gap-2 px-3 py-3">#{channel}</span>}
              </For>
            </div>
          </div>
        </div>

        <div class="grid w-full gap-4 xl:max-w-xl xl:grid-cols-[minmax(200px,220px)_minmax(0,1fr)]">
          <fieldset class="fieldset gap-2">
            <legend class="fieldset-legend px-0 text-sm font-semibold text-base-content">Output mode</legend>
            <select
              class="select select-bordered w-full"
              value={currentMapping().mode}
              onChange={event => {
                app.setInstrumentMode(props.usage, event.currentTarget.value as InstrumentMappingMode);
              }}
            >
              <option value="gm">General MIDI program</option>
              <option value="drums">Channel 10 drums</option>
              <option value="skip">Skip in MIDI</option>
            </select>
          </fieldset>

          <Switch>
            <Match when={currentMapping().mode === "gm"}>
              <fieldset class="fieldset gap-2">
                <legend class="fieldset-legend px-0 text-sm font-semibold text-base-content">GM program</legend>
                <select
                  class="select select-bordered w-full"
                  value={String(currentMapping().gmProgram)}
                  onChange={event => {
                    app.setInstrumentProgram(props.usage, Number(event.currentTarget.value));
                  }}
                >
                  <For each={GENERAL_MIDI_INSTRUMENTS}>
                    {(programName, programIndex) => (
                      <option value={programIndex()}>
                        {`${String(programIndex() + 1).padStart(3, "0")} - ${programName}`}
                      </option>
                    )}
                  </For>
                </select>
              </fieldset>
            </Match>

            <Match when={currentMapping().mode === "drums"}>
              <DrumMappingPanel usage={props.usage} />
            </Match>

            <Match when={true}>
              <div class="surface-card-subtle border-dashed px-4 py-3 text-sm leading-7 text-base-content/60">
                This source instrument will be omitted from the MIDI export while MML and samples stay untouched.
              </div>
            </Match>
          </Switch>
        </div>
      </div>
    </article>
  );
}
