import { PROSE_CLASSNAME } from "../../constants/class-names";
import AnalyzePanel from "./AnalyzePanel";

export default function HeroSection() {
  return (
    <section class="relative overflow-hidden rounded-4xl p-6 md:p-8 bg-white/60 dark:bg-gray-950/60">
      <div class="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div class="space-y-5">
          <div class="space-y-4">
            <h1 class="max-w-3xl text-3xl font-bold tracking-tight text-base-content md:text-4xl leading-tight">
              AddmusicK 1.0.x SPC Disassembler
            </h1>
            <div class={PROSE_CLASSNAME}>
              <p>You can convert your AddMusicK 1.0.X SPC back into MML, BRR samples and a mapped MIDI file.</p>
              <p>
                Select your SPC file, analyze it, then choose how each detected source instrument should be exported.
                You can map instruments to General MIDI programs, route them to channel 10 drums, and fine-tune drum
                keys per source pitch before downloading the ZIP.
              </p>
              <p>
                <b>Only unmodified versions of AddMusicK 1.0.0 ~ 1.0.9 SPC is guaranteed to be supported.</b> For
                AddMusic 4.05/M/etc SPC, use{` `}
                <a href="https://drive.google.com/drive/folders/0B6s5ZRAO2QlAS1RuSzRubm13OWM" target="_blank">
                  NintSPC
                </a>
                ; you can also use{` `}
                <a href="https://dl.dropboxusercontent.com/s/t6yzrre03w3tz6f/nintspc.exe" target="_blank">
                  my own build of NintSPC
                </a>
                {` for accurate qXY command conversions and additional AddMusic commands support `}
                <a href="https://github.com/tcdw/NintSPC-mod" target="_blank">
                  (source)
                </a>
                .
              </p>
            </div>
          </div>
        </div>
        <AnalyzePanel />
      </div>
    </section>
  );
}
