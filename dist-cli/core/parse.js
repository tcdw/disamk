"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var parseSeq_1 = __importDefault(require("./parseSeq"));
var renderMML_1 = __importDefault(require("./renderMML"));
var sample_1 = __importDefault(require("./sample"));
var SPCFile_1 = __importDefault(require("./SPCFile"));
var utils_1 = require("./utils");
function parse(input, options) {
    var absLen = options.absLen;
    var smwAlias = options.smwAlias;
    var spc = new Uint8Array(input);
    var spcFile = new SPCFile_1.default(spc);
    var song = spcFile.aram[0xF6];
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
    var patPointer = (0, utils_1.searchPattern)(spcFile.aram, [
        [0xf6],
        2,
        [0x2d, 0xc4, 0x40, 0xf6],
        2,
        [0x2d, 0xc4, 0x41],
    ]);
    if (patPointer === null) {
        throw new Error('Unable to find song pointers');
    }
    var pointerA = (0, utils_1.readUInt16LE)(spcFile.aram, patPointer + 1) + 2;
    var pointerB = (0, utils_1.readUInt16LE)(spcFile.aram, patPointer + 7) + 1;
    if (pointerA !== pointerB) {
        throw new Error('Bad song pointers');
    }
    var songPointers = pointerA;
    // 对一个 song 的解析
    var songEntry = (0, utils_1.readUInt16LE)(spcFile.aram, songPointers + ((song - 1) * 2));
    // logger.info(`Using song ${song} at 0x${songEntry.toString(16)}`);
    var paras = [];
    var loop = 0;
    var paraOffset = 0;
    var paraLen = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        var now = (0, utils_1.readUInt16LE)(spcFile.aram, songEntry + paraOffset);
        paraLen += 2;
        if (now === 0) {
            // logger.debug("Para list ends!");
            break;
        }
        else if (now > 0 && now <= 0x7f) {
            throw new Error("Unexcepted situation: Block command between 0x01-0x7F (".concat(now.toString(16), " at 0x").concat((songEntry + paraOffset).toString(16), ")"));
        }
        else if (now > 0x7f && now <= 0xff) {
            loop = ((0, utils_1.readUInt16LE)(spcFile.aram, songEntry + paraOffset + 2) - songEntry) / 2;
            // logger.debug(`Para loop found, starting from ${loop}`);
            paraLen += 2;
            break;
        }
        else {
            // logger.debug(`Para: 0x${now.toString(16)}`);
            paras.push(now);
            paraOffset += 2;
        }
    }
    // 对 paras 的解析
    var paraList = [];
    paras.forEach(function (e) {
        var para = [];
        for (var i = 0; i < 8; i++) {
            para.push((0, utils_1.readUInt16LE)(spcFile.aram, e + i * 2));
        }
        paraList.push(para);
    });
    // 对 sequence 的解析
    // 1st scan: main
    var sequences = {};
    var otherPointers = [];
    paraList.forEach(function (e) {
        e.forEach(function (f) {
            var result = (0, parseSeq_1.default)(spcFile.aram, f);
            sequences[f] = result.content;
            otherPointers.push.apply(otherPointers, __spreadArray([], __read(result.jumps), false));
        });
    });
    otherPointers = __spreadArray([], __read(new Set(otherPointers)), false);
    // 2nd scan: subroutine
    var rest = [];
    otherPointers.forEach(function (e) {
        var result = (0, parseSeq_1.default)(spcFile.aram, e);
        sequences[e] = result.content;
        rest.push.apply(rest, __spreadArray([], __read(result.jumps), false));
    });
    // 3rd scan: possibly rmc
    rest = __spreadArray([], __read(new Set(rest)), false);
    rest.forEach(function (e) {
        var result = (0, parseSeq_1.default)(spcFile.aram, e);
        sequences[e] = result.content;
    });
    otherPointers.push.apply(otherPointers, __spreadArray([], __read(rest), false));
    var _a = (0, renderMML_1.default)(sequences, paraList, otherPointers, absLen), lastInstrument = _a.lastInstrument, mml = _a.mml, vTable = _a.vTable;
    var _b = (0, sample_1.default)(spcFile, songEntry + paraLen, lastInstrument, smwAlias), header = _b.header, samples = _b.samples;
    var mmlFile = '';
    if (vTable === 0) {
        mmlFile += '#option smwvtable\n';
    }
    mmlFile += header;
    mmlFile += mml;
    return { mmlFile: mmlFile, samples: samples };
}
exports.default = parse;
