export function readUInt16LE(src: Uint8Array | number[], pos: number) {
  return src[pos] + (src[pos + 1] << 8)
}

export function readInt8(src: Uint8Array | number[], pos: number) {
  const n = src[pos]
  if (n > 127) {
    return n - 256
  }
  return n
}

export function writeUInt16LE(src: Uint8Array | number[], pos: number, val: number) {
  src[pos] = val & 0xff
  src[pos + 1] = val >> 8
}

export function fineHex(num: number) {
  let str = num.toString(16).toUpperCase()
  if (str.length % 2 === 1) {
    str = '0' + str
  }
  return '$' + str
}

export function printByte(byte: number): string {
  if (byte < 0x10) {
    return `0${byte.toString(16).toUpperCase()}`
  }
  return `${byte.toString(16).toUpperCase()}`
}

export function printBuffer(content: number[] | Uint8Array): string {
  const prettyList: string[] = []
  content.forEach((e: number) => {
    prettyList.push(`$${printByte(e)}`)
  })
  return prettyList.join(' ')
}

// https://stackoverflow.com/questions/14147213/search-for-multi-byte-pattern-in-uint8array
function indexOfMulti(source: Uint8Array, searchElements: Uint8Array, fromIndex: number): number {
  fromIndex = fromIndex || 0

  const index = Array.prototype.indexOf.call(source, searchElements[0], fromIndex)
  if (searchElements.length === 1 || index === -1) {
    // Not found or no other elements to check
    return index
  }

  let i = 0
  let j = 0
  for (i = index, j = 0; j < searchElements.length && i < source.length; i++, j++) {
    if (source[i] !== searchElements[j]) {
      return indexOfMulti(source, searchElements, index + 1)
    }
  }

  return (i === index + searchElements.length) ? index : -1
}

type PatternData = [number[], ...(number | number[])[]]

/**
 * 从一个 Buffer 中搜索一段中间被挖空的片段
 */
export function searchPattern(
  buf: Uint8Array, data: PatternData, start = 0
): number | null {
  const first = data[0] as number[]
  const firstPos = indexOfMulti(buf, Uint8Array.from(first), start)
  let nowPos = firstPos + first.length
  if (firstPos < 0) {
    return null
  }
  // eslint-disable-next-line no-restricted-syntax
  for (let i = 1; i < data.length; i++) {
    const e = data[i]
    if (Array.isArray(e)) {
      const current = indexOfMulti(buf, Uint8Array.from(e), nowPos)
      if (current !== nowPos) {
        return searchPattern(buf, data, nowPos)
      }
      nowPos += e.length
    } else if (typeof e === 'number') {
      nowPos += e
    }
  }
  return firstPos
}
