/* eslint-disable no-bitwise */

import jsmidgen, { MidiChannel, MidiParameterValue } from 'jsmidgen';
import printBuffer from './printBuffer';
import printByte from './printByte';
import { printParsedBuffer, readInt8, readUInt16LE } from './utils';

const notes: string[] = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];

const transportSMWInstrument = [0, 0, 5, 0, 0, 0, 0, 0, 0, -5, 6, 0, -5, 0, 0, 8, 0, 0, 0];

// 改写自 https://github.com/loveemu/spc_converters_legacy/blob/master/nintspc/src/nintspc.c
function getNoteLenForMML(tick: number, options: {
    division?: number
    absLen?: boolean
} = {}) {
    const { absLen } = options;
    const division = options.division ?? 48;
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

function render(options: {
    sequences: Record<number, number[][]>
    paraList: number[][]
    otherPointers: number[]
    absLen: boolean
    removeLoop?: boolean
    velocityTable: Uint8Array[]
}) {
    const {
        sequences, paraList, otherPointers, absLen,
    } = options;

    // MML State
    let label = 1;
    let vTable = 1;
    let lastInstrument = 0;
    const callID: { [key: number]: number | null; } = {};
    const rmc: string[] = [];
    otherPointers.forEach((e) => {
        callID[e] = null;
    });

    function renderMML(subOptions: {
        sequence: number[][]
        handleSubroutine?: boolean
        channel?: number
        noteLength?: number
        prevQ?: number
    }) {
        const { sequence, handleSubroutine } = subOptions;
        const channel = subOptions.channel ?? -1;
        const content: string[][] = [];
        let current: string[] = [];
        let prevOctave = 0;
        let noteLength = subOptions.noteLength || 0;
        let prevQ = subOptions.prevQ || 0;
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
                add(`${notes[note % 12]}${getNoteLenForMML(noteLength, { absLen })}`);
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
                add(`^${getNoteLenForMML(noteLength, { absLen })}`);
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
                add(`r${getNoteLenForMML(noteLength, { absLen })}`);
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
                add(`@${h - 0xd0 + 21} c${getNoteLenForMML(noteLength, { absLen })}`);
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
                        loopCall = `[\n${renderMML({
                            sequence: sequences[addr],
                            noteLength,
                            prevQ
                        })}\n]`;
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
                    rmc.push(`(!${callID[addr] as number + 50000})[${renderMML({ sequence: sequences[addr] })}]`);
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

            if (!options.removeLoop) {
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

    function flattenSequenceData(subOptions: {
        sequence: number[][]
        handleSubroutine?: boolean
    }) {
        const { sequence, handleSubroutine } = subOptions;
        const rebuiltData: number[][] = [];
        let loopLeft = -1;
        let repeatPointStart = 0;
        let repeatPrepare = false;
        for (let i = 0; i < sequence.length; i++) {
            const e = sequence[i];
            const h = e[0];
            switch (true) {
            case h === 0xe6 && e[1] === 0x00: {
                // console.log('loop start');
                repeatPointStart = i;
                repeatPrepare = true;
                break;
            }
            case h === 0xe6: {
                // console.log(`loop end, ${loopLeft}`);
                // 准备状态时，设置剩余循环次数
                if (repeatPrepare) {
                    loopLeft = e[1];
                    repeatPrepare = false;
                }
                // console.log(loopLeft);
                // 有剩余循环次数，递减剩余次数，跳转指针
                if (loopLeft > 0) {
                    loopLeft -= 1;
                    i = repeatPointStart;
                }
                break;
            }
            case h === 0xe9: {
                if (handleSubroutine) {
                    const addr = readUInt16LE(e, 1);
                    const data = flattenSequenceData({
                        sequence: sequences[addr],
                    });
                    for (let j = 0; j < e[3]; j++) {
                        rebuiltData.push(...data);
                    }
                }
                break;
            }
            default: {
                rebuiltData.push(e);
                break;
            }
            }
        }
        let totalTicks = 0;
        let noteTicks = 0;
        rebuiltData.forEach((e) => {
            const h = e[0];
            switch (true) {
            case h >= 0x1 && h <= 0x7f: {
                noteTicks = h;
                break;
            }
            case h >= 0x80 && h <= 0xc5: {
                totalTicks += noteTicks;
                break;
            }
            case h === 0xc6: {
                totalTicks += noteTicks;
                break;
            }
            case h === 0xc7: {
                totalTicks += noteTicks;
                break;
            }
            default: {
                break;
            }
            }
        });
        if (handleSubroutine) {
            console.log(totalTicks);
        }
        return rebuiltData;
    }

    function renderMIDI(subOptions: {
        sequence: number[][]
        channel: MidiChannel
        track: jsmidgen.Track
    }) {
        const tickScale = 10;
        const { sequence, channel, track } = subOptions;
        // 上一次使用的音符
        let lastNote = -1;
        // 当前音符长度
        let currentNoteLength = 0;
        // 待添加到下一次事件的长度
        let holdLength = 0;
        // 当前是否有音符在播放
        let isNoteOn = false;
        // 当前音色
        let currentInstrument = 0;
        // 当前音符属性
        let currentNoteParam = 0x7f;
        // 当前音符音量换算表
        let currentVelocityIndex = 0;
        // 当前音符音量
        let currentVelocity = 127;

        sequence.forEach((e, i) => {
            const h = e[0];
            const next = sequence[i + 1] || {};

            switch (true) {
            case h >= 0x1 && h <= 0x7f: {
                // note param
                currentNoteLength = e[0] * tickScale;
                if (e.length > 1) {
                    currentNoteParam = e[1];
                }
                break;
            }
            case h >= 0x80 && h <= 0xc5: {
                if (isNoteOn) {
                    track.addNoteOff(channel, lastNote, holdLength, currentVelocity);
                    isNoteOn = false;
                    holdLength = 0;
                }
                const note = h - 0x80;
                lastNote = note + 12 + (transportSMWInstrument[currentInstrument] ?? 0);
                currentVelocity = (options.velocityTable[currentVelocityIndex][currentNoteParam & 0xF] / 255) * 127;
                track.addNoteOn(channel, lastNote, holdLength, currentVelocity);
                isNoteOn = true;
                holdLength = currentNoteLength;
                break;
            }
            case h === 0xc6: {
                // tie
                holdLength += currentNoteLength;
                break;
            }
            case h === 0xc7: {
                // rest
                if (isNoteOn) {
                    track.addNoteOff(channel, lastNote, holdLength, currentVelocity);
                    isNoteOn = false;
                    lastNote = -1;
                    holdLength = currentNoteLength;
                } else {
                    holdLength += currentNoteLength;
                }
                break;
            }
            case h >= 0xd0 && h <= 0xd9: {
                if (isNoteOn) {
                    track.addNoteOff(channel, lastNote, holdLength, currentVelocity);
                    isNoteOn = false;
                    holdLength = 0;
                }
                track.setInstrument(channel, (h - 0xd0 + 21) as MidiParameterValue, holdLength);
                currentInstrument = h - 0xd0 + 21;
                lastNote = 60;
                currentVelocity = (options.velocityTable[currentVelocityIndex][currentNoteParam & 0xF] / 255) * 127;
                track.addNoteOn(channel, lastNote, 0, currentVelocity);
                isNoteOn = true;
                holdLength = currentNoteLength;
                break;
            }
            case h === 0xda: {
                // instrument
                track.setInstrument(channel, e[1] as MidiParameterValue, holdLength);
                currentInstrument = e[1];
                holdLength = 0;
                break;
            }
            case h === 0xdb: {
                // todo pan
                break;
            }
            case h === 0xe0: {
                // todo global volume
                break;
            }
            case h === 0xe2: {
                // todo tempo
                track.tempo(e[1] / 0.4096, holdLength);
                holdLength = 0;
                break;
            }
            case h === 0xe7: {
                // todo volume
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

        // cleanup
        if (isNoteOn) {
            track.addNoteOff(channel, lastNote, holdLength, currentVelocity);
            isNoteOn = false;
        }
    }

    let mml = '';
    const midi = new jsmidgen.File();
    for (let i = 0; i < 8; i++) {
        if (paraList[0][i] !== 0) {
            mml += `#${i}\n`;
            if (options.removeLoop) {
                mml += renderMML({
                    sequence: flattenSequenceData({
                        sequence: sequences[paraList[0][i]],
                        handleSubroutine: true,
                    }),
                    channel: i,
                    handleSubroutine: true,
                });
            } else {
                mml += renderMML({
                    sequence: sequences[paraList[0][i]],
                    channel: i,
                    handleSubroutine: true,
                });
            }
            mml += '\n\n';
            const track = new jsmidgen.Track();
            if (i === 0) {
                // add GM header
                track.addEvent({
                    toBytes(): number[] {
                        return [0x00, 0xF0, 0x05, 0x7E, 0x7F, 0x09, 0x01, 0xF7];
                    },
                } as any);
            }
            renderMIDI({
                sequence: flattenSequenceData({
                    sequence: sequences[paraList[0][i]],
                    handleSubroutine: true,
                }),
                channel: i as MidiChannel,
                track,
            });
            midi.addTrack(track);
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
