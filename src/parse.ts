import SPCFile from "./SPCFile";

function searchPattern(buf: Buffer, first: number[], then: Array<number | number[]>) {
    // const firstPos = buf.indexOf()
}

function parse(spc: Buffer) {
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
    searchPattern(spcFile.aram, [0x1c, 0xfd, 0xf6], [
        2,
        [0x2d, 0xc4, 0x40, 0xf6],
        2,
        [0x2d, 0xc4, 0x41],
    ]);
}

export default parse;
