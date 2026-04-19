import { Show } from "solid-js";
import { useDisassemblyContext } from "./DisassemblyContext";

export default function AnalyzePanel() {
  const app = useDisassemblyContext();

  return (
    <div class="rounded-[1.75rem] border border-base-300/80 bg-base-100/90 p-5 shadow-soft md:p-6">
      <form
        class="space-y-5"
        onSubmit={event => {
          event.preventDefault();
          void app.analyzeSelectedFile();
        }}
      >
        <div class="space-y-2">
          <div class="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/50">Analyze SPC</div>
          <p class="text-sm leading-6 text-base-content/70">
            Pick a file, choose how strict the MML should be, then let the mapping panel appear below.
          </p>
        </div>

        <Show when={app.error()}>
          <div class="alert alert-error text-sm shadow-sm">
            <span>{app.error()}</span>
          </div>
        </Show>

        <fieldset class="fieldset gap-2">
          <legend class="fieldset-legend px-0 text-sm font-semibold text-base-content">SPC file</legend>
          <input
            type="file"
            accept=".spc,.sp2"
            class="file-input file-input-bordered file-input-primary w-full"
            onChange={event => {
              app.selectFile(event.currentTarget.files?.[0] ?? null);
            }}
          />
        </fieldset>

        <div class="grid gap-3">
          <label class="flex cursor-pointer items-start gap-3 rounded-3xl border border-base-300/80 bg-base-200/40 px-4 py-4">
            <input
              type="checkbox"
              class="checkbox checkbox-primary mt-0.5"
              checked={app.absLen()}
              onChange={event => {
                app.updateAbsLen(event.currentTarget.checked);
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
              checked={app.smwAlias()}
              onChange={event => {
                app.updateSmwAlias(event.currentTarget.checked);
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

        <button class="btn btn-primary btn-block btn-lg shadow-soft" type="submit" disabled={app.hasBusyState()}>
          {app.isParsing() ? "Parsing SPC..." : "Analyze and open mapping panel"}
        </button>
      </form>
    </div>
  );
}
