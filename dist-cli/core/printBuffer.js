"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var printByte_1 = __importDefault(require("./printByte"));
function printBuffer(content) {
    var prettyList = [];
    content.forEach(function (e) {
        prettyList.push("$".concat((0, printByte_1.default)(e)));
    });
    return prettyList.join(' ');
}
exports.default = printBuffer;
