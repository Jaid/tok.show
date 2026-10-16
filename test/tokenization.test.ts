import {describe, expect, test} from 'bun:test'

import {bytesToHexPairs, getTextRangeFromByteRange, isUtf8, isVisuallyRepresentable} from '#src/lib/tokenization.ts'
import {getTokenSpans} from '#src/lib/tokenSpans.ts'

describe('tokenization', () => {
  test.each([
    ['ÄÄ', 0, 2, 1, 2],
    ['ÄÄ', 2, 4, 2, 3],
    // Partial multibyte ranges expand to whole UTF-16 characters.
    ['🙂', 1, 3, 1, 3],
  ])('maps the byte range of %j from %d to %d onto columns %d–%d', (text, start, end, startColumn, endColumn) => {
    expect(getTextRangeFromByteRange(text, {
      start,
      end,
    })).toEqual({
      endColumn,
      endLineNumber: 1,
      startColumn,
      startLineNumber: 1,
    })
  })
  test('maps byte ranges across lines', () => {
    expect(getTextRangeFromByteRange('a\nbc', {
      start: 2,
      end: 4,
    })).toEqual({
      endColumn: 3,
      endLineNumber: 2,
      startColumn: 1,
      startLineNumber: 2,
    })
  })
  test('detects UTF-8 and visually representable text', () => {
    expect(isUtf8(new Uint8Array([0xC3, 0x84]))).toBe(true)
    expect(isUtf8(new Uint8Array([0xFF]))).toBe(false)
    expect(isVisuallyRepresentable('a')).toBe(true)
    expect(isVisuallyRepresentable('\n')).toBe(false)
    expect(isVisuallyRepresentable('')).toBe(false)
    expect(bytesToHexPairs(new Uint8Array([0, 10, 255]))).toEqual(['00', '0a', 'ff'])
  })
})
describe('token spans', () => {
  test('slices text input into byte-ranged spans', () => {
    const spans = getTokenSpans({
      offsets: [2, 3],
      originalInput: 'Ä\nX',
      tokens: [10, 20, 30],
    })
    expect(spans).toEqual([
      {
        byteStart: 0,
        byteEnd: 2,
        hexDisplay: null,
        id: 10,
        index: 0,
        isNonRepresentable: false,
        text: 'Ä',
      },
      {
        byteStart: 2,
        byteEnd: 3,
        hexDisplay: '0a',
        id: 20,
        index: 1,
        isNonRepresentable: true,
        text: '\n',
      },
      {
        byteStart: 3,
        byteEnd: 4,
        hexDisplay: null,
        id: 30,
        index: 2,
        isNonRepresentable: false,
        text: 'X',
      },
    ])
  })
  test('shows invalid UTF-8 bytes of binary input as hex', () => {
    const spans = getTokenSpans({
      offsets: [1],
      originalInput: new Uint8Array([0x41, 0xFF, 0xFE]),
      tokens: [1, 2],
    })
    expect(spans.map(span => span.hexDisplay)).toEqual([null, 'ff fe'])
  })
  test('prefers the processed input over the original input', () => {
    const spans = getTokenSpans({
      offsets: [5],
      originalInput: '  HELLO WORLD',
      processedInput: 'hello world',
      tokens: [1, 2],
    })
    expect(spans.map(span => span.text)).toEqual(['hello', ' world'])
  })
})
