import type {ModelId} from 'token-vocabs'

export type PermalinkState = {
  model: ModelId | null
  models: ReadonlyArray<ModelId>
  monaco: boolean
  text: string
}

export const defaultPermalinkState: PermalinkState = {
  model: 'gpt',
  models: ['gpt', 'deepseek'],
  monaco: true,
  text: '',
}

export const buildPermalink = (parameters: PermalinkState, base = globalThis.location?.href ?? 'https://tok.show/'): string => {
  const url = new URL(base)
  url.search = ''
  url.hash = ''
  url.searchParams.set('text', parameters.text)
  url.searchParams.set('model', parameters.model ?? '')
  url.searchParams.set('models', parameters.models.join(','))
  url.searchParams.set('monaco', String(parameters.monaco))
  return url.toString()
}
