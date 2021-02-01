function printByte(byte: number): string {
    if (byte < 0x10) {
        return `0${byte.toString(16).toUpperCase()}`;
    }
    return `${byte.toString(16).toUpperCase()}`;
}

export default printByte;
