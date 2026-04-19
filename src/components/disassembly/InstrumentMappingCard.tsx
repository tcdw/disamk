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
    <article class="rounded-[1.75rem] border border-base-300/80 bg-base-100/80 p-4 shadow-sm md:p-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <div class="badge badge-primary badge-lg gap-2 px-4 py-3 font-mono">#{props.usage.instrument}</div>
            <div class="badge badge-outline badge-lg gap-2 px-4 py-3">Notes {props.usage.noteCount}</div>
            <div class="badge badge-outline badge-lg gap-2 px-4 py-3">Switches {props.usage.switchCount}</div>
            <div class="badge badge-outline badge-lg gap-2 px-4 py-3">Pitches {props.usage.sourcePitches.length}</div>
          </div>
          <div>
            <div class="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/45">
              Seen on source channels
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <For each={props.usage.channels}>
                {channel => <span class="badge badge-ghost gap-2 px-3 py-3">CH {channel + 1}</span>}
              </For>
            </div>
          </div>
        </div>

        <div class="grid w-full gap-3 md:max-w-xl md:grid-cols-[minmax(200px,220px)_minmax(0,1fr)]">
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
              <div class="rounded-2xl border border-dashed border-base-300 bg-base-200/50 px-4 py-3 text-sm leading-6 text-base-content/60">
                This source instrument will be omitted from the MIDI export while MML and samples stay untouched.
              </div>
            </Match>
          </Switch>
        </div>
      </div>
    </article>
  );
}
