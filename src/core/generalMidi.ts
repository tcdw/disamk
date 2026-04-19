import { InstrumentMapping, InstrumentMappingTable, InstrumentUsage } from "./renderTypes";

export const GENERAL_MIDI_INSTRUMENTS = [
  "Acoustic Grand Piano",
  "Bright Acoustic Piano",
  "Electric Grand Piano",
  "Honky-tonk Piano",
  "Electric Piano 1",
  "Electric Piano 2",
  "Harpsichord",
  "Clavi",
  "Celesta",
  "Glockenspiel",
  "Music Box",
  "Vibraphone",
  "Marimba",
  "Xylophone",
  "Tubular Bells",
  "Dulcimer",
  "Drawbar Organ",
  "Percussive Organ",
  "Rock Organ",
  "Church Organ",
  "Reed Organ",
  "Accordion",
  "Harmonica",
  "Tango Accordion",
  "Acoustic Guitar (nylon)",
  "Acoustic Guitar (steel)",
  "Electric Guitar (jazz)",
  "Electric Guitar (clean)",
  "Electric Guitar (muted)",
  "Overdriven Guitar",
  "Distortion Guitar",
  "Guitar Harmonics",
  "Acoustic Bass",
  "Electric Bass (finger)",
  "Electric Bass (pick)",
  "Fretless Bass",
  "Slap Bass 1",
  "Slap Bass 2",
  "Synth Bass 1",
  "Synth Bass 2",
  "Violin",
  "Viola",
  "Cello",
  "Contrabass",
  "Tremolo Strings",
  "Pizzicato Strings",
  "Orchestral Harp",
  "Timpani",
  "String Ensemble 1",
  "String Ensemble 2",
  "SynthStrings 1",
  "SynthStrings 2",
  "Choir Aahs",
  "Voice Oohs",
  "Synth Voice",
  "Orchestra Hit",
  "Trumpet",
  "Trombone",
  "Tuba",
  "Muted Trumpet",
  "French Horn",
  "Brass Section",
  "SynthBrass 1",
  "SynthBrass 2",
  "Soprano Sax",
  "Alto Sax",
  "Tenor Sax",
  "Baritone Sax",
  "Oboe",
  "English Horn",
  "Bassoon",
  "Clarinet",
  "Piccolo",
  "Flute",
  "Recorder",
  "Pan Flute",
  "Blown Bottle",
  "Shakuhachi",
  "Whistle",
  "Ocarina",
  "Lead 1 (square)",
  "Lead 2 (sawtooth)",
  "Lead 3 (calliope)",
  "Lead 4 (chiff)",
  "Lead 5 (charang)",
  "Lead 6 (voice)",
  "Lead 7 (fifths)",
  "Lead 8 (bass + lead)",
  "Pad 1 (new age)",
  "Pad 2 (warm)",
  "Pad 3 (polysynth)",
  "Pad 4 (choir)",
  "Pad 5 (bowed)",
  "Pad 6 (metallic)",
  "Pad 7 (halo)",
  "Pad 8 (sweep)",
  "FX 1 (rain)",
  "FX 2 (soundtrack)",
  "FX 3 (crystal)",
  "FX 4 (atmosphere)",
  "FX 5 (brightness)",
  "FX 6 (goblins)",
  "FX 7 (echoes)",
  "FX 8 (sci-fi)",
  "Sitar",
  "Banjo",
  "Shamisen",
  "Koto",
  "Kalimba",
  "Bag Pipe",
  "Fiddle",
  "Shanai",
  "Tinkle Bell",
  "Agogo",
  "Steel Drums",
  "Woodblock",
  "Taiko Drum",
  "Melodic Tom",
  "Synth Drum",
  "Reverse Cymbal",
  "Guitar Fret Noise",
  "Breath Noise",
  "Seashore",
  "Bird Tweet",
  "Telephone Ring",
  "Helicopter",
  "Applause",
  "Gunshot",
] as const;

export const GM_DRUM_CHANNEL = 9 as const;

export const GENERAL_MIDI_PERCUSSION_NOTES = [
  { note: 35, noteName: "B0", sound: "Acoustic Bass Drum" },
  { note: 36, noteName: "C1", sound: "Bass Drum 1" },
  { note: 37, noteName: "C#1", sound: "Side Stick" },
  { note: 38, noteName: "D1", sound: "Acoustic Snare" },
  { note: 39, noteName: "Eb1", sound: "Hand Clap" },
  { note: 40, noteName: "E1", sound: "Electric Snare" },
  { note: 41, noteName: "F1", sound: "Low Floor Tom" },
  { note: 42, noteName: "F#1", sound: "Closed Hi Hat" },
  { note: 43, noteName: "G1", sound: "High Floor Tom" },
  { note: 44, noteName: "Ab1", sound: "Pedal Hi-Hat" },
  { note: 45, noteName: "A1", sound: "Low Tom" },
  { note: 46, noteName: "Bb1", sound: "Open Hi-Hat" },
  { note: 47, noteName: "B1", sound: "Low-Mid Tom" },
  { note: 48, noteName: "C2", sound: "Hi Mid Tom" },
  { note: 49, noteName: "C#2", sound: "Crash Cymbal 1" },
  { note: 50, noteName: "D2", sound: "High Tom" },
  { note: 51, noteName: "Eb2", sound: "Ride Cymbal 1" },
  { note: 52, noteName: "E2", sound: "Chinese Cymbal" },
  { note: 53, noteName: "F2", sound: "Ride Bell" },
  { note: 54, noteName: "F#2", sound: "Tambourine" },
  { note: 55, noteName: "G2", sound: "Splash Cymbal" },
  { note: 56, noteName: "Ab2", sound: "Cowbell" },
  { note: 57, noteName: "A2", sound: "Crash Cymbal 2" },
  { note: 58, noteName: "Bb2", sound: "Vibraslap" },
  { note: 59, noteName: "B2", sound: "Ride Cymbal 2" },
  { note: 60, noteName: "C3", sound: "Hi Bongo" },
  { note: 61, noteName: "C#3", sound: "Low Bongo" },
  { note: 62, noteName: "D3", sound: "Mute Hi Conga" },
  { note: 63, noteName: "Eb3", sound: "Open Hi Conga" },
  { note: 64, noteName: "E3", sound: "Low Conga" },
  { note: 65, noteName: "F3", sound: "High Timbale" },
  { note: 66, noteName: "F#3", sound: "Low Timbale" },
  { note: 67, noteName: "G3", sound: "High Agogo" },
  { note: 68, noteName: "Ab3", sound: "Low Agogo" },
  { note: 69, noteName: "A3", sound: "Cabasa" },
  { note: 70, noteName: "Bb3", sound: "Maracas" },
  { note: 71, noteName: "B3", sound: "Short Whistle" },
  { note: 72, noteName: "C4", sound: "Long Whistle" },
  { note: 73, noteName: "C#4", sound: "Short Guiro" },
  { note: 74, noteName: "D4", sound: "Long Guiro" },
  { note: 75, noteName: "Eb4", sound: "Claves" },
  { note: 76, noteName: "E4", sound: "Hi Wood Block" },
  { note: 77, noteName: "F4", sound: "Low Wood Block" },
  { note: 78, noteName: "F#4", sound: "Mute Cuica" },
  { note: 79, noteName: "G4", sound: "Open Cuica" },
  { note: 80, noteName: "Ab4", sound: "Mute Triangle" },
  { note: 81, noteName: "A4", sound: "Open Triangle" },
] as const;

const MIDI_NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
const TRANSPORT_SMW_INSTRUMENT = [0, 0, 5, 0, 0, 0, 0, 0, 0, -5, 6, 0, -5, 0, 0, 8, 0, 0, 0] as const;

export function clampGeneralMidiProgram(program: number) {
  return Math.max(0, Math.min(127, Math.round(program)));
}

export function clampGeneralMidiDrumNote(note: number) {
  return Math.max(35, Math.min(81, Math.round(note)));
}

export function getRenderedSourcePitch(note: number, instrument: number) {
  return note + 12 + (TRANSPORT_SMW_INSTRUMENT[instrument] ?? 0);
}

export function formatMidiNoteLabel(note: number) {
  const name = MIDI_NOTE_NAMES[((note % 12) + 12) % 12];
  const octave = Math.floor(note / 12) - 2;
  return `${name}${octave}`;
}

export function createDefaultInstrumentMapping(usage: InstrumentUsage): InstrumentMapping {
  const fallbackDrumNote = clampGeneralMidiDrumNote(usage.sourcePitches[0]?.sourcePitch ?? 38);
  const drumNoteByPitch = usage.sourcePitches.reduce<Record<number, number>>((pitchMapping, pitchUsage) => {
    pitchMapping[pitchUsage.sourcePitch] = clampGeneralMidiDrumNote(pitchUsage.sourcePitch);
    return pitchMapping;
  }, {});

  return {
    instrument: usage.instrument,
    mode: "gm",
    gmProgram: clampGeneralMidiProgram(usage.instrument),
    drumNote: fallbackDrumNote,
    drumNoteByPitch,
  };
}

export function createDefaultMappingTable(instrumentUsages: InstrumentUsage[]): InstrumentMappingTable {
  return instrumentUsages.reduce<InstrumentMappingTable>((mappingTable, usage) => {
    mappingTable[usage.instrument] = createDefaultInstrumentMapping(usage);
    return mappingTable;
  }, {});
}
