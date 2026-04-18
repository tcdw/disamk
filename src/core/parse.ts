import parseSeq from "./parseSeq";
import handleSample, { ISample } from "./sample";
import SPCFile from "./SPCFile";
import { buildMidiFile, render } from "./render";
import { InstrumentMappingTable, MIDIRenderData } from "./renderTypes";
import { readUInt16LE } from "./utils";

export interface Parsed {
  mmlFile: string;
  samples: ISample[];
  midiData: MIDIRenderData;
}

export interface ParseOptions {
  absLen: boolean;
  smwAlias: boolean;
  removeLoop?: boolean;
}

const ANY_BYTE = -1;

const SONG_POINTER_PATTERN = [
  0xf6,
  ANY_BYTE,
  ANY_BYTE,
  0x2d,
  0xc4,
  0x40,
  0xf6,
  ANY_BYTE,
  ANY_BYTE,
  0x2d,
  0xc4,
  0x41,
] as const;

const VELOCITY_TABLE_PATTERN = [
  0xf0,
  0x02,
  0x08,
  0x10,
  0xfd,
  0xf6,
  ANY_BYTE,
  ANY_BYTE,
  0xd5,
  0x11,
  0x02,
  0x09,
  0x48,
  0x5c,
] as const;

// Scan raw ARAM bytes directly so runtime-specific latin1 / windows-1252 decoding never shifts offsets.
function findBytePattern(src: Uint8Array, pattern: readonly number[]) {
  const lastStart = src.length - pattern.length;
  for (let offset = 0; offset <= lastStart; offset++) {
    let matched = true;
    for (let i = 0; i < pattern.length; i++) {
      const expected = pattern[i];
      if (expected !== ANY_BYTE && src[offset + i] !== expected) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return offset;
    }
  }
  return -1;
}

// F0 02 08 10 FD F6 __ __ D5 11 02 09 48 5C

function parse(input: ArrayBuffer, options: ParseOptions): Parsed {
  const { absLen, smwAlias, removeLoop } = options;
  const spc = new Uint8Array(input);

  const spcFile: SPCFile = new SPCFile(spc);
  const song = spcFile.aram[0xf6];
  /*
    asl     a                           ; 1c
    mov     y, a                        ; fd
    mov     a, SongPointers-$02+y       ; f6 __ __
    push    a                           ; 2d
    mov     $40, a                      ; c4 40
    mov     a, SongPointers-$01+y       ; f6 __ __
    push    a                           ; 2d
    mov     $41, a                      ; c4 41
    */
  // 搜索 sequence list
  const songPointerIndex = findBytePattern(spcFile.aram, SONG_POINTER_PATTERN);
  if (songPointerIndex === -1) {
    throw new Error("Unable to find song pointer");
  }
  const pointerA = readUInt16LE(spcFile.aram, songPointerIndex + 1) + 2;
  const pointerB = readUInt16LE(spcFile.aram, songPointerIndex + 7) + 1;
  if (pointerA !== pointerB) {
    throw new Error("Bad song pointers");
  }

  // 搜索音量换算表
  /*
    beq    +                            ; F0 02
    or     a, #$10                      ; 08 10
    +                                   ;
    mov    y, a                         ; FD
    mov    a, VelocityValues+y          ; F6 __ __
    mov    $0211+x, a                   ; D5 11 02
    or     ($5c), ($48)                 ; 09 48 5C
    */
  const velocityPointerIndex = findBytePattern(spcFile.aram, VELOCITY_TABLE_PATTERN);
  if (velocityPointerIndex === -1) {
    throw new Error("Unable to find velocity table pointer");
  }
  const velocityPointer = readUInt16LE(spcFile.aram, velocityPointerIndex + 6);
  const velocityTable = [
    spcFile.aram.slice(velocityPointer, velocityPointer + 0x10),
    spcFile.aram.slice(velocityPointer + 0x10, velocityPointer + 0x20),
  ];

  // 对一个 song 的解析
  const songEntry = readUInt16LE(spcFile.aram, pointerA + (song - 1) * 2);
  // logger.info(`Using song ${song} at 0x${songEntry.toString(16)}`);
  const paras: number[] = [];
  // let loop = 0;
  let paraOffset = 0;
  let paraLen = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const now = readUInt16LE(spcFile.aram, songEntry + paraOffset);
    paraLen += 2;
    if (now === 0) {
      // logger.debug("Para list ends!");
      break;
    } else if (now > 0 && now <= 0x7f) {
      throw new Error(
        `Unexpected situation: Block command between 0x01-0x7F (${now.toString(16)} at 0x${(
          songEntry + paraOffset
        ).toString(16)})`,
      );
    } else if (now > 0x7f && now <= 0xff) {
      // loop = (readUInt16LE(spcFile.aram, songEntry + paraOffset + 2) - songEntry) / 2;
      // logger.debug(`Para loop found, starting from ${loop}`);
      paraLen += 2;
      break;
    } else {
      // logger.debug(`Para: 0x${now.toString(16)}`);
      paras.push(now);
      paraOffset += 2;
    }
  }

  // 对 paras 的解析
  const paraList: number[][] = [];
  paras.forEach(e => {
    const para: number[] = [];
    for (let i = 0; i < 8; i++) {
      para.push(readUInt16LE(spcFile.aram, e + i * 2));
    }
    paraList.push(para);
  });

  // 对 sequence 的解析
  // 1st scan: main
  const sequences: { [key: number]: number[][] } = {};
  let otherPointers: number[] = [];
  paraList.forEach(e => {
    e.forEach(f => {
      const result = parseSeq(spcFile.aram, f);
      sequences[f] = result.content;
      otherPointers.push(...result.jumps);
    });
  });
  otherPointers = [...new Set(otherPointers)];
  // 2nd scan: subroutine
  let rest: number[] = [];
  otherPointers.forEach(e => {
    const result = parseSeq(spcFile.aram, e);
    sequences[e] = result.content;
    rest.push(...result.jumps);
  });
  // 3rd scan: possibly rmc
  rest = [...new Set(rest)];
  rest.forEach(e => {
    const result = parseSeq(spcFile.aram, e);
    sequences[e] = result.content;
  });
  otherPointers.push(...rest);
  const { lastInstrument, mml, vTable, midiData } = render({
    sequences,
    paraList,
    otherPointers,
    absLen,
    removeLoop,
    velocityTable,
  });
  const { header, samples } = handleSample(spcFile, songEntry + paraLen, lastInstrument, smwAlias);
  let mmlFile: string = "";
  if (vTable === 0) {
    mmlFile += "#option smwvtable\n";
  }
  mmlFile += header;
  mmlFile += mml;
  return { mmlFile, samples, midiData };
}

export default parse;

export function buildMappedMIDI(parsed: Parsed, mappingTable: InstrumentMappingTable) {
  return buildMidiFile(parsed.midiData, mappingTable);
}
