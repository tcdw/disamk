"use strict";
/* eslint-disable no-bitwise */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var printBuffer_1 = __importDefault(require("./printBuffer"));
var printByte_1 = __importDefault(require("./printByte"));
var utils_1 = require("./utils");
var notes = ['c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+', 'a', 'a+', 'b'];
function render(sequences, paraList, otherPointers, absLen) {
    // 改写自 https://github.com/loveemu/spc_converters_legacy/blob/master/nintspc/src/nintspc.c
    function getNoteLenForMML(tick, division) {
        if (division === void 0) { division = 48; }
        if (absLen) {
            return "=".concat(tick);
        }
        var dotMax = 6;
        var note = division * 4;
        var l;
        var dot;
        var text = '';
        for (l = 1; l <= note; l += 1) {
            var cTick = 0;
            for (dot = 0; dot <= dotMax; dot += 1) {
                var ld = (l << dot);
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
        return "=".concat(tick);
    }
    var label = 1;
    var vTable = 1;
    var lastInstrument = 0;
    var callID = {};
    var rmc = [];
    otherPointers.forEach(function (e) {
        callID[e] = null;
    });
    function renderMML(sequence, handleSubroutine, channel) {
        if (handleSubroutine === void 0) { handleSubroutine = false; }
        if (channel === void 0) { channel = -1; }
        var content = [];
        var current = [];
        var prevOctave = 0;
        var noteLength = 0;
        var prevQ = 0;
        var currentTotalTick = 0;
        var offset = paraList[0][channel] || 0;
        var loopPut = false;
        function add(e) {
            current.push(e);
        }
        function lineBreak() {
            if (current.length > 0) {
                content.push(current);
                current = [];
            }
        }
        sequence.forEach(function (e, i) {
            var h = e[0];
            var next = sequence[i + 1] || {};
            switch (true) {
                case h >= 0x1 && h <= 0x7f: {
                    noteLength = h;
                    if (e.length > 1) {
                        if (prevQ !== e[1]) {
                            prevQ = e[1];
                            add("q".concat((0, printByte_1.default)(e[1])));
                        }
                    }
                    break;
                }
                case h >= 0x80 && h <= 0xc5: {
                    var note = h - 0x80;
                    var octave = Math.floor((h - 0x80) / 12) + 1;
                    if (prevOctave < 1) {
                        add("o".concat(octave));
                    }
                    else if (octave > prevOctave) {
                        add('>'.repeat(octave - prevOctave));
                    }
                    else if (octave < prevOctave) {
                        add('<'.repeat(prevOctave - octave));
                    }
                    prevOctave = octave;
                    add("".concat(notes[note % 12]).concat(getNoteLenForMML(noteLength)));
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
                    add("^".concat(getNoteLenForMML(noteLength)));
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
                    add("r".concat(getNoteLenForMML(noteLength)));
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
                    add("@".concat(h - 0xd0 + 21, " c").concat(getNoteLenForMML(noteLength)));
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
                    add("@".concat(e[1]));
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
                        add("y".concat(e[1]));
                    }
                    else {
                        var echoL = (e[1] >> 7) % 2;
                        var echoR = (e[1] >> 6) % 2;
                        add("y".concat(e[1] % 0x40, ",").concat(echoL, ",").concat(echoR));
                    }
                    break;
                }
                case h === 0xe0: {
                    add("w".concat(e[1]));
                    break;
                }
                case h === 0xe2: {
                    add("t".concat(e[1]));
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
                    add("]]".concat(e[1] + 1));
                    lineBreak();
                    break;
                }
                case h === 0xe7: {
                    add("v".concat(e[1]));
                    break;
                }
                case h === 0xe9: {
                    // lineBreak();
                    // add(`; ${printBBuffer(e)}    ; subroutine called`);
                    // lineBreak();
                    if (handleSubroutine) {
                        var addr = (0, utils_1.readUInt16LE)(e, 1);
                        lineBreak();
                        var loopCall = '';
                        if (callID[addr] === null) {
                            callID[addr] = label;
                            label += 1;
                            loopCall = "[\n".concat(renderMML(sequences[addr]), "\n]");
                        }
                        loopCall = "(".concat(callID[addr], ")").concat(loopCall).concat(e[3]);
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
                    var addr = (0, utils_1.readUInt16LE)(e, 1);
                    if (callID[addr] === null) {
                        callID[addr] = label;
                        label += 1;
                        rmc.push("(!".concat(callID[addr] + 50000, ")[").concat(renderMML(sequences[addr]), "]"));
                    }
                    if (e[4] === 0) {
                        add("(!".concat(callID[addr] + 50000, ", ").concat((0, utils_1.readInt8)(e, 3), ")"));
                    }
                    else {
                        add("(!".concat(callID[addr] + 50000, ", ").concat((0, utils_1.readInt8)(e, 3), ", ").concat(e[4], ")"));
                    }
                    lineBreak();
                    break;
                }
                default: {
                    add((0, printBuffer_1.default)(e));
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
        var finalPrint = [];
        content.forEach(function (e) {
            finalPrint.push(e.join(' '));
        });
        return finalPrint.join('\n');
    }
    var mml = '';
    for (var i = 0; i < 8; i++) {
        if (paraList[0][i] !== 0) {
            mml += "#".concat(i, "\n");
            mml += renderMML(sequences[paraList[0][i]], true, i);
            mml += '\n\n';
        }
    }
    mml = "".concat(rmc.join('\n'), "\n\n").concat(mml);
    return {
        lastInstrument: lastInstrument,
        mml: mml,
        vTable: vTable,
    };
}
exports.default = render;
