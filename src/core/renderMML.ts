/* eslint-disable no-bitwise */

import jsmidgen, { MidiChannel } from 'jsmidgen';
import printBuffer from './printBuffer';
import printByte from './printByte';
import { readInt8, readUInt16LE } from './utils';

const notes: string[] = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];

function render(
    sequences: { [key: number]: number[][]; },
    paraList: number[][],
    otherPointers: number[],
    absLen: boolean,
) {
    // 改写自 https://github.com/loveemu/spc_converters_legacy/blob/master/nintspc/src/nintspc.c
    function getNoteLenForMML(tick: number, division = 48) {
        if (absLen) {
            return `=${tick}`;
        }
        const dotMax = 6;
        const note = division * 4;
        let l;
        let dot;
        let text = '';
        for (l = 1; l <= note; l += 1) {
            let cTick = 0;
            for (dot = 0; dot <= dotMax; dot += 1) {
                const ld = (l << dot);
                if (note % ld) {
                    break;
                }
                cTick += note / ld;
                if (tick === cTick) {
                    text += l;
                    for (; dot > 0; dot -= 1) {
                        text += '.';
                    }
                    return text;
                }
            }
        }
        return `=${tick}`;
    }

    // MML State
    let label = 1;
    let vTable = 1;
    let lastInstrument = 0;
    const callID: { [key: number]: number | null; } = {};
    const rmc: string[] = [];
    otherPointers.forEach((e) => {
        callID[e] = null;
    });

    function renderMML(sequence: number[][], handleSubroutine = false, channel: number = -1) {
        const content: string[][] = [];
        let current: string[] = [];
        let prevOctave = 0;
        let noteLength = 0;
        let prevQ = 0;
        let currentTotalTick = 0;
        let offset = paraList[0][channel] || 0;
        let loopPut = false;

        function add(e: string) {
            current.push(e);
        }

        function lineBreak() {
            if (current.length > 0) {
                content.push(current);
                current = [];
            }
        }

        sequence.forEach((e, i) => {
            const h = e[0];
            const next = sequence[i + 1] || {};

            switch (true) {
            case h >= 0x1 && h <= 0x7f: {
                noteLength = h;
                if (e.length > 1) {
                    if (prevQ !== e[1]) {
                        prevQ = e[1];
                        add(`q${printByte(e[1])}`);
                    }
                }
                break;
            }
            case h >= 0x80 && h <= 0xc5: {
                const note = h - 0x80;
                const octave = Math.floor((h - 0x80) / 12) + 1;
                if (prevOctave < 1) {
                    add(`o${octave}`);
                } else if (octave > prevOctave) {
                    add('>'.repeat(octave - prevOctave));
                } else if (octave < prevOctave) {
                    add('<'.repeat(prevOctave - octave));
                }
                prevOctave = octave;
                add(`${notes[note % 12]}${getNoteLenForMML(noteLength)}`);
                currentTotalTick += noteLength;
                if (next[0] >= 0xda || currentTotalTick >= 192) {
                    lineBreak();
                }
                if (currentTotalTick >= 192) {
                    currentTotalTick = 0;
                }
                break;
            }
            case h === 0xc6: {
                add(`^${getNoteLenForMML(noteLength)}`);
                currentTotalTick += noteLength;
                if (next[0] >= 0xda || currentTotalTick >= 192) {
                    lineBreak();
                }
                if (currentTotalTick >= 192) {
                    currentTotalTick = 0;
                }
                break;
            }
            case h === 0xc7: {
                add(`r${getNoteLenForMML(noteLength)}`);
                currentTotalTick += noteLength;
                if (next[0] >= 0xda || currentTotalTick >= 192) {
                    lineBreak();
                }
                if (currentTotalTick >= 192) {
                    currentTotalTick = 0;
                }
                break;
            }
            case h >= 0xd0 && h <= 0xd9: {
                add(`@${h - 0xd0 + 21} c${getNoteLenForMML(noteLength)}`);
                currentTotalTick += noteLength;
                if (next[0] >= 0xda || currentTotalTick >= 192) {
                    lineBreak();
                }
                if (currentTotalTick >= 192) {
                    currentTotalTick = 0;
                }
                break;
            }
            case h === 0xda: {
                lineBreak();
                add(`@${e[1]}`);
                if (e[1] < 30) {
                    add(' h0');
                }
                if (lastInstrument < e[1]) {
                    lastInstrument = e[1];
                }
                break;
            }
            case h === 0xdb: {
                if (e[1] <= 20) {
                    add(`y${e[1]}`);
                } else {
                    const echoL = (e[1] >> 7) % 2;
                    const echoR = (e[1] >> 6) % 2;
                    add(`y${e[1] % 0x40},${echoL},${echoR}`);
                }
                break;
            }
            case h === 0xe0: {
                add(`w${e[1]}`);
                break;
            }
            case h === 0xe2: {
                add(`t${e[1]}`);
                break;
            }
            case h === 0xe6 && e[1] === 0x00: {
                lineBreak();
                add('[[');
                lineBreak();
                break;
            }
            case h === 0xe6: {
                lineBreak();
                add(`]]${e[1] + 1}`);
                lineBreak();
                break;
            }
            case h === 0xe7: {
                add(`v${e[1]}`);
                break;
            }
            case h === 0xe9: {
                // lineBreak();
                // add(`; ${printBBuffer(e)}    ; subroutine called`);
                // lineBreak();
                if (handleSubroutine) {
                    const addr = readUInt16LE(e, 1);
                    lineBreak();
                    let loopCall = '';
                    if (callID[addr] === null) {
                        callID[addr] = label;
                        label += 1;
                        loopCall = `[\n${renderMML(sequences[addr])}\n]`;
                    }
                    loopCall = `(${callID[addr]})${loopCall}${e[3]}`;
                    add(loopCall);
                    lineBreak();
                    prevOctave = 0;
                }
                break;
            }
            case h === 0xfa && e[1] === 0x04: {
                // lineBreak();
                // add(`; ${printBBuffer(e)}    ; echo BBuffer: ${e[2] * 0x0800}`);
                // lineBreak();
                break;
            }
            case h === 0xfa && e[1] === 0x06: {
                vTable = e[2];
                break;
            }
            case h === 0xfc: {
                // lineBreak();
                // add(`; ${printBBuffer(e)}    ; rmc called`);
                lineBreak();
                const addr = readUInt16LE(e, 1);
                if (callID[addr] === null) {
                    callID[addr] = label;
                    label += 1;
                    rmc.push(`(!${callID[addr] as number + 50000})[${renderMML(sequences[addr])}]`);
                }
                if (e[4] === 0) {
                    add(`(!${callID[addr] as number + 50000}, ${readInt8(e, 3)})`);
                } else {
                    add(`(!${callID[addr] as number + 50000}, ${readInt8(e, 3)}, ${e[4]})`);
                }
                lineBreak();
                break;
            }
            default: {
                add(printBuffer(e));
                lineBreak();
                break;
            }
            }
            offset += e.length;
            if (channel >= 0
                && paraList.length > 1
                && paraList[1][channel] !== paraList[0][channel]
                && !loopPut
                && offset >= paraList[1][channel]) {
                if (offset !== paraList[1][channel]) {
                    throw new Error('Loop point malposition');
                }
                lineBreak();
                add('/');
                lineBreak();
                loopPut = true;
            }
        });
        if (current.length > 0) {
            content.push(current);
        }
        const finalPrint: string[] = [];
        content.forEach((e) => {
            finalPrint.push(e.join(' '));
        });
        return finalPrint.join('\n');
    }

    let mml = '';
    const midi = new jsmidgen.File();
    for (let i = 0; i < 8; i++) {
        if (paraList[0][i] !== 0) {
            mml += `#${i}\n`;
            mml += renderMML(sequences[paraList[0][i]], true, i);
            mml += '\n\n';

            /* const track = new jsmidgen.Track();
            renderMIDI({
                sequence: sequences[paraList[0][i]],
                handleSubroutine: true,
                channel: i,
                midiChannel: i as MidiChannel,
                track,
            });
            midi.addTrack(track); */
        }
    }
    mml = `${rmc.join('\n')}\n\n${mml}`;
    return {
        lastInstrument,
        mml,
        vTable,
        midi,
    };
}

export default render;
