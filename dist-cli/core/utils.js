"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPattern = exports.printBuffer = exports.printByte = exports.fineHex = exports.writeUInt16LE = exports.readInt8 = exports.readUInt16LE = void 0;
function readUInt16LE(src, pos) {
    return src[pos] + (src[pos + 1] << 8);
}
exports.readUInt16LE = readUInt16LE;
function readInt8(src, pos) {
    var n = src[pos];
    if (n > 127) {
        return n - 256;
    }
    return n;
}
exports.readInt8 = readInt8;
function writeUInt16LE(src, pos, val) {
    src[pos] = val & 0xff;
    src[pos + 1] = val >> 8;
}
exports.writeUInt16LE = writeUInt16LE;
function fineHex(num) {
    var str = num.toString(16).toUpperCase();
    if (str.length % 2 === 1) {
        str = "0".concat(str);
    }
    return "$".concat(str);
}
exports.fineHex = fineHex;
function printByte(byte) {
    if (byte < 0x10) {
        return "0".concat(byte.toString(16).toUpperCase());
    }
    return "".concat(byte.toString(16).toUpperCase());
}
exports.printByte = printByte;
function printBuffer(content) {
    var prettyList = [];
    content.forEach(function (e) {
        prettyList.push("$".concat(printByte(e)));
    });
    return prettyList.join(' ');
}
exports.printBuffer = printBuffer;
// https://stackoverflow.com/questions/14147213/search-for-multi-byte-pattern-in-uint8array
function indexOfMulti(source, searchElements, fromIndex) {
    fromIndex = fromIndex || 0;
    var index = Array.prototype.indexOf.call(source, searchElements[0], fromIndex);
    if (searchElements.length === 1 || index === -1) {
        // Not found or no other elements to check
        return index;
    }
    var i = 0;
    var j = 0;
    for (i = index, j = 0; j < searchElements.length && i < source.length; i++, j++) {
        if (source[i] !== searchElements[j]) {
            return indexOfMulti(source, searchElements, index + 1);
        }
    }
    return (i === index + searchElements.length) ? index : -1;
}
/**
 * 从一个 Buffer 中搜索一段中间被挖空的片段
 */
function searchPattern(buf, data, start) {
    if (start === void 0) { start = 0; }
    var first = data[0];
    var firstPos = indexOfMulti(buf, Uint8Array.from(first), start);
    var nowPos = firstPos + first.length;
    if (firstPos < 0) {
        return null;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (var i = 1; i < data.length; i++) {
        var e = data[i];
        if (Array.isArray(e)) {
            var current = indexOfMulti(buf, Uint8Array.from(e), nowPos);
            if (current !== nowPos) {
                return searchPattern(buf, data, nowPos);
            }
            nowPos += e.length;
        }
        else if (typeof e === 'number') {
            nowPos += e;
        }
    }
    return firstPos;
}
exports.searchPattern = searchPattern;
