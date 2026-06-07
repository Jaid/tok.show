import type {TokenizeInput} from 'token-vocabs'

import {decodeUtf8, encodeUtf8, isVisuallyRepresentable} from '#src/lib/tokenization.ts'

export type TokenSpan = {
  byteEnd: number
  byteStart: number
  hexDisplay: string | null
  id: number
  index: number
  isNonRepresentable: boolean
  text: string
}

export type TokenizeDataLike = {
  offsets: readonly number[]
  originalInput?: TokenizeInput
  processedInput?: string | Uint8Array
  tokens: readonly number[]
}

/**
 * Convert a tokenization result into an array of token spans.
 * Uses deepseek's Unicode-aware representability check and GPT's
 * byte-offset-precise text extraction.
 */
export function getTokenSpans(data: TokenizeDataLike): TokenSpan[] {
  const effectiveInput = data.processedInput ?? data.originalInput

  if (effectiveInput === undefined) {
    // Fallback: tokens without offsets = just show IDs
    return data.tokens.map((id, index) => ({
      byteEnd: 0,
      byteStart: 0,
      hexDisplay: null,
      id,
      index,
      isNonRepresentable: false,
      text: String(id),
    }))
  }

  if (effectiveInput instanceof Uint8Array) {
    return getBinaryTokenSpans(effectiveInput, data)
  }

  return getTextTokenSpans(effectiveInput, data)
}

function getBinaryTokenSpans(bytes: Uint8Array, data: TokenizeDataLike): TokenSpan[] {
  const offsets = data.offsets
  const spans: TokenSpan[] = []

  let byteStart = 0
  for (let i = 0; i < data.tokens.length; i++) {
    const byteEnd = i < offsets.length ? offsets[i] : bytes.length
    const tokenBytes = bytes.slice(byteStart, byteEnd)

    // Try to decode as text
    let text = ''
    let hexDisplay: string | null = null
    let isNonRepresentable = false
    try {
      text = decodeUtf8(tokenBytes)
      if (!isVisuallyRepresentable(text)) {
        isNonRepresentable = true
        hexDisplay = bytesToHexPairs(tokenBytes).join(' ')
      }
    } catch {
      isNonRepresentable = true
      hexDisplay = bytesToHexPairs(tokenBytes).join(' ')
    }

    spans.push({byteEnd, byteStart, hexDisplay, id: data.tokens[i], index: i, isNonRepresentable, text})
    byteStart = byteEnd
  }
  return spans
}

function getTextTokenSpans(input: string, data: TokenizeDataLike): TokenSpan[] {
  const bytes = encodeUtf8(input)
  const offsets = data.offsets
  const spans: TokenSpan[] = []

  let byteStart = 0
  for (let i = 0; i < data.tokens.length; i++) {
    const byteEnd = i < offsets.length ? offsets[i] : bytes.length
    const tokenBytes = bytes.slice(byteStart, byteEnd)
    const text = decodeUtf8(tokenBytes)
    const nonRep = !isVisuallyRepresentable(text)

    spans.push({
      byteEnd,
      byteStart,
      hexDisplay: nonRep ? bytesToHexPairs(tokenBytes).join(' ') : null,
      id: data.tokens[i],
      index: i,
      isNonRepresentable: nonRep,
      text,
    })

    byteStart = byteEnd
  }
  return spans
}

export function bytesToHexPairs(bytes: Uint8Array): string[] {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0'))
}
