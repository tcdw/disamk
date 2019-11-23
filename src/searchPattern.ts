/**
 * 从一个 Buffer 中搜索一段中间被挖空的片段
 */
function searchPattern(buf: Buffer, first: number[], then: Array<number | number[]>, start = 0): number | null {
    const firstPos = buf.indexOf(new Uint8Array(first), start);
    let nowPos = firstPos + first.length;
    if (firstPos < 0) {
        return null;
    }
    for (const e of then) {
        if (Array.isArray(e)) {
            const current = buf.indexOf(new Uint8Array(e), nowPos);
            if (current !== nowPos) {
                return searchPattern(buf, first, then, nowPos);
            }
            nowPos += e.length;
        } else if (typeof e === "number") {
            nowPos += e;
        }
    }
    return firstPos;
}

export default searchPattern;
