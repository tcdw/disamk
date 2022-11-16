"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var SPCFile = /** @class */ (function () {
    function SPCFile(buffer) {
        this.mainHeader = buffer.slice(0, 0x100);
        this.extraHeader = buffer.slice(0x10200);
        this.aram = buffer.slice(0x100, 0x10100);
        this.dsp = buffer.slice(0x10100, 0x10180);
    }
    SPCFile.prototype.getBRR = function (id) {
        var sampleIndexPtr = this.dsp[0x5D] * 0x100;
        var samplePtr = (0, utils_1.readUInt16LE)(this.aram, sampleIndexPtr + id * 4);
        var sampleLoop = (0, utils_1.readUInt16LE)(this.aram, sampleIndexPtr + id * 4 + 2) - samplePtr;
        var sampleCurrentPtr = samplePtr;
        while (true) {
            sampleCurrentPtr += 9;
            if ((sampleCurrentPtr !== samplePtr + 9) && this.aram[sampleCurrentPtr - 9] % 2 === 1) {
                break;
            }
            if (sampleCurrentPtr > 0xFFFF) {
                throw new Error("Sample ".concat(id.toString(), "'s size exceeded (Probably a bad sample)"));
            }
        }
        var sampleLength = sampleCurrentPtr - samplePtr;
        var brr = new Uint8Array(sampleLength + 2);
        (0, utils_1.writeUInt16LE)(brr, 0, sampleLoop);
        brr.set(this.aram.slice(samplePtr, sampleCurrentPtr), 2);
        return brr;
    };
    return SPCFile;
}());
exports.default = SPCFile;
