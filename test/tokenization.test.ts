import {describe, expect, test} from 'bun:test'

import {getTextRangeFromByteRange} from '#src/lib/tokenization.ts'

describe('tokenization', () => {
  test('maps UTF-8 byte ranges to UTF-16 text ranges', () => {
    expect(getTextRangeFromByteRange('ÄÄ', {start: 0, end: 2})).toEqual({
      endColumn: 2,
      endLineNumber: 1,
      startColumn: 1,
      startLineNumber: 1,
    })
    expect(getTextRangeFromByteRange('ÄÄ', {start: 2, end: 4})).toEqual({
      endColumn: 3,
      endLineNumber: 1,
      startColumn: 2,
      startLineNumber: 1,
    })
  })

  test('expands partial multibyte byte ranges to whole UTF-16 characters', () => {
    expect(getTextRangeFromByteRange('🙂', {start: 1, end: 3})).toEqual({
      endColumn: 3,
      endLineNumber: 1,
      startColumn: 1,
      startLineNumber: 1,
    })
  })
})
