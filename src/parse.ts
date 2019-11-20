import { getLogger } from "log4js";
import SPCFile from "./SPCFile";

function searchPattern(buf: Buffer, first: number[], then: Array<number | number[]>) {
    const firstPos = buf.indexOf(new Uint8Array(first), 0);
    let nowPos = firstPos + first.length;
    if (firstPos < 0) {
        return null;
    }
    for (const e of then) {
        if (Array.isArray(e)) {
            const current = buf.indexOf(new Uint8Array(e), nowPos);
            if (current !== nowPos) {
                return null;
            }
            nowPos += e.length;
        } else if (typeof e === "number") {
            nowPos += e;
        }
    }
    return firstPos;
}

function parse(spc: Buffer) {
    const logger = getLogger("parser");
    logger.level = process.env.NODE_ENV === "development" ? "debug" : "info";
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
    const patPointer = searchPattern(spcFile.aram, [0x1c, 0xfd, 0xf6], [
        2,
        [0x2d, 0xc4, 0x40, 0xf6],
        2,
        [0x2d, 0xc4, 0x41],
    ]);
    if (patPointer === null) {
        logger.fatal(`Unable to find song pointers!`);
        return;
    }
    const pointerA = spcFile.aram.readInt16LE(patPointer + 3) + 2;
    const pointerB = spcFile.aram.readInt16LE(patPointer + 9) + 1;
    if (pointerA !== pointerB) {
        logger.fatal(`Bad song pointers!`);
        return;
    }
    const songPointers = pointerA;
    logger.info(`Para address: 0x${songPointers.toString(16)}`);
    // const songPointers =
}

export default parse;
