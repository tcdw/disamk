"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function printByte(byte) {
    if (byte < 0x10) {
        return "0".concat(byte.toString(16).toUpperCase());
    }
    return "".concat(byte.toString(16).toUpperCase());
}
exports.default = printByte;
