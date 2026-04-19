import JSZip from "jszip";
import { For, Show, createSignal } from "solid-js";
import { buildMappedMIDI, Parsed } from "./core/parse";
import {
  GENERAL_MIDI_INSTRUMENTS,
  GENERAL_MIDI_PERCUSSION_NOTES,
  createDefaultInstrumentMapping,
  createDefaultMappingTable,
  formatMidiNoteLabel,
} from "./core/generalMidi";
import { InstrumentMappingMode, InstrumentMappingTable, InstrumentUsage } from "./core/renderTypes";
import parse from "./core/parse";

function bytesToUint8Array(data: (string | number)[]) {
  const built: number[] = [];
  for (let index = 0; index < data.length; index += 1) {
    const value = data[index];
    if (typeof value === "string") {
      built.push(value.charCodeAt(0));
    } else {
      built.push(value);
    }
  }
  return Uint8Array.from(built);
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.style.display = "none";
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return `${error}`;
}

export default function App() {
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [absLen, setAbsLen] = createSignal(false);
  const [smwAlias, setSmwAlias] = createSignal(true);
  const [parsed, setParsed] = createSignal<Parsed | null>(null);
  const [mappingTable, setMappingTable] = createSignal<InstrumentMappingTable>({});
  const [error, setError] = createSignal("");
  const [busyState, setBusyState] = createSignal<"idle" | "parsing" | "downloading">("idle");

  let mappingSection: HTMLElement | undefined;

  const isParsing = () => busyState() === "parsing";
  const isDownloading = () => busyState() === "downloading";
  const hasBusyState = () => busyState() !== "idle";

  const clearParsedOutput = () => {
    setParsed(null);
    setMappingTable({});
  };

  const updateMapping = (instrument: number, patch: Partial<InstrumentMappingTable[number]>) => {
    setMappingTable(currentMappings => ({
      ...currentMappings,
      [instrument]: {
        ...currentMappings[instrument],
        ...patch,
      },
    }));
  };

  const getCurrentMapping = (usage: InstrumentUsage) =>
    mappingTable()[usage.instrument] ?? createDefaultInstrumentMapping(usage);

  const updateDrumPitchMapping = (usage: InstrumentUsage, sourcePitch: number, drumNote: number) => {
    const currentMapping = getCurrentMapping(usage);
    updateMapping(usage.instrument, {
      drumNoteByPitch: {
        ...currentMapping.drumNoteByPitch,
        [sourcePitch]: drumNote,
      },
    });
  };

  const applyDrumNoteToAllPitches = (usage: InstrumentUsage) => {
    const currentMapping = getCurrentMapping(usage);
    const drumNoteByPitch = usage.sourcePitches.reduce<Record<number, number>>((pitchMapping, pitchUsage) => {
      pitchMapping[pitchUsage.sourcePitch] = currentMapping.drumNote;
      return pitchMapping;
    }, {});

    updateMapping(usage.instrument, {
      drumNoteByPitch,
    });
  };

  const getDrumPitchSelection = (usage: InstrumentUsage, sourcePitch: number) => {
    const currentMapping = getCurrentMapping(usage);
    return currentMapping.drumNoteByPitch[sourcePitch] ?? currentMapping.drumNote;
  };

  const analyzeFile = async (event: SubmitEvent) => {
    event.preventDefault();

    const inputFile = selectedFile();
    if (inputFile === null) {
      setError("Please choose a SPC file before starting.");
      clearParsedOutput();
      return;
    }

    setBusyState("parsing");
    setError("");

    try {
      const arrayBuffer = await inputFile.arrayBuffer();
      const parsedResult = parse(arrayBuffer, {
        absLen: absLen(),
        smwAlias: smwAlias(),
        removeLoop: false,
      });

      setParsed(parsedResult);
      setMappingTable(createDefaultMappingTable(parsedResult.midiData.instrumentUsages));

      requestAnimationFrame(() => {
        mappingSection?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (parseError) {
      clearParsedOutput();
      setError(formatErrorMessage(parseError));
    } finally {
      setBusyState("idle");
    }
  };

  const downloadBundle = async () => {
    const parsedResult = parsed();
    const inputFile = selectedFile();
    if (parsedResult === null || inputFile === null) {
      setError("Analyze a SPC file first, then the export button will stop being dramatic.");
      return;
    }

    setBusyState("downloading");
    setError("");

    try {
      const zip = new JSZip();
      const sampleDir = `${inputFile.name}_samples`;
      const midiFile = buildMappedMIDI(parsedResult, mappingTable());

      zip.file(`${inputFile.name}.txt`, `#amk 2\n#path "${sampleDir}"\n${parsedResult.mmlFile}`);

      const sampleFolder = zip.folder(sampleDir);
      parsedResult.samples.forEach(sample => {
        sampleFolder?.file(sample.name, sample.data);
      });

      zip.file(`${inputFile.name}.mid`, bytesToUint8Array(midiFile.toBytes()));

      const archive = await zip.generateAsync({
        type: "blob",
      });

      triggerDownload(`${inputFile.name}_disamk.zip`, archive);
    } catch (downloadError) {
      setError(formatErrorMessage(downloadError));
    } finally {
      setBusyState("idle");
    }
  };

  return (
    <main class="relative min-h-screen overflow-hidden">
      <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
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
                  This build keeps the MML and sample export you already had, then pauses before download so you can
                  route every detected instrument to a GM program, channel 10 drums, or silence.
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

            <div class="rounded-[1.75rem] border border-base-300/80 bg-base-100/90 p-5 shadow-soft md:p-6">
              <form class="space-y-5" onSubmit={analyzeFile}>
                <div class="space-y-2">
                  <div class="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/50">Analyze SPC</div>
                  <p class="text-sm leading-6 text-base-content/70">
                    Pick a file, choose how strict the MML should be, then let the mapping panel appear below.
                  </p>
                </div>

                <Show when={error()}>
                  <div class="alert alert-error text-sm shadow-sm">
                    <span>{error()}</span>
                  </div>
                </Show>

                <label class="form-control gap-2">
                  <span class="label-text font-semibold text-base-content">SPC file</span>
                  <input
                    type="file"
                    accept=".spc,.sp2"
                    class="file-input file-input-bordered file-input-primary w-full"
                    onChange={event => {
                      setSelectedFile(event.currentTarget.files?.[0] ?? null);
                      clearParsedOutput();
                      setError("");
                    }}
                  />
                </label>

                <div class="grid gap-3">
                  <label class="flex cursor-pointer items-start gap-3 rounded-3xl border border-base-300/80 bg-base-200/40 px-4 py-4">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-primary mt-0.5"
                      checked={absLen()}
                      onChange={event => {
                        setAbsLen(event.currentTarget.checked);
                        clearParsedOutput();
                      }}
                    />
                    <div>
                      <div class="font-semibold text-base-content">Always output absolute note length</div>
                      <div class="text-sm leading-6 text-base-content/65">
                        Useful if you want the recovered MML to mirror exact ticks rather than note syntax.
                      </div>
                    </div>
                  </label>

                  <label class="flex cursor-pointer items-start gap-3 rounded-3xl border border-base-300/80 bg-base-200/40 px-4 py-4">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-primary mt-0.5"
                      checked={smwAlias()}
                      onChange={event => {
                        setSmwAlias(event.currentTarget.checked);
                        clearParsedOutput();
                      }}
                    />
                    <div>
                      <div class="font-semibold text-base-content">Use SMW aliases in #instruments</div>
                      <div class="text-sm leading-6 text-base-content/65">
                        Keeps the sample header friendlier if you plan to bring the output back into AddmusicK.
                      </div>
                    </div>
                  </label>
                </div>

                <button class="btn btn-primary btn-block btn-lg shadow-soft" type="submit" disabled={hasBusyState()}>
                  {isParsing() ? "Parsing SPC..." : "Analyze and open mapping panel"}
                </button>
              </form>
            </div>
          </div>
        </section>

        <Show when={parsed()}>
          {parsedResult => (
            <section
              class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(290px,340px)]"
              ref={element => {
                mappingSection = element;
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
                      source channel&apos;s dedicated channel 10 drum track. Skip leaves the MML and samples alone but
                      mutes the source instrument in the MIDI export.
                    </p>
                  </div>
                  <div class="rounded-3xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
                    Drum mappings now follow the GM channel 10 key map, and you can override the target drum sound for
                    every source pitch.
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
                    <div class="mt-2 text-3xl font-bold text-base-content">
                      {parsedResult().midiData.channels.length}
                    </div>
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
                    {usage => {
                      const currentMapping = () => getCurrentMapping(usage);

                      return (
                        <article class="rounded-[1.75rem] border border-base-300/80 bg-base-100/80 p-4 shadow-sm md:p-5">
                          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div class="space-y-3">
                              <div class="flex flex-wrap items-center gap-3">
                                <div class="badge badge-primary badge-lg gap-2 px-4 py-3 font-mono">
                                  #{usage.instrument}
                                </div>
                                <div class="badge badge-outline badge-lg gap-2 px-4 py-3">Notes {usage.noteCount}</div>
                                <div class="badge badge-outline badge-lg gap-2 px-4 py-3">
                                  Switches {usage.switchCount}
                                </div>
                                <div class="badge badge-outline badge-lg gap-2 px-4 py-3">
                                  Pitches {usage.sourcePitches.length}
                                </div>
                              </div>
                              <div>
                                <div class="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/45">
                                  Seen on source channels
                                </div>
                                <div class="mt-2 flex flex-wrap gap-2">
                                  <For each={usage.channels}>
                                    {channel => <span class="badge badge-ghost gap-2 px-3 py-3">CH {channel + 1}</span>}
                                  </For>
                                </div>
                              </div>
                            </div>

                            <div class="grid w-full gap-3 md:max-w-xl md:grid-cols-[minmax(200px,220px)_minmax(0,1fr)]">
                              <label class="form-control gap-2">
                                <span class="label-text font-semibold text-base-content">Output mode</span>
                                <select
                                  class="select select-bordered w-full"
                                  value={currentMapping().mode}
                                  onChange={event =>
                                    updateMapping(usage.instrument, {
                                      mode: event.currentTarget.value as InstrumentMappingMode,
                                    })
                                  }
                                >
                                  <option value="gm">General MIDI program</option>
                                  <option value="drums">Channel 10 drums</option>
                                  <option value="skip">Skip in MIDI</option>
                                </select>
                              </label>

                              <Show
                                when={currentMapping().mode === "gm"}
                                fallback={
                                  <Show
                                    when={currentMapping().mode === "drums"}
                                    fallback={
                                      <div class="rounded-2xl border border-dashed border-base-300 bg-base-200/50 px-4 py-3 text-sm leading-6 text-base-content/60">
                                        This source instrument will be omitted from the MIDI export while MML and
                                        samples stay untouched.
                                      </div>
                                    }
                                  >
                                    <div class="space-y-4 rounded-[1.5rem] border border-base-300/80 bg-base-200/45 p-4">
                                      <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                                        <label class="form-control gap-2">
                                          <span class="label-text font-semibold text-base-content">
                                            Default drum sound
                                          </span>
                                          <select
                                            class="select select-bordered w-full"
                                            value={String(currentMapping().drumNote)}
                                            onChange={event =>
                                              updateMapping(usage.instrument, {
                                                drumNote: Number(event.currentTarget.value),
                                              })
                                            }
                                          >
                                            <For each={GENERAL_MIDI_PERCUSSION_NOTES}>
                                              {drumNote => (
                                                <option value={drumNote.note}>
                                                  {`${drumNote.note} / ${drumNote.noteName} - ${drumNote.sound}`}
                                                </option>
                                              )}
                                            </For>
                                          </select>
                                        </label>

                                        <button
                                          class="btn btn-secondary"
                                          type="button"
                                          disabled={usage.sourcePitches.length === 0}
                                          onClick={() => applyDrumNoteToAllPitches(usage)}
                                        >
                                          Apply default to all pitches
                                        </button>
                                      </div>

                                      <Show
                                        when={usage.sourcePitches.length > 0}
                                        fallback={
                                          <div class="rounded-2xl border border-dashed border-base-300 bg-base-100/70 px-4 py-3 text-sm leading-6 text-base-content/60">
                                            No played pitches were detected for this instrument, so there is nothing to
                                            remap yet.
                                          </div>
                                        }
                                      >
                                        <div class="space-y-3">
                                          <div class="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/45">
                                            Per-pitch drum routing
                                          </div>
                                          <div class="grid gap-3">
                                            <For each={usage.sourcePitches}>
                                              {pitchUsage => (
                                                <div class="grid gap-3 rounded-2xl border border-base-300/80 bg-base-100/80 px-4 py-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-center">
                                                  <div class="space-y-1">
                                                    <div class="text-sm font-semibold text-base-content">
                                                      {formatMidiNoteLabel(pitchUsage.sourcePitch)} / MIDI{" "}
                                                      {pitchUsage.sourcePitch}
                                                    </div>
                                                    <div class="text-xs uppercase tracking-[0.2em] text-base-content/45">
                                                      Triggered {pitchUsage.noteCount} times
                                                    </div>
                                                  </div>
                                                  <label class="form-control gap-2">
                                                    <span class="label-text font-semibold text-base-content">
                                                      Channel 10 drum key
                                                    </span>
                                                    <select
                                                      class="select select-bordered w-full"
                                                      value={String(
                                                        getDrumPitchSelection(usage, pitchUsage.sourcePitch),
                                                      )}
                                                      onChange={event =>
                                                        updateDrumPitchMapping(
                                                          usage,
                                                          pitchUsage.sourcePitch,
                                                          Number(event.currentTarget.value),
                                                        )
                                                      }
                                                    >
                                                      <For each={GENERAL_MIDI_PERCUSSION_NOTES}>
                                                        {drumNote => (
                                                          <option value={drumNote.note}>
                                                            {`${drumNote.note} / ${drumNote.noteName} - ${drumNote.sound}`}
                                                          </option>
                                                        )}
                                                      </For>
                                                    </select>
                                                  </label>
                                                </div>
                                              )}
                                            </For>
                                          </div>
                                        </div>
                                      </Show>
                                    </div>
                                  </Show>
                                }
                              >
                                <label class="form-control gap-2">
                                  <span class="label-text font-semibold text-base-content">GM program</span>
                                  <select
                                    class="select select-bordered w-full"
                                    value={String(currentMapping().gmProgram)}
                                    onChange={event =>
                                      updateMapping(usage.instrument, {
                                        gmProgram: Number(event.currentTarget.value),
                                      })
                                    }
                                  >
                                    <For each={GENERAL_MIDI_INSTRUMENTS}>
                                      {(programName, programIndex) => (
                                        <option value={programIndex()}>
                                          {`${String(programIndex() + 1).padStart(3, "0")} - ${programName}`}
                                        </option>
                                      )}
                                    </For>
                                  </select>
                                </label>
                              </Show>
                            </div>
                          </div>
                        </article>
                      );
                    }}
                  </For>
                </div>
              </div>

              <aside class="flex flex-col gap-6">
                <div class="surface-card rounded-[2rem] p-5">
                  <div class="space-y-2">
                    <div class="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/50">
                      Ready to export
                    </div>
                    <h3 class="text-2xl font-bold tracking-tight text-base-content">
                      {selectedFile()?.name ?? "Current SPC export"}
                    </h3>
                    <p class="text-sm leading-6 text-base-content/68">
                      The resulting MIDI file uses 16 tracks total: 8 melodic tracks on MIDI channels 1-8 plus 8 drum
                      tracks all assigned to MIDI channel 10.
                    </p>
                  </div>

                  <div class="mt-5 space-y-3">
                    <button
                      class="btn btn-primary btn-block btn-lg shadow-soft"
                      type="button"
                      onClick={downloadBundle}
                      disabled={hasBusyState()}
                    >
                      {isDownloading() ? "Building ZIP..." : "Download mapped disassembly ZIP"}
                    </button>
                    <button
                      class="btn btn-ghost btn-block"
                      type="button"
                      onClick={() => {
                        clearParsedOutput();
                        setError("");
                      }}
                      disabled={hasBusyState()}
                    >
                      Clear mapping panel
                    </button>
                  </div>
                </div>

                <div class="surface-card rounded-[2rem] p-5">
                  <div class="space-y-3">
                    <div class="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/50">Notes</div>
                    <ul class="space-y-3 text-sm leading-6 text-base-content/70">
                      <li>
                        The GM percussion list follows the General MIDI channel 10 key map you shared, so every drum
                        destination is now an explicit key instead of a blind carry-over.
                      </li>
                      <li>
                        Source channels keep their timing and controller data, which means volume automation still
                        follows the original sequence flow.
                      </li>
                      <li>
                        If you change the SPC file or MML options above, the mapping panel resets so you don&apos;t
                        export stale data by accident.
                      </li>
                    </ul>
                  </div>
                </div>
              </aside>
            </section>
          )}
        </Show>
      </div>
    </main>
  );
}
