import type {ModelId} from 'token-vocabs'

import {countLoaded, load, modelIds, models, tokenizeLoaded} from 'token-vocabs'

import modelsMap from '#src/lib/models/index.ts'
import {getTokenSpans} from '#src/lib/tokenSpans.ts'

import {contentSourceProperties, contentSourceRequirement, resolveContentSource} from './contentSource.ts'
import {buildPermalink, defaultPermalinkState} from './permalink.ts'
import {assertObjectProperties, getExecutionSignal, getModelId, getModelIds, modelIdSchema, modelSelectionSchema} from './shared.ts'

const textEncoder = new TextEncoder

const modelProperties = {
  models: modelSelectionSchema,
} as const

const contentAndModelSchema = {
  type: 'object',
  properties: {
    ...contentSourceProperties,
    ...modelProperties,
  },
  ...contentSourceRequirement,
  additionalProperties: false,
} as const

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)

const runForModels = async <Value>(selectedModelIds: ReadonlyArray<ModelId>, signal: AbortSignal, operation: (modelId: ModelId) => Value): Promise<{errors: Record<string, string>, values: Partial<Record<ModelId, Value>>}> => {
  const entries = await Promise.all(selectedModelIds.map(async modelId => {
    signal.throwIfAborted()
    try {
      await load(modelId)
      signal.throwIfAborted()
      return [modelId, {value: operation(modelId)}] as const
    } catch (error) {
      return [modelId, {error: getErrorMessage(error)}] as const
    }
  }))
  const values: Partial<Record<ModelId, Value>> = {}
  const errors: Record<string, string> = {}
  for (const [modelId, result] of entries) {
    if ('error' in result) {
      errors[modelId] = result.error
    } else {
      values[modelId] = result.value
    }
  }
  return {values, errors}
}

const withErrors = <Value>(key: string, result: {errors: Record<string, string>, values: Partial<Record<ModelId, Value>>}) => ({
  [key]: result.values,
  ...(Object.keys(result.errors).length ? {errors: result.errors} : {}),
})

const getCompareCase = (text: string, count: number, index: number, source: unknown, baseline: number) => ({
  index,
  source,
  characters: text.length,
  bytes: textEncoder.encode(text).byteLength,
  tokens: count,
  deltaFromFirst: count - baseline,
  ratioToFirst: baseline === 0 ? null : Math.round(count / baseline * 10_000) / 10_000,
})

export const createHeadlessTools = (): Array<WebMCP.ModelContextTool> => [
  {
    name: 'list_models',
    title: 'List models',
    description: 'List every tokenizer model available in Tok·Show, including its stable model ID, display names, tokenizer kind, OpenRouter identifier when available and source metadata.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: input => {
      assertObjectProperties(input, [])
      return {
        models: modelIds.map(modelId => {
          const model = modelsMap.get(modelId)!
          const definition = models[modelId]
          return {
            id: modelId,
            name: model.name,
            subname: model.subname ?? null,
            ...definition,
          }
        }),
      }
    },
  },
  {
    name: 'count_tokens',
    title: 'Count tokens',
    description: 'Count tokens for supplied text with one model or several models without changing the Tok·Show UI. models accepts one model ID or an array and defaults to all models.',
    inputSchema: contentAndModelSchema,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: async (input, options) => {
      assertObjectProperties(input, ['text', 'url', 'models'])
      const signal = getExecutionSignal(options)
      const [content, selectedModelIds] = await Promise.all([
        resolveContentSource(input, signal),
        Promise.resolve(getModelIds(input.models)),
      ])
      const result = await runForModels(selectedModelIds, signal, modelId => countLoaded(content.text, modelId))
      return {
        source: content.source,
        ...withErrors('counts', result),
      }
    },
  },
  {
    name: 'tokenize',
    title: 'Tokenize',
    description: 'Return token ID arrays for supplied text with one model or several models without changing the Tok·Show UI. models accepts one model ID or an array and defaults to all models.',
    inputSchema: contentAndModelSchema,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: async (input, options) => {
      assertObjectProperties(input, ['text', 'url', 'models'])
      const signal = getExecutionSignal(options)
      const content = await resolveContentSource(input, signal)
      const selectedModelIds = getModelIds(input.models)
      const result = await runForModels(selectedModelIds, signal, modelId => [...tokenizeLoaded(content.text, modelId).tokens])
      return {
        source: content.source,
        ...withErrors('tokens', result),
      }
    },
  },
  {
    name: 'create_spans',
    title: 'Create spans',
    description: 'Return the byte start/end span corresponding to every token for supplied text with one model or several models, without changing the Tok·Show UI. Spans normally address the supplied input bytes. If a tokenizer normalizes its input first, spanInputs identifies the processed text whose bytes the spans address.',
    inputSchema: contentAndModelSchema,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: async (input, options) => {
      assertObjectProperties(input, ['text', 'url', 'models'])
      const signal = getExecutionSignal(options)
      const content = await resolveContentSource(input, signal)
      const selectedModelIds = getModelIds(input.models)
      const spanInputs: Partial<Record<ModelId, {type: 'original'} | {type: 'processed', text: string}>> = {}
      const result = await runForModels(selectedModelIds, signal, modelId => {
        const tokenization = tokenizeLoaded(content.text, modelId)
        spanInputs[modelId] = tokenization.processedInput === undefined
          ? {type: 'original'}
          : {type: 'processed', text: tokenization.processedInput}
        return getTokenSpans({
          offsets: tokenization.offsets,
          originalInput: content.text,
          processedInput: tokenization.processedInput,
          tokens: tokenization.tokens,
        }).map(span => ({
          start: span.byteStart,
          end: span.byteEnd,
        }))
      })
      return {
        source: content.source,
        ...withErrors('spans', result),
        spanInputs,
      }
    },
  },
  {
    name: 'compare',
    title: 'Compare cases',
    description: 'Compare token counts for multiple content cases using one model. Each case is either inline text or a URL whose UTF-8 response body is fetched.',
    inputSchema: {
      type: 'object',
      properties: {
        model: modelIdSchema,
        cases: {
          type: 'array',
          minItems: 2,
          maxItems: 64,
          items: {
            type: 'object',
            properties: contentSourceProperties,
            ...contentSourceRequirement,
            additionalProperties: false,
          },
        },
      },
      required: ['model', 'cases'],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: async (input, options) => {
      assertObjectProperties(input, ['model', 'cases'])
      const signal = getExecutionSignal(options)
      const modelId = getModelId(input.model)
      if (!Array.isArray(input.cases) || input.cases.length < 2 || input.cases.length > 64) {
        throw new TypeError('cases must be an array containing 2–64 content sources.')
      }
      const cases = await Promise.all(input.cases.map((value, index) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          throw new TypeError(`cases[${index}] must be a content source object.`)
        }
        assertObjectProperties(value, ['text', 'url'], `cases[${index}]`)
        return resolveContentSource(value, signal)
      }))
      signal.throwIfAborted()
      await load(modelId)
      signal.throwIfAborted()
      const counts = cases.map(content => countLoaded(content.text, modelId))
      const baseline = counts[0]!
      const comparedCases = cases.map((content, index) => getCompareCase(content.text, counts[index]!, index, content.source, baseline))
      const minimum = Math.min(...counts)
      const maximum = Math.max(...counts)
      return {
        model: modelId,
        title: models[modelId].title,
        cases: comparedCases,
        summary: {
          minimum: {
            tokens: minimum,
            cases: comparedCases.filter(item => item.tokens === minimum).map(item => item.index),
          },
          maximum: {
            tokens: maximum,
            cases: comparedCases.filter(item => item.tokens === maximum).map(item => item.index),
          },
          spread: maximum - minimum,
        },
      }
    },
  },
  {
    name: 'create_permalink',
    title: 'Create permalink',
    description: 'Build a Tok·Show permalink for a made-up UI state without changing the current page. Content may be inline text or fetched from a URL.',
    inputSchema: {
      type: 'object',
      properties: {
        ...contentSourceProperties,
        models: modelSelectionSchema,
        model: modelIdSchema,
        monaco: {
          type: 'boolean',
          description: 'Whether the permalink should use the Monaco editor. Defaults to true.',
          default: true,
        },
      },
      ...contentSourceRequirement,
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: async (input, options) => {
      assertObjectProperties(input, ['text', 'url', 'models', 'model', 'monaco'])
      const signal = getExecutionSignal(options)
      const content = await resolveContentSource(input, signal)
      const selectedModelIds = getModelIds(input.models, defaultPermalinkState.models)
      let focusedModel = input.model === undefined
        ? selectedModelIds.includes(defaultPermalinkState.model!) ? defaultPermalinkState.model! : selectedModelIds[0]!
        : getModelId(input.model)
      if (!selectedModelIds.includes(focusedModel)) {
        selectedModelIds.push(focusedModel)
      }
      if (input.monaco !== undefined && typeof input.monaco !== 'boolean') {
        throw new TypeError('monaco must be a boolean.')
      }
      return {
        source: content.source,
        url: buildPermalink({
          text: content.text,
          model: focusedModel,
          models: selectedModelIds,
          monaco: input.monaco ?? defaultPermalinkState.monaco,
        }),
      }
    },
  },
]
