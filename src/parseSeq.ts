const vcmdStart = 0xda;
const vcmdLength = [
                0x02, 0x02, 0x03, 0x04, 0x04, 0x01, // DA-DF
    0x02, 0x03, 0x02, 0x03, 0x02, 0x04, 0x02, 0x02, // E0-E7
    0x03, 0x04, 0x02, 0x04, 0x04, 0x03, 0x02, 0x04, // E8-EF
    0x01, 0x04, 0x04, 0x03, 0x02, 0x09, 0x03, 0x04, // F0-F7
    0x02, 0x03, 0x03, 0x03, 0x05, 0x00, 0x00, 0x00, // F8-FF
];

interface IParseResult {
    content: number[][];
    jumps: number[];
}

function parseSeq(aram: Buffer, beginPointer: number): IParseResult {
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
            // special: e9 [xx yy] zz
            if (now === 0xe9) {
                jumps.push(aram.readInt16LE(nowPointer + 1));
            }
            // special: fc [ww xx] yy zz
            if (now === 0xfc && aram[nowPointer + 3] === 0) {
                jumps.push(aram.readInt16LE(nowPointer + 1));
            }
            const len = vcmdLength[now - vcmdStart];
            const temp = Buffer.alloc(len);
            aram.copy(temp, 0, nowPointer, nowPointer + len);
            content.push([...temp]);
            nowPointer += len;
        } else {
            throw new Error(`Unexpected command 0x${now} at 0x${nowPointer}`);
        }
    }
    return { content, jumps };
}

export default parseSeq;
