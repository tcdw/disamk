import { readUInt16LE } from './utils';

interface IParseResult {
    content: number[][];
    jumps: number[];
}

function parseSeq(aram: Uint8Array, beginPointer: number): IParseResult {
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
    let now = 0;
    do {
        now = aram[nowPointer];

        switch (true) {
        // track end
        case now === 0x0: {
            break;
        }
        // note duration/velocity
        case now >= 0x1 && now <= 0x7f: {
            const temp: number[] = [];
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
            const len = vcmdLength[now - vcmdStart];

            // special: e9 [xx yy] zz
            if (now === 0xe9) {
                jumps.push(readUInt16LE(aram, nowPointer + 1));
            }

            // special: fc [ww xx] yy zz
            if (now === 0xfc) {
                jumps.push(readUInt16LE(aram, nowPointer + 1));
            }

            // 把 nowPointer 到 nowPointer + len 的一段复制成新的数组
            const temp = aram.slice(nowPointer, nowPointer + len);
            // aram.copy(temp, 0, nowPointer, nowPointer + len);
            content.push([...temp]);
            nowPointer += len;
            break;
        }
        // unknown
        default: {
            throw new Error(`Unexpected command 0x${now.toString(16)} at 0x${nowPointer.toString(16)}`);
        }
        }
    } while (now !== 0);

    return { content, jumps };
}

export default parseSeq;
