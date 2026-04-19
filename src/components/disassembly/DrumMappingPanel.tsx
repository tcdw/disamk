import { For, Show } from "solid-js";
import { GENERAL_MIDI_PERCUSSION_NOTES, formatMidiNoteLabel } from "../../core/generalMidi";
import type { InstrumentUsage } from "../../core/renderTypes";
import { useDisassemblyContext } from "./DisassemblyContext";

interface DrumMappingPanelProps {
  usage: InstrumentUsage;
}

export default function DrumMappingPanel(props: DrumMappingPanelProps) {
  const app = useDisassemblyContext();
  const currentMapping = () => app.getCurrentMapping(props.usage);

  return (
    <div class="space-y-4 rounded-3xl bg-base-200/45 p-4 md:p-5">
      <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <fieldset class="fieldset gap-2">
          <legend class="fieldset-legend px-0 text-sm font-semibold text-base-content">Default drum sound</legend>
          <select
            class="select select-bordered w-full"
            value={String(currentMapping().drumNote)}
            onChange={event => {
              app.setInstrumentDrumDefault(props.usage, Number(event.currentTarget.value));
            }}
          >
            <For each={GENERAL_MIDI_PERCUSSION_NOTES}>
              {drumNote => (
                <option value={drumNote.note}>{`${drumNote.note} / ${drumNote.noteName} - ${drumNote.sound}`}</option>
              )}
            </For>
          </select>
        </fieldset>

        <button
          class="btn btn-secondary"
          type="button"
          disabled={props.usage.sourcePitches.length === 0}
          onClick={() => {
            app.applyDrumNoteToAllPitches(props.usage);
          }}
        >
          Apply default to all pitches
        </button>
      </div>

      <Show
        when={props.usage.sourcePitches.length > 0}
        fallback={
          <div class="surface-card-subtle border-dashed px-4 py-3 text-sm leading-7 text-base-content/60">
            No played pitches were detected for this instrument, so there is nothing to remap yet.
          </div>
        }
      >
        <div class="space-y-3">
          <div class="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/45">
            Per-pitch drum routing
          </div>
          <div class="grid gap-3">
            <For each={props.usage.sourcePitches}>
              {pitchUsage => (
                <div class="surface-card-subtle grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-center">
                  <div class="space-y-1">
                    <div class="text-sm font-semibold text-base-content">
                      {formatMidiNoteLabel(pitchUsage.sourcePitch)} / MIDI {pitchUsage.sourcePitch}
                    </div>
                    <div class="text-xs uppercase tracking-[0.2em] text-base-content/45">
                      Triggered {pitchUsage.noteCount} times
                    </div>
                  </div>
                  <fieldset class="fieldset gap-2">
                    <legend class="fieldset-legend px-0 text-sm font-semibold text-base-content">
                      Channel 10 drum key
                    </legend>
                    <select
                      class="select select-bordered w-full"
                      value={String(app.getDrumPitchSelection(props.usage, pitchUsage.sourcePitch))}
                      onChange={event => {
                        app.updateDrumPitchMapping(
                          props.usage,
                          pitchUsage.sourcePitch,
                          Number(event.currentTarget.value),
                        );
                      }}
                    >
                      <For each={GENERAL_MIDI_PERCUSSION_NOTES}>
                        {drumNote => (
                          <option value={drumNote.note}>
                            {`${drumNote.note} / ${drumNote.noteName} - ${drumNote.sound}`}
                          </option>
                        )}
                      </For>
                    </select>
                  </fieldset>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
