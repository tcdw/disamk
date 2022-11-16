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
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
function parseSeq(aram, beginPointer) {
    var vcmdStart = 0xda;
    var vcmdLength = [
        0x02, 0x02, 0x03, 0x04, 0x04, 0x01,
        0x02, 0x03, 0x02, 0x03, 0x02, 0x04, 0x02, 0x02,
        0x03, 0x04, 0x02, 0x04, 0x04, 0x03, 0x02, 0x04,
        0x01, 0x04, 0x04, 0x03, 0x02, 0x09, 0x03, 0x04,
        0x02, 0x03, 0x03, 0x03, 0x05, 0x00, 0x00, 0x00, // F8-FF
    ];
    var content = [];
    var jumps = [];
    var nowPointer = beginPointer;
    var now = 0;
    do {
        now = aram[nowPointer];
        switch (true) {
            // track end
            case now === 0x0: {
                break;
            }
            // note duration/velocity
            case now >= 0x1 && now <= 0x7f: {
                var temp = [];
                temp.push(now);
                // duration rate & velocity rate
                if (aram[nowPointer + 1] >= 0x1 && aram[nowPointer + 1] <= 0x7f) {
                    temp.push(aram[nowPointer + 1]);
                    nowPointer += 1;
                }
                content.push(temp);
                nowPointer += 1;
                break;
            }
            // note
            case now >= 0x80 && now <= 0xc7: {
                content.push([now]);
                nowPointer += 1;
                break;
            }
            // percussion
            case now >= 0xd0 && now <= 0xd9: {
                content.push([now]);
                nowPointer += 1;
                break;
            }
            // commands
            case now >= vcmdStart && now <= 0xff: {
                var len = vcmdLength[now - vcmdStart];
                // special: e9 [xx yy] zz
                if (now === 0xe9) {
                    jumps.push((0, utils_1.readUInt16LE)(aram, nowPointer + 1));
                }
                // special: fc [ww xx] yy zz
                if (now === 0xfc) {
                    jumps.push((0, utils_1.readUInt16LE)(aram, nowPointer + 1));
                }
                // 把 nowPointer 到 nowPointer + len 的一段复制成新的数组
                var temp = aram.slice(nowPointer, nowPointer + len);
                // aram.copy(temp, 0, nowPointer, nowPointer + len);
                content.push(__spreadArray([], __read(temp), false));
                nowPointer += len;
                break;
            }
            // unknown
            default: {
                throw new Error("Unexpected command 0x".concat(now.toString(16), " at 0x").concat(nowPointer.toString(16)));
            }
        }
    } while (now !== 0);
    return { content: content, jumps: jumps };
}
exports.default = parseSeq;
