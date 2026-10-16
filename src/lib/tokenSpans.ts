import type {TokenizeInput} from 'token-vocabs'

import {bytesToHexPairs, decodeUtf8, encodeUtf8, isVisuallyRepresentable} from '#src/lib/tokenization.ts'

export type TokenSpan = {
  byteEnd: number
  byteStart: number
  hexDisplay: string | null
  id: number
  index: number
  isNonRepresentable: boolean
  text: string
}

type TokenizeDataLike = {
  offsets: ReadonlyArray<number>
  originalInput: TokenizeInput
  processedInput?: Uint8Array | string
  tokens: ReadonlyArray<number>
}

/**
 * Convert a tokenization result into byte-ranged token spans. Spans that do not decode to visible text carry a hex representation of their bytes.
 */
export function getTokenSpans(data: TokenizeDataLike): Array<TokenSpan> {
  const effectiveInput = data.processedInput ?? data.originalInput
  const bytes = typeof effectiveInput === 'string' ? encodeUtf8(effectiveInput) : effectiveInput
  let byteStart = 0
  return data.tokens.map((id, index) => {
    const byteEnd = data.offsets[index] ?? bytes.length
    const tokenBytes = bytes.slice(byteStart, byteEnd)
    const text = decodeUtf8(tokenBytes)
    const isNonRepresentable = !isVisuallyRepresentable(text)
    const span: TokenSpan = {
      byteEnd,
      byteStart,
      hexDisplay: isNonRepresentable ? bytesToHexPairs(tokenBytes).join(' ') : null,
      id,
      index,
      isNonRepresentable,
      text,
    }
    byteStart = byteEnd
    return span
  })
}
