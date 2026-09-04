import type {ModelId} from 'token-vocabs'

import {modelIds} from 'token-vocabs'

export const maxInputCharacters = 1_000_000
const modelIdSet = new Set<string>(modelIds)

export const modelIdSchema = {
  type: 'string',
  enum: [...modelIds],
} as const

export const assertObjectProperties = (value: unknown, allowedProperties: ReadonlyArray<string>, label = 'input'): asserts value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`)
  }
  for (const property of Object.keys(value)) {
    if (!allowedProperties.includes(property)) {
      throw new TypeError(`${label} must not contain unknown property “${property}”.`)
    }
  }
}

export const modelSelectionSchema = {
  oneOf: [
    modelIdSchema,
    {
      type: 'array',
      items: modelIdSchema,
      minItems: 1,
      maxItems: modelIds.length,
      uniqueItems: true,
    },
  ],
  description: 'One model ID or an array of model IDs. Defaults to all available models.',
} as const

// Chrome 152 does not yet pass execution options; Chrome 153+ follows the current draft.
const fallbackExecutionSignal = new AbortController().signal

export const getExecutionSignal = (options: WebMCP.ToolExecuteCallbackOptions | undefined): AbortSignal => options?.signal ?? fallbackExecutionSignal

export const getModelId = (value: unknown, property = 'model'): ModelId => {
  if (typeof value !== 'string' || !modelIdSet.has(value)) {
    throw new TypeError(`${property} must be a supported model ID.`)
  }
  return value as ModelId
}

export const getModelIds = (value: unknown, fallback: ReadonlyArray<ModelId> = modelIds): Array<ModelId> => {
  if (value === undefined) {
    return [...fallback]
  }
  const values = Array.isArray(value) ? value : [value]
  if (values.length === 0) {
    throw new TypeError('models must contain at least one model ID.')
  }
  const result = values.map((modelId, index) => getModelId(modelId, Array.isArray(value) ? `models[${index}]` : 'models'))
  if (new Set(result).size !== result.length) {
    throw new TypeError('models must not contain duplicate model IDs.')
  }
  return result
}
