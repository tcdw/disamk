/* eslint-disable no-bitwise */
import jsmidgen, { MidiChannel, MidiParameterValue } from "jsmidgen";
import {
  GM_DRUM_CHANNEL,
  clampGeneralMidiDrumNote,
  clampGeneralMidiProgram,
  getRenderedSourcePitch,
} from "./generalMidi";
import { InstrumentMappingTable, MIDIRenderOptions } from "./renderTypes";

interface MIDIRendererOptions {
  velocityTable: Uint8Array[];
}

interface TrackState {
  track: jsmidgen.Track;
  channel: MidiChannel;
  time: number;
  currentProgram: number | null;
}

interface ActiveNote {
  target: "melody" | "drums";
  note: number;
  velocity: MidiParameterValue;
}

export default class MIDIRenderer {
  private options: MIDIRendererOptions;

  private tickScale = 10;

  constructor(options: MIDIRendererOptions) {
    this.options = options;
  }

  private clampMidiValue(value: number) {
    return Math.max(0, Math.min(127, Math.round(value))) as MidiParameterValue;
  }

  private getTrackDelta(trackState: TrackState, time: number) {
    return Math.max(0, time - trackState.time);
  }

  private setTrackTime(trackState: TrackState, time: number) {
    trackState.time = Math.max(trackState.time, time);
  }

  private addNoteOn(trackState: TrackState, note: number, velocity: MidiParameterValue, time: number) {
    trackState.track.addNoteOn(trackState.channel, note, this.getTrackDelta(trackState, time), velocity);
    this.setTrackTime(trackState, time);
  }

  private addNoteOff(trackState: TrackState, note: number, velocity: MidiParameterValue, time: number) {
    trackState.track.addNoteOff(trackState.channel, note, this.getTrackDelta(trackState, time), velocity);
    this.setTrackTime(trackState, time);
  }

  private addController(trackState: TrackState, controller: number, value: number, time: number) {
    trackState.track.addEvent(
      new jsmidgen.Event({
        type: jsmidgen.Event.CONTROLLER,
        channel: trackState.channel,
        param1: controller as MidiParameterValue,
        param2: this.clampMidiValue(value),
        time: this.getTrackDelta(trackState, time),
      }),
    );
    this.setTrackTime(trackState, time);
  }

  private setTempo(trackState: TrackState, bpm: number, time: number) {
    trackState.track.tempo(bpm, this.getTrackDelta(trackState, time));
    this.setTrackTime(trackState, time);
  }

  private ensureProgram(trackState: TrackState, program: number, time: number) {
    const nextProgram = clampGeneralMidiProgram(program);
    if (trackState.currentProgram === nextProgram) {
      return;
    }

    trackState.track.setInstrument(
      trackState.channel,
      nextProgram as MidiParameterValue,
      this.getTrackDelta(trackState, time),
    );
    trackState.currentProgram = nextProgram;
    this.setTrackTime(trackState, time);
  }

  private resolveMapping(mappingTable: InstrumentMappingTable, instrument: number) {
    return (
      mappingTable[instrument] ?? {
        instrument,
        mode: "gm" as const,
        gmProgram: clampGeneralMidiProgram(instrument),
      }
    );
  }

  private getNoteVelocity(velocityIndex: number, noteParam: number) {
    const table = this.options.velocityTable[velocityIndex] ?? this.options.velocityTable[0];
    return this.clampMidiValue((table[noteParam & 0xf] / 255) * 127);
  }

  private getMappedDrumNote(mappingTable: InstrumentMappingTable, instrument: number, sourcePitch: number) {
    const mapping = this.resolveMapping(mappingTable, instrument);
    return this.clampMidiValue(
      mapping.drumNoteByPitch[sourcePitch] ?? mapping.drumNote ?? clampGeneralMidiDrumNote(sourcePitch),
    );
  }

  renderMIDI(subOptions: MIDIRenderOptions): void {
    const { sequence, sourceChannel, melodicTrack, drumTrack, mappingTable } = subOptions;
    const melodyState: TrackState = {
      track: melodicTrack,
      channel: sourceChannel as MidiChannel,
      time: 0,
      currentProgram: null,
    };
    const drumState: TrackState = {
      track: drumTrack,
      channel: GM_DRUM_CHANNEL,
      time: 0,
      currentProgram: null,
    };

    let currentTime = 0;
    let currentNoteLength = 0;
    let currentInstrument = 0;
    let currentNoteParam = 0x7f;
    let currentVelocityIndex = 0;
    let activeNote: ActiveNote | null = null;

    const stopActiveNote = () => {
      if (activeNote === null) {
        return;
      }

      const targetState = activeNote.target === "melody" ? melodyState : drumState;
      this.addNoteOff(targetState, activeNote.note, activeNote.velocity, currentTime);
      activeNote = null;
    };

    const startNote = (target: "melody" | "drums", note: number) => {
      const mapping = this.resolveMapping(mappingTable, currentInstrument);
      const velocity = this.getNoteVelocity(currentVelocityIndex, currentNoteParam);
      const targetState = target === "melody" ? melodyState : drumState;

      if (target === "melody") {
        this.ensureProgram(targetState, mapping.gmProgram, currentTime);
      }

      this.addNoteOn(targetState, note, velocity, currentTime);
      activeNote = {
        target,
        note,
        velocity,
      };
    };

    const addMirroredController = (controller: number, value: number) => {
      this.addController(melodyState, controller, value, currentTime);
      this.addController(drumState, controller, value, currentTime);
    };

    sequence.forEach(e => {
      const h = e[0];
      const mapping = this.resolveMapping(mappingTable, currentInstrument);

      switch (true) {
        case h >= 0x1 && h <= 0x7f: {
          currentNoteLength = h * this.tickScale;
          if (e.length > 1) {
            currentNoteParam = e[1];
          }
          break;
        }
        case h >= 0x80 && h <= 0xc5: {
          stopActiveNote();
          const sourcePitch = getRenderedSourcePitch(h - 0x80, currentInstrument);

          if (mapping.mode === "gm") {
            startNote("melody", this.clampMidiValue(sourcePitch));
          } else if (mapping.mode === "drums") {
            startNote("drums", this.getMappedDrumNote(mappingTable, currentInstrument, sourcePitch));
          }

          currentTime += currentNoteLength;
          break;
        }
        case h === 0xc6: {
          currentTime += currentNoteLength;
          break;
        }
        case h === 0xc7: {
          stopActiveNote();
          currentTime += currentNoteLength;
          break;
        }
        case h >= 0xd0 && h <= 0xd9: {
          currentInstrument = h - 0xd0 + 21;
          stopActiveNote();
          const sourcePitch = 60;

          if (this.resolveMapping(mappingTable, currentInstrument).mode === "gm") {
            startNote("melody", sourcePitch);
          } else if (this.resolveMapping(mappingTable, currentInstrument).mode === "drums") {
            startNote("drums", this.getMappedDrumNote(mappingTable, currentInstrument, sourcePitch));
          }

          currentTime += currentNoteLength;
          break;
        }
        case h === 0xda: {
          stopActiveNote();
          currentInstrument = e[1];
          break;
        }
        case h === 0xdb: {
          break;
        }
        case h === 0xe0: {
          addMirroredController(0x07, (e[1] * 127 + 127) / 255);
          break;
        }
        case h === 0xe2: {
          this.setTempo(melodyState, e[1] / 0.4096, currentTime);
          break;
        }
        case h === 0xe7: {
          addMirroredController(0x0b, (e[1] * 127 + 127) / 255);
          break;
        }
        case h === 0xfa && e[1] === 0x06: {
          currentVelocityIndex = e[2];
          break;
        }
        default: {
          break;
        }
      }
    });

    stopActiveNote();
  }
}
