import jsmidgen, { MidiChannel } from "jsmidgen";
import MIDIRenderer from "./renderMIDI";
import { MMLRenderer } from "./renderMML";
import {
  InstrumentMappingTable,
  InstrumentUsage,
  MIDIRenderData,
  RenderOptions,
  SourceChannelRender,
} from "./renderTypes";

function getOrCreateInstrumentUsage(usageMap: Map<number, InstrumentUsage>, instrument: number) {
  if (!usageMap.has(instrument)) {
    usageMap.set(instrument, {
      instrument,
      channels: [],
      noteCount: 0,
      switchCount: 0,
    });
  }
  return usageMap.get(instrument) as InstrumentUsage;
}

function markInstrumentSwitch(usageMap: Map<number, InstrumentUsage>, sourceChannel: number, instrument: number) {
  const usage = getOrCreateInstrumentUsage(usageMap, instrument);
  if (!usage.channels.includes(sourceChannel)) {
    usage.channels.push(sourceChannel);
    usage.channels.sort((left, right) => left - right);
  }
  usage.switchCount += 1;
}

function markInstrumentNote(usageMap: Map<number, InstrumentUsage>, sourceChannel: number, instrument: number) {
  const usage = getOrCreateInstrumentUsage(usageMap, instrument);
  if (!usage.channels.includes(sourceChannel)) {
    usage.channels.push(sourceChannel);
    usage.channels.sort((left, right) => left - right);
  }
  usage.noteCount += 1;
}

function collectInstrumentUsage(
  flattenedSequence: number[][],
  sourceChannel: number,
  usageMap: Map<number, InstrumentUsage>,
) {
  let currentInstrument = 0;

  flattenedSequence.forEach(event => {
    const opcode = event[0];
    switch (true) {
      case opcode === 0xda: {
        currentInstrument = event[1];
        markInstrumentSwitch(usageMap, sourceChannel, currentInstrument);
        break;
      }
      case opcode >= 0x80 && opcode <= 0xc5: {
        markInstrumentNote(usageMap, sourceChannel, currentInstrument);
        break;
      }
      case opcode >= 0xd0 && opcode <= 0xd9: {
        currentInstrument = opcode - 0xd0 + 21;
        markInstrumentSwitch(usageMap, sourceChannel, currentInstrument);
        markInstrumentNote(usageMap, sourceChannel, currentInstrument);
        break;
      }
      default: {
        break;
      }
    }
  });
}

function buildMidiFile(midiData: MIDIRenderData, mappingTable: InstrumentMappingTable) {
  const midi = new jsmidgen.File({ ticks: 480 });
  const midiRenderer = new MIDIRenderer({
    velocityTable: midiData.velocityTable,
  });

  const tracks = Array.from({ length: 16 }, (_, index) => {
    const track = new jsmidgen.Track();
    const sourceChannel = index % 8;
    const label =
      index < 8 ? `Source CH ${sourceChannel + 1} Melody` : `Source CH ${sourceChannel + 1} Drums (MIDI CH 10)`;

    track.addEvent(
      new jsmidgen.MetaEvent({
        type: jsmidgen.MetaEvent.TRACK_NAME,
        data: label,
      }),
    );

    return track;
  });

  tracks[0].addEvent({
    toBytes(): number[] {
      return [0x00, 0xf0, 0x05, 0x7e, 0x7f, 0x09, 0x01, 0xf7];
    },
  } as any);

  midiData.channels.forEach(channelData => {
    midiRenderer.renderMIDI({
      sequence: channelData.flattenedSequence,
      sourceChannel: channelData.sourceChannel,
      melodicTrack: tracks[channelData.sourceChannel],
      drumTrack: tracks[channelData.sourceChannel + 8],
      mappingTable,
    });
  });

  tracks.forEach(track => {
    midi.addTrack(track);
  });

  return midi;
}

export function render(options: RenderOptions) {
  const mmlRenderer = new MMLRenderer(options);
  const { sequences, paraList } = options;

  let mml = "";
  const midiChannels: SourceChannelRender[] = [];
  const usageMap = new Map<number, InstrumentUsage>();

  for (let i = 0; i < 8; i++) {
    if (paraList[0][i] !== 0) {
      const rawSequence = sequences[paraList[0][i]];
      const flattenedSequence = mmlRenderer.flattenSequenceData({
        sequence: rawSequence,
        handleSubroutine: true,
      });

      midiChannels.push({
        sourceChannel: i,
        flattenedSequence,
      });
      collectInstrumentUsage(flattenedSequence, i, usageMap);

      mml += `#${i}\n`;
      if (options.removeLoop) {
        mml += mmlRenderer.renderMML({
          sequence: flattenedSequence,
          channel: i,
          handleSubroutine: true,
        });
      } else {
        mml += mmlRenderer.renderMML({
          sequence: rawSequence,
          channel: i,
          handleSubroutine: true,
        });
      }
      mml += "\n\n";
    }
  }
  mml = `${mmlRenderer.state.rmc.join("\n")}\n\n${mml}`;

  const instrumentUsages = [...usageMap.values()].sort((left, right) => left.instrument - right.instrument);
  const midiData: MIDIRenderData = {
    velocityTable: options.velocityTable,
    channels: midiChannels,
    instrumentUsages,
  };

  return {
    lastInstrument: mmlRenderer.state.lastInstrument,
    mml,
    vTable: mmlRenderer.state.vTable,
    midiData,
  };
}

export { buildMidiFile };
