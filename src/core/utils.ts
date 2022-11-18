/* eslint-disable no-bitwise */
export function readUInt16LE(src: Uint8Array | number[], pos: number) {
    return src[pos] + (src[pos + 1] << 8);
}

export function readInt8(src: Uint8Array | number[], pos: number) {
    const n = src[pos];
    if (n > 127) {
        return n - 256;
    }
    return n;
}

export function writeUInt16LE(src: Uint8Array | number[], pos: number, val: number) {
    src[pos] = val & 0xff;
    src[pos + 1] = val >> 8;
}

export function fineHex(num: number) {
    let str = num.toString(16).toUpperCase();
    if (str.length % 2 === 1) {
        str = `0${str}`;
    }
    return `$${str}`;
}

export function printByte(byte: number): string {
    if (byte < 0x10) {
        return `0${byte.toString(16).toUpperCase()}`;
    }
    return `${byte.toString(16).toUpperCase()}`;
}

export function printBuffer(content: number[] | Uint8Array): string {
    const prettyList: string[] = [];
    content.forEach((e: number) => {
        prettyList.push(`$${printByte(e)}`);
    });
    return prettyList.join(' ');
}
