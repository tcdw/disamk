import { useDisassemblyContext } from "./DisassemblyContext";

export default function ExportSidebar() {
  const app = useDisassemblyContext();

  return (
    <aside class="flex flex-col gap-6">
      <div class="surface-card-inner p-5 md:p-6">
        <div class="space-y-2">
          <h3 class="text-xl font-bold tracking-tight text-base-content md:text-2xl">
            {app.selectedFile()?.name ?? "Current SPC export"}
          </h3>
          <p class="text-base leading-8 text-base-content/68">
            The resulting MIDI file uses 16 tracks total: 8 melodic tracks on MIDI channels 1-8 plus 8 drum tracks all
            assigned to MIDI channel 10.
          </p>
        </div>

        <div class="mt-5 space-y-3">
          <button
            class="btn btn-primary btn-block btn-lg shadow-soft h-20"
            type="button"
            disabled={app.hasBusyState()}
            onClick={() => {
              void app.downloadBundle();
            }}
          >
            {app.isDownloading() ? "Building ZIP..." : "Download mapped disassembly ZIP"}
          </button>
          <button
            class="btn btn-soft btn-block"
            type="button"
            disabled={app.hasBusyState()}
            onClick={() => {
              app.resetWorkspace();
            }}
          >
            Clear mapping panel
          </button>
        </div>
      </div>

      {/* <div class="surface-card-inner p-5 md:p-6">
        <div class="space-y-3">
          <div class="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/45">Notes</div>
          <ul class="space-y-4 text-base leading-8 text-base-content/70">
            <li>
              The GM percussion list follows the General MIDI channel 10 key map you shared, so every drum destination
              is now an explicit key instead of a blind carry-over.
            </li>
            <li>
              Source channels keep their timing and controller data, which means volume automation still follows the
              original sequence flow.
            </li>
            <li>
              If you change the SPC file or MML options above, the mapping panel resets so you don&apos;t export stale
              data by accident.
            </li>
          </ul>
        </div>
      </div> */}
    </aside>
  );
}
