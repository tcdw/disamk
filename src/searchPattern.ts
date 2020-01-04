import { Buffer as BBuffer } from "buffer/";

/**
 * 从一个 Buffer 中搜索一段中间被挖空的片段
 */
function searchPattern(buf: BBuffer, first: number[], then: Array<number | number[]>, start = 0): number | null {
    const firstPos = buf.indexOf(BBuffer.from(first), start);
    let nowPos = firstPos + first.length;
    if (firstPos < 0) {
        return null;
    }
    for (const e of then) {
        if (Array.isArray(e)) {
            const current = buf.indexOf(BBuffer.from(e), nowPos);
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
