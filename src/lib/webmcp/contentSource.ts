import {maxInputCharacters} from './shared.ts'

export type ResolvedContentSource = {
  source: {type: 'text'} | {type: 'url', url: string}
  text: string
}

export const contentSourceProperties = {
  text: {
    type: 'string',
    maxLength: maxInputCharacters,
    description: 'Text content to use directly.',
  },
  url: {
    type: 'string',
    description: 'HTTP(S) URL whose UTF-8 response body should be used as text content. Cross-origin URLs must permit browser fetches.',
  },
} as const

export const contentSourceRequirement = {
  oneOf: [
    {required: ['text'], not: {required: ['url']}},
    {required: ['url'], not: {required: ['text']}},
  ],
} as const

const validateText = (text: string): string => {
  if (text.length > maxInputCharacters) {
    throw new RangeError(`Content must contain at most ${maxInputCharacters.toLocaleString('en-US')} characters.`)
  }
  return text
}

const resolveUrl = (value: string): URL => {
  let url: URL
  try {
    url = new URL(value, globalThis.location?.href)
  } catch {
    throw new TypeError('url must be a valid HTTP(S) URL.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('url must use HTTP or HTTPS.')
  }
  return url
}

const readResponseText = async (response: Response, signal: AbortSignal): Promise<string> => {
  if (!response.body) {
    return validateText(await response.text())
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder
  let text = ''
  try {
    while (true) {
      signal.throwIfAborted()
      const {done, value} = await reader.read()
      if (done) {
        break
      }
      text += decoder.decode(value, {stream: true})
      validateText(text)
    }
    text += decoder.decode()
    return validateText(text)
  } finally {
    reader.releaseLock()
  }
}

export const resolveContentSource = async (input: Record<string, unknown>, signal: AbortSignal): Promise<ResolvedContentSource> => {
  const hasText = Object.hasOwn(input, 'text')
  const hasUrl = Object.hasOwn(input, 'url')
  if (hasText === hasUrl) {
    throw new TypeError('Exactly one of text or url must be provided.')
  }
  if (hasText) {
    if (typeof input.text !== 'string') {
      throw new TypeError('text must be a string.')
    }
    return {
      source: {type: 'text'},
      text: validateText(input.text),
    }
  }
  if (typeof input.url !== 'string') {
    throw new TypeError('url must be a string.')
  }
  const url = resolveUrl(input.url)
  signal.throwIfAborted()
  const response = await fetch(url, {signal})
  if (!response.ok) {
    throw new Error(`Could not fetch “${url}”: HTTP ${response.status} ${response.statusText}.`)
  }
  return {
    source: {
      type: 'url',
      url: response.url || url.toString(),
    },
    text: await readResponseText(response, signal),
  }
}
