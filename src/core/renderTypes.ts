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
  sourceChannel: number;
  melodicTrack: jsmidgen.Track;
  drumTrack: jsmidgen.Track;
  mappingTable: InstrumentMappingTable;
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

export interface SourceChannelRender {
  sourceChannel: number;
  flattenedSequence: number[][];
}

export interface InstrumentPitchUsage {
  sourcePitch: number;
  noteCount: number;
}

export interface InstrumentUsage {
  instrument: number;
  channels: number[];
  noteCount: number;
  switchCount: number;
  sourcePitches: InstrumentPitchUsage[];
}

export type InstrumentMappingMode = "gm" | "drums" | "skip";

export interface InstrumentMapping {
  instrument: number;
  mode: InstrumentMappingMode;
  gmProgram: number;
  drumNote: number;
  drumNoteByPitch: Record<number, number>;
}

export type InstrumentMappingTable = Record<number, InstrumentMapping>;

export interface MIDIRenderData {
  velocityTable: Uint8Array[];
  channels: SourceChannelRender[];
  instrumentUsages: InstrumentUsage[];
}
