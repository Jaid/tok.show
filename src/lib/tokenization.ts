export type ByteRange = {
  end: number
  start: number
}

const utf8Encoder = new TextEncoder
const utf8Decoder = new TextDecoder('utf-8', {fatal: false})
const strictUtf8Decoder = new TextDecoder('utf-8', {fatal: true})

export const encodeUtf8 = (text: string) => utf8Encoder.encode(text)

export const decodeUtf8 = (bytes: Uint8Array) => utf8Decoder.decode(bytes)

export const isUtf8 = (bytes: Uint8Array) => {
  try {
    strictUtf8Decoder.decode(bytes)
    return true
  } catch {
    return false
  }
}

export const bytesToHexPairs = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0'))

const controlCharacterPattern = /[\u{0}-\u{8}\v\f\u{E}-\u{1F}\u{7F}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2060}-\u{206F}\u{FEFF}\u{FFFD}]/u
const visibleContentPattern = /[\p{Letter}\p{Mark}\p{Number}\p{Punctuation}\p{Separator}\p{Symbol}]/u

export const isVisuallyRepresentable = (text: string) => {
  if (text.length === 0) {
    return false
  }
  if (controlCharacterPattern.test(text)) {
    return false
  }
  return visibleContentPattern.test(text)
}

const getStringIndexFromByteOffset = (text: string, offset: number, bias: 'end' | 'start') => {
  if (offset <= 0) {
    return 0
  }
  let byteOffset = 0
  let stringIndex = 0
  for (const character of text) {
    const nextByteOffset = byteOffset + encodeUtf8(character).byteLength
    const nextStringIndex = stringIndex + character.length
    if (byteOffset <= offset && offset <= nextByteOffset) {
      if (offset === byteOffset) {
        return stringIndex
      }
      if (offset === nextByteOffset || bias === 'end') {
        return nextStringIndex
      }
      return stringIndex
    }
    byteOffset = nextByteOffset
    stringIndex = nextStringIndex
  }
  return text.length
}
const getLineColumnFromIndex = (text: string, index: number) => {
  const segment = text.slice(0, index)
  const lines = segment.split('\n')
  return {
    column: (lines.at(-1)?.length ?? 0) + 1,
    lineNumber: lines.length,
  }
}

export const getTextRangeFromByteRange = (text: string, range: ByteRange) => {
  const start = getLineColumnFromIndex(text, getStringIndexFromByteOffset(text, range.start, 'start'))
  const end = getLineColumnFromIndex(text, getStringIndexFromByteOffset(text, range.end, 'end'))
  return {
    endColumn: end.column,
    endLineNumber: end.lineNumber,
    startColumn: start.column,
    startLineNumber: start.lineNumber,
  }
}
