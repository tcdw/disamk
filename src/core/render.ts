import jsmidgen, { MidiChannel } from "jsmidgen";
import MIDIRenderer from "./renderMIDI";
import { MMLRenderer } from "./renderMML";
import { RenderOptions } from "./renderTypes";

export function render(options: RenderOptions) {
  const mmlRenderer = new MMLRenderer(options);
  const midiRenderer = new MIDIRenderer(options);
  const { sequences, paraList } = options;

  let mml = "";
  const midi = new jsmidgen.File();
  for (let i = 0; i < 8; i++) {
    if (paraList[0][i] !== 0) {
      mml += `#${i}\n`;
      if (options.removeLoop) {
        mml += mmlRenderer.renderMML({
          sequence: mmlRenderer.flattenSequenceData({
            sequence: sequences[paraList[0][i]],
            handleSubroutine: true,
          }),
          channel: i,
          handleSubroutine: true,
        });
      } else {
        mml += mmlRenderer.renderMML({
          sequence: sequences[paraList[0][i]],
          channel: i,
          handleSubroutine: true,
        });
      }
      mml += "\n\n";
      const track = new jsmidgen.Track();
      if (i === 0) {
        // add GM header
        track.addEvent({
          toBytes(): number[] {
            return [0x00, 0xf0, 0x05, 0x7e, 0x7f, 0x09, 0x01, 0xf7];
          },
        } as any);
      }
      midiRenderer.renderMIDI({
        sequence: mmlRenderer.flattenSequenceData({
          sequence: sequences[paraList[0][i]],
          handleSubroutine: true,
        }),
        channel: i as MidiChannel,
        track,
      });
      midi.addTrack(track);
    }
  }
  mml = `${mmlRenderer.state.rmc.join("\n")}\n\n${mml}`;
  return {
    lastInstrument: mmlRenderer.state.lastInstrument,
    mml,
    vTable: mmlRenderer.state.vTable,
    midi,
  };
}
