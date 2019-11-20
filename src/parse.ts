import { getLogger } from "log4js";
import parseSeq from "./parseSeq";
import searchPattern from "./searchPattern";
import SPCFile from "./SPCFile";

const songAmount = 10;

function parse(spc: Buffer, song: number = 10) {
    const logger = getLogger("parser");
    logger.level = process.env.NODE_ENV === "development" ? "debug" : "info";

    // 输入参数检查
    if (song < 1 || song > 10) {
        logger.fatal("Bad song ID! It must between 1-10!");
        return;
    }

    const spcFile: SPCFile = new SPCFile(spc);
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
    const patPointer = searchPattern(spcFile.aram, [0x1c, 0xfd, 0xf6], [
        2,
        [0x2d, 0xc4, 0x40, 0xf6],
        2,
        [0x2d, 0xc4, 0x41],
    ]);
    if (patPointer === null) {
        throw new Error(`Unable to find song pointers`);
    }
    const pointerA = spcFile.aram.readInt16LE(patPointer + 3) + 2;
    const pointerB = spcFile.aram.readInt16LE(patPointer + 9) + 1;
    if (pointerA !== pointerB) {
        throw new Error(`Bad song pointers`);
    }
    const songPointers = pointerA;
    logger.info(`Song pointers: 0x${songPointers.toString(16)}`);
    // for (let i = 0; i < songAmount; i++) {
    //     logger.info(`Song ${i + 1}: 0x${spcFile.aram.readInt16LE(songPointers + (i * 2)).toString(16)}`);
    // }

    // 对一个 song 的解析
    const songEntry = spcFile.aram.readInt16LE(songPointers + ((song - 1) * 2));
    logger.info(`Using song ${song} at 0x${songEntry.toString(16)}`);
    const paras: number[] = [];
    let loop = 0;
    let paraOffset = 0;
    while (true) {
        const now = spcFile.aram.readInt16LE(songEntry + paraOffset);
        if (now === 0) {
            logger.debug("Para list ends!");
            break;
        } else if (now > 0 && now <= 0x7f) {
            throw new Error("Unexcepted situation: Block command between 0x01-0x7F");
        } else if (now > 0x7f && now <= 0xff) {
            loop = (spcFile.aram.readInt16LE(songEntry + paraOffset + 2) - songEntry) / 2;
            logger.debug(`Para loop found, starting from ${loop}`);
            break;
        } else {
            logger.debug(`Para: 0x${now.toString(16)}`);
            paras.push(now);
            paraOffset += 2;
        }
    }

    // 对 paras 的解析
    const paraList: number[][] = [];
    paras.forEach((e) => {
        const para: number[] = [];
        for (let i = 0; i < 8; i++) {
            para.push(spcFile.aram.readInt16LE(e + i * 2));
        }
        paraList.push(para);
    });
}

export default parse;
