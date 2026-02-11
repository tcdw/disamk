import jsmidgen, { MidiChannel } from "jsmidgen";

// ==================== Type Definitions ====================
export interface RenderOptions {
  sequences: Record<number, number[][]>;
  paraList: number[][];
  otherPointers: number[];
  absLen: boolean;
  removeLoop?: boolean;
  velocityTable: Uint8Array[];
}

export interface MMLRenderOptions {
  sequence: number[][];
  handleSubroutine?: boolean;
  channel?: number;
  noteLength?: number;
  prevQ?: number;
}

export interface MIDIRenderOptions {
  sequence: number[][];
  channel: MidiChannel;
  track: jsmidgen.Track;
}

export interface SequenceFlattenerOptions {
  sequence: number[][];
  handleSubroutine?: boolean;
}

export interface MMLState {
  label: number;
  vTable: number;
  lastInstrument: number;
  callID: { [key: number]: number | null };
  rmc: string[];
}
