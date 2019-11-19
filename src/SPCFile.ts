class SPCFile {
    static offset = 0x100;
    raw: Buffer;
    mainHeader: Buffer;
    extraHeader: Buffer;
    aram: Buffer;
    dsp: Buffer;
    constructor(buffer: Buffer) {
        this.raw = buffer;
        this.mainHeader = Buffer.alloc(0x100);
        this.extraHeader = Buffer.alloc(buffer.length - 0x10200);
        this.aram = Buffer.alloc(0x10000);
        this.dsp = Buffer.alloc(0x80);
        buffer.copy(this.mainHeader, 0, 0, 0x100);
        buffer.copy(this.extraHeader, 0, 0x10200, buffer.length - 0x10200);
        buffer.copy(this.aram, 0, 0x100, 0x10100);
        buffer.copy(this.dsp, 0, 0x10100, 0x10180);
    }
    getBRR(id: number): Buffer {
        const sampleIndexPtr = this.raw[0x1015D] * 0x100 + SPCFile.offset;
        const samplePtr = this.raw.readUInt16LE(sampleIndexPtr + id * 4);
        const sampleLoop = this.raw.readUInt16LE(sampleIndexPtr + id * 4 + 2) - samplePtr;
        let sampleCurrentPtr = samplePtr + SPCFile.offset;
        while (true) {
            sampleCurrentPtr += 9;
            if (this.raw[sampleCurrentPtr - 9] % 2 === 1) {
                break;
            }
            if (sampleCurrentPtr > (0xFFFF + SPCFile.offset)) {
                throw new Error('该 Sample 在 ARAM 结尾依然没有结束');
            }
        }
        const sampleLength = sampleCurrentPtr - (samplePtr + SPCFile.offset);
        const brr = Buffer.alloc(sampleLength + 2);
        brr.writeUInt16LE(sampleLoop, 0);
        this.raw.copy(brr, 2, samplePtr + SPCFile.offset, sampleCurrentPtr);
        return brr;
    }
}

export default SPCFile;
