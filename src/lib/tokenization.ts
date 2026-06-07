import type {RawTokenizeResult, TokenizeInput} from 'token-vocabs'

export type ByteRange = {
  end: number
  start: number
}

export type DisplayToken = ByteRange & {
  bytes: Uint8Array
  id: number
  index: number
  key: string
  text: string
  visuallyRepresentable: boolean
}

const utf8Encoder = new TextEncoder()
const utf8Decoder = new TextDecoder('utf-8', {fatal: false})

export const encodeUtf8 = (text: string) => utf8Encoder.encode(text)

export const decodeUtf8 = (bytes: Uint8Array) => utf8Decoder.decode(bytes)

const toInputBytes = (input: TokenizeInput) => typeof input === 'string' ? encodeUtf8(input) : input

const getTokenStartOffsets = (tokenizeResult: RawTokenizeResult) => [0, ...tokenizeResult.offsets]

export const getTokenRanges = (tokenizeResult: RawTokenizeResult, inputByteLength: number): Array<ByteRange> => {
  const starts = getTokenStartOffsets(tokenizeResult)
  return starts.map((start, index) => ({
    end: starts[index + 1] ?? inputByteLength,
    start
  }))
}

export const bytesToHexPairs = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0'))

export const bytesToHex = (bytes: Uint8Array) => bytesToHexPairs(bytes).join(' ')

const controlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uFFFD]/u
const visibleContentPattern = /[\p{Letter}\p{Number}\p{Punctuation}\p{Symbol}\p{Separator}\p{Mark}]/u

export const isVisuallyRepresentable = (text: string) => {
  if (text.length === 0) {
    return false
  }
  if (controlCharacterPattern.test(text)) {
    return false
  }
  return visibleContentPattern.test(text)
}

export const buildDisplayTokens = (input: TokenizeInput, tokenizeResult: RawTokenizeResult): Array<DisplayToken> => {
  const effectiveInput = tokenizeResult.processedInput ?? input
  const bytes = toInputBytes(effectiveInput)
  const ranges = getTokenRanges(tokenizeResult, bytes.byteLength)
  return ranges.map((range, index) => {
    const tokenBytes = bytes.slice(range.start, range.end)
    const text = decodeUtf8(tokenBytes)
    return {
      ...range,
      bytes: tokenBytes,
      id: tokenizeResult.tokens[index] ?? -1,
      index,
      key: `${index}:${range.start}:${range.end}:${tokenizeResult.tokens[index] ?? -1}`,
      text,
      visuallyRepresentable: isVisuallyRepresentable(text)
    }
  })
}

const getByteOffsetToStringIndex = (text: string) => {
  const map = new Map<number, number>
  let byteOffset = 0
  let stringIndex = 0
  map.set(0, 0)
  for (const character of text) {
    byteOffset += encodeUtf8(character).byteLength
    stringIndex += character.length
    map.set(byteOffset, stringIndex)
  }
  return (offset: number) => map.get(offset) ?? text.length
}

const getLineColumnFromIndex = (text: string, index: number) => {
  const segment = text.slice(0, index)
  const lines = segment.split('\n')
  return {
    column: (lines.at(-1)?.length ?? 0) + 1,
    lineNumber: lines.length
  }
}

export const getTextRangeFromByteRange = (text: string, range: ByteRange) => {
  const toStringIndex = getByteOffsetToStringIndex(text)
  const start = getLineColumnFromIndex(text, toStringIndex(range.start))
  const end = getLineColumnFromIndex(text, toStringIndex(range.end))
  return {
    endColumn: end.column,
    endLineNumber: end.lineNumber,
    startColumn: start.column,
    startLineNumber: start.lineNumber
  }
}

export const formatTokenCount = (value: number | undefined) => value === undefined ? '…' : value.toLocaleString('en-US')
