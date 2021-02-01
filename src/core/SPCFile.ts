import { Buffer as BBuffer } from 'buffer/';

class SPCFile {
    public mainHeader: BBuffer;

    public extraHeader: BBuffer;

    public aram: BBuffer;

    public dsp: BBuffer;

    constructor(buffer: BBuffer) {
        this.mainHeader = BBuffer.alloc(0x100);
        this.extraHeader = BBuffer.alloc(buffer.length - 0x10200);
        this.aram = BBuffer.alloc(0x10000);
        this.dsp = BBuffer.alloc(0x80);
        buffer.copy(this.mainHeader, 0, 0, 0x100);
        buffer.copy(this.extraHeader, 0, 0x10200, buffer.length - 0x10200);
        buffer.copy(this.aram, 0, 0x100, 0x10100);
        buffer.copy(this.dsp, 0, 0x10100, 0x10180);
    }

    public getBRR(id: number): BBuffer {
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
                throw new Error(`Sample ${id.toString()}'s size exceeded (Probably a bad sample)`);
            }
        }
        const sampleLength = sampleCurrentPtr - samplePtr;
        const brr = BBuffer.alloc(sampleLength + 2);
        brr.writeUInt16LE(sampleLoop, 0);
        this.aram.copy(brr, 2, samplePtr, sampleCurrentPtr);
        return brr;
    }
}

export default SPCFile;
