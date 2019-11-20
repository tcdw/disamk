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

export default searchPattern;
