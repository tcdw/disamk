import { Buffer as BBuffer } from "buffer/";
import parseSeq from "./parseSeq";
import render from "./renderMML";
import handleSample, { ISample } from "./sample";
import searchPattern from "./searchPattern";
import SPCFile from "./SPCFile";

const songAmount = 10;

interface IParsed {
    mmlFile: string;
    samples: ISample[];
}

function parse(input: Uint8Array | ArrayBuffer, song: number = 10): IParsed {
    const spc = BBuffer.from(input);
    // 输入参数检查
    if (song < 1 || song > 10) {
        throw new Error("Bad song ID! It must between 1-10!");
    }

    const spcFile: SPCFile = new SPCFile(spc);
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
    const patPointer = searchPattern(spcFile.aram, [0xf6], [
        2,
        [0x2d, 0xc4, 0x40, 0xf6],
        2,
        [0x2d, 0xc4, 0x41],
    ]);
    if (patPointer === null) {
        throw new Error(`Unable to find song pointers`);
    }
    const pointerA = spcFile.aram.readUInt16LE(patPointer + 1) + 2;
    const pointerB = spcFile.aram.readUInt16LE(patPointer + 7) + 1;
    if (pointerA !== pointerB) {
        throw new Error(`Bad song pointers`);
    }
    const songPointers = pointerA;
    // logger.info(`Song pointers: 0x${songPointers.toString(16)}`);
    // for (let i = 0; i < songAmount; i++) {
    //     logger.info(`Song ${i + 1}: 0x${spcFile.aram.readUInt16LE(songPointers + (i * 2)).toString(16)}`);
    // }

    // 对一个 song 的解析
    const songEntry = spcFile.aram.readUInt16LE(songPointers + ((song - 1) * 2));
    // logger.info(`Using song ${song} at 0x${songEntry.toString(16)}`);
    const paras: number[] = [];
    let loop = 0;
    let paraOffset = 0;
    let paraLen = 0;
    while (true) {
        const now = spcFile.aram.readUInt16LE(songEntry + paraOffset);
        paraLen += 2;
        if (now === 0) {
            // logger.debug("Para list ends!");
            break;
        } else if (now > 0 && now <= 0x7f) {
            throw new Error("Unexcepted situation: Block command between 0x01-0x7F (" + now + " at 0x" +
                (songEntry + paraOffset).toString(16) + ")");
        } else if (now > 0x7f && now <= 0xff) {
            loop = (spcFile.aram.readUInt16LE(songEntry + paraOffset + 2) - songEntry) / 2;
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
    paras.forEach((e) => {
        const para: number[] = [];
        for (let i = 0; i < 8; i++) {
            para.push(spcFile.aram.readUInt16LE(e + i * 2));
        }
        paraList.push(para);
    });

    // 对 sequence 的解析
    // 1st scan: main
    const sequences: { [key: number]: number[][]; } = {};
    let otherPointers: number[] = [];
    paraList.forEach((e) => {
        e.forEach((f) => {
            const result = parseSeq(spcFile.aram, f);
            sequences[f] = result.content;
            otherPointers.push(...result.jumps);
        });
    });
    otherPointers = [...new Set(otherPointers)];
    // 2nd scan: subroutine
    let rest: number[] = [];
    otherPointers.forEach((e) => {
        const result = parseSeq(spcFile.aram, e);
        sequences[e] = result.content;
        rest.push(...result.jumps);
    });
    // 3rd scan: possibly rmc
    rest = [...new Set(rest)];
    rest.forEach((e) => {
        const result = parseSeq(spcFile.aram, e);
        sequences[e] = result.content;
    });
    otherPointers.push(...rest);
    const { lastInstrument, mml, vTable } = render(sequences, paraList, otherPointers);
    const { header, samples } = handleSample(spcFile, songEntry + paraLen, lastInstrument);
    let mmlFile: string = "";
    if (vTable === 0) {
        mmlFile += "#option smwvtable\n";
    }
    mmlFile += header;
    mmlFile += mml;
    return { mmlFile, samples };
}

export default parse;
