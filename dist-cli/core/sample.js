"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var printBuffer_1 = __importDefault(require("./printBuffer"));
var printByte_1 = __importDefault(require("./printByte"));
var utf8_to_str_1 = require("./utf8-to-str");
var utils_1 = require("./utils");
var smwRemap = [0, 1, 2, 3, 4, 8, 22, 5, 6, 7, 9, 10, 13, 14, 29, 21, 12, 17, 15];
function handleSample(spcFile, instPointer, lastInstrument, smwAlias) {
    var sampleRead = spcFile.dsp[0x5D] * 0x100;
    var sampleAmount = 0;
    var firstSample;
    var header = '';
    function add(e) {
        header += "".concat(e, "\n");
    }
    while (true) {
        var current = (0, utils_1.readUInt16LE)(spcFile.aram, sampleRead);
        if (typeof firstSample !== 'undefined' && sampleRead >= firstSample) {
            break;
        }
        if (typeof firstSample === 'undefined') {
            firstSample = current;
        }
        sampleRead += 4;
        sampleAmount += 1;
    }
    // sample naming
    var samples = [];
    add('#samples');
    add('{');
    for (var i = 0; i < sampleAmount; i++) {
        var data = spcFile.getBRR(i);
        var name_1 = "samp_".concat(i, ".brr");
        samples.push({
            name: name_1,
            data: data,
        });
        add("\t\"".concat(name_1, "\""));
    }
    add('}');
    if (lastInstrument >= 0x1E) {
        var last = lastInstrument - 0x1E;
        var instList = [];
        for (var i = 0; i <= last; i++) {
            var temp = spcFile.aram.slice(instPointer + (i * 6), instPointer + ((i + 1) * 6));
            var instHeader = void 0;
            if (temp[0] <= 0x12 && smwAlias) {
                instHeader = "@".concat(smwRemap[temp[0]]);
            }
            else if (temp[0] >= 0x80 && temp[0] < 0xa0) {
                instHeader = "n".concat((0, printByte_1.default)(temp[0] - 0x80));
            }
            else {
                instHeader = "\"".concat(samples[temp[0]].name, "\"");
            }
            instList.push("\t".concat(instHeader, " ").concat((0, printBuffer_1.default)(temp.slice(1))));
        }
        add('#instruments');
        add('{');
        add(instList.join('\n'));
        add('}');
    }
    var spcAuthor = (0, utf8_to_str_1.utf8ArrayToStr)(spcFile.mainHeader.slice(0xB1, 0xD1));
    var spcGame = (0, utf8_to_str_1.utf8ArrayToStr)(spcFile.mainHeader.slice(0x4E, 0x6E));
    var spcTitle = (0, utf8_to_str_1.utf8ArrayToStr)(spcFile.mainHeader.slice(0x2E, 0x4E));
    var spcComment = (0, utf8_to_str_1.utf8ArrayToStr)(spcFile.mainHeader.slice(0x7E, 0x9E));
    if (spcAuthor.indexOf('\0') >= 0) {
        spcAuthor = spcAuthor.slice(0, spcAuthor.indexOf('\0'));
    }
    if (spcGame.indexOf('\0') >= 0) {
        spcGame = spcGame.slice(0, spcGame.indexOf('\0'));
    }
    if (spcTitle.indexOf('\0') >= 0) {
        spcTitle = spcTitle.slice(0, spcTitle.indexOf('\0'));
    }
    if (spcComment.indexOf('\0') >= 0) {
        spcComment = spcComment.slice(0, spcComment.indexOf('\0'));
    }
    add("#spc\n{\n\t#author    \"".concat(spcAuthor, "\"\n\t#game      \"").concat(spcGame, "\"\n\t#comment   \"").concat(spcComment, "\"\n\t#title     \"").concat(spcTitle, "\"\n}"));
    return { header: header, samples: samples };
}
exports.default = handleSample;
