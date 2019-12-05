class SPCFile {
    public mainHeader: Buffer;
    public extraHeader: Buffer;
    public aram: Buffer;
    public dsp: Buffer;
    constructor(buffer: Buffer) {
        this.mainHeader = Buffer.alloc(0x100);
        this.extraHeader = Buffer.alloc(buffer.length - 0x10200);
        this.aram = Buffer.alloc(0x10000);
        this.dsp = Buffer.alloc(0x80);
        buffer.copy(this.mainHeader, 0, 0, 0x100);
        buffer.copy(this.extraHeader, 0, 0x10200, buffer.length - 0x10200);
        buffer.copy(this.aram, 0, 0x100, 0x10100);
        buffer.copy(this.dsp, 0, 0x10100, 0x10180);
    }
    public getBRR(id: number): Buffer {
        const sampleIndexPtr = this.dsp[0x5D] * 0x100;
        const samplePtr = this.aram.readUInt16LE(sampleIndexPtr + id * 4);
        const sampleLoop = this.aram.readUInt16LE(sampleIndexPtr + id * 4 + 2) - samplePtr;
        let sampleCurrentPtr = samplePtr;
        while (true) {
            sampleCurrentPtr += 9;
            if ((sampleCurrentPtr !== samplePtr + 9) && this.aram[sampleCurrentPtr - 9] % 2 === 1) {
                break;
            }
            if (sampleCurrentPtr > 0xFFFF) {
                throw new Error("Sample " + id.toString() + "'s size exceeded (Probably a bad sample)");
            }
        }
        const sampleLength = sampleCurrentPtr - samplePtr;
        const brr = Buffer.alloc(sampleLength + 2);
        brr.writeUInt16LE(sampleLoop, 0);
        this.aram.copy(brr, 2, samplePtr, sampleCurrentPtr);
        return brr;
    }
}

export default SPCFile;
