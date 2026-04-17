import { readUInt16LE, writeUInt16LE } from "./utils";

class SPCFile {
  public mainHeader: Uint8Array;

  public extraHeader: Uint8Array;

  public aram: Uint8Array;

  public dsp: Uint8Array;

  constructor(buffer: Uint8Array) {
    this.mainHeader = buffer.slice(0, 0x100);
    this.extraHeader = buffer.slice(0x10200);
    this.aram = buffer.slice(0x100, 0x10100);
    this.dsp = buffer.slice(0x10100, 0x10180);
  }

  public getBRR(id: number): Uint8Array {
    const sampleIndexPtr = this.dsp[0x5d] * 0x100;
    const samplePtr = readUInt16LE(this.aram, sampleIndexPtr + id * 4);
    const sampleLoop = readUInt16LE(this.aram, sampleIndexPtr + id * 4 + 2) - samplePtr;
    let sampleCurrentPtr = samplePtr;
    while (true) {
      sampleCurrentPtr += 9;
      if (sampleCurrentPtr !== samplePtr + 9 && this.aram[sampleCurrentPtr - 9] % 2 === 1) {
        break;
      }
      if (sampleCurrentPtr > 0xffff) {
        sampleCurrentPtr -= 9;
        // eslint-disable-next-line no-console
        console.warn(`Sample ${id.toString(16)}'s size exceeded (Probably a bad sample)`);
        break;
      }
    }
    const sampleLength = sampleCurrentPtr - samplePtr;
    const brr = new Uint8Array(sampleLength + 2);
    writeUInt16LE(brr, 0, sampleLoop);
    brr.set(this.aram.slice(samplePtr, sampleCurrentPtr), 2);
    return brr;
  }
}

export default SPCFile;
