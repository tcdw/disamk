import { Buffer as BBuffer } from "buffer/";
import { ParseMode } from "./parse";

interface IParseResult {
    content: number[][];
    jumps: number[];
}

function parseSeq(mode: ParseMode, aram: BBuffer, beginPointer: number): IParseResult {
    const vcmdStart = 0xda;
    const vcmdLength = [
                    0x02, 0x02, 0x03, 0x04, 0x04, 0x01, // DA-DF
        0x02, 0x03, 0x02, 0x03, 0x02, 0x04, 0x02, 0x02, // E0-E7
        0x03, 0x04, 0x02, 0x04, 0x04, 0x03, 0x02, 0x04, // E8-EF
        0x01, 0x04, 0x04, 0x03, 0x02, 0x09, 0x03, 0x04, // F0-F7
        0x02, 0x03, 0x03, 0x03, 0x05, 0x00, 0x00, 0x00, // F8-FF
    ];
    const content: number[][] = [];
    const jumps: number[] = [];
    let nowPointer = beginPointer;
    while (true) {
        const now = aram[nowPointer];
        // note length
        if (now === 0x0) {
            break;
        } else if (now >= 0x1 && now <= 0x7f) {
            const temp: number[] = [];
            temp.push(now);
            // duration rate & velocity rate
            if (aram[nowPointer + 1] >= 0x1 && aram[nowPointer + 1] <= 0x7f) {
                temp.push(aram[nowPointer + 1]);
                nowPointer++;
            }
            content.push(temp);
            nowPointer++;
        // note
        } else if (now >= 0x80 && now <= 0xc7) {
            content.push([now]);
            nowPointer++;
        // percussion
        } else if (now >= 0xd0 && now <= 0xd9) {
            content.push([now]);
            nowPointer++;
        // vcmd
        } else if (now >= vcmdStart && now <= 0xff) {
            const len = vcmdLength[now - vcmdStart];

            // Addmusic 4.05 uses $E5 $80+ for custom sample calling
            if (mode === ParseMode.AM4 && now === 0xE5 && aram[nowPointer + 1] >= 0x80) {
                content.push([0xF3, aram[nowPointer + 1] - 0x80, aram[nowPointer + 2]]);
                nowPointer += 3;
                continue;
            }

            // special: e9 [xx yy] zz
            if (now === 0xe9) {
                jumps.push(aram.readUInt16LE(nowPointer + 1));
            }

            // special: fc [ww xx] yy zz
            if (now === 0xfc) {
                jumps.push(aram.readUInt16LE(nowPointer + 1));
            }

            const temp = BBuffer.alloc(len);
            aram.copy(temp, 0, nowPointer, nowPointer + len);
            content.push([...temp]);
            nowPointer += len;
        } else {
            throw new Error(`Unexpected command 0x${now} at 0x${nowPointer}`);
        }
        // console.log(nowPointer.toString(16) + ": " + content[content.length - 1]);
    }
    return { content, jumps };
}

export default parseSeq;
