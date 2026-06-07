import type {ModelId, TokenizeInput} from 'token-vocabs'
import {load, tokenizeLoaded} from 'token-vocabs'

import {state, getVisibleModelIds} from '#src/lib/state.ts'

const loadedSet = new Set<ModelId>()
const loadingPromises = new Map<ModelId, Promise<void>>()
let tokenizeGeneration = 0

export async function loadModel(modelId: ModelId): Promise<void> {
  if (loadedSet.has(modelId)) {
    return
  }
  const existing = loadingPromises.get(modelId)
  if (existing) {
    return existing
  }
  state.modelStates[modelId].loading = true
  state.modelStates[modelId].error = null
  const promise = load(modelId).then(() => {
    loadedSet.add(modelId)
    state.modelStates[modelId].loaded = true
    state.modelStates[modelId].loading = false
    loadingPromises.delete(modelId)
  }).catch((error: Error) => {
    console.error(`Failed to load model ${modelId}:`, error)
    state.modelStates[modelId].error = error.message
    state.modelStates[modelId].loading = false
    loadingPromises.delete(modelId)
  })
  loadingPromises.set(modelId, promise)
  return promise
}

export function unloadModel(modelId: ModelId): void {
  if (!loadedSet.has(modelId)) {
    return
  }
  loadedSet.delete(modelId)
  state.modelStates[modelId] = {
    error: null,
    loaded: false,
    loading: false,
    tokenCount: 0,
    tokenizeData: null,
  }
}

function tokenizeModel(modelId: ModelId, input: TokenizeInput): boolean {
  if (!loadedSet.has(modelId)) {
    return false
  }
  try {
    const result = tokenizeLoaded(input, modelId)
    state.modelStates[modelId].tokenizeData = {
      inputText: input,
      offsets: result.offsets,
      processedInput: result.processedInput,
      tokens: result.tokens,
    }
    state.modelStates[modelId].tokenCount = result.tokens.length
    state.modelStates[modelId].error = null
    return true
  } catch (error) {
    state.modelStates[modelId].error = error instanceof Error ? error.message : String(error)
    return false
  }
}

export function runTokenization(input: TokenizeInput): void {
  const gen = ++tokenizeGeneration
  const focusedId = state.focusedId

  const doTokenize = async () => {
    // 1. Focused model first
    if (focusedId && loadedSet.has(focusedId)) {
      tokenizeModel(focusedId, input)
    }
    if (gen !== tokenizeGeneration) {
      return
    }

    // 2. Other visible models in parallel
    const visibleIds = getVisibleModelIds().filter(id => id !== focusedId && loadedSet.has(id))
    const batchSize = 4
    for (let i = 0; i < visibleIds.length; i += batchSize) {
      if (gen !== tokenizeGeneration) {
        return
      }
      const batch = visibleIds.slice(i, i + batchSize)
      for (const id of batch) {
        tokenizeModel(id, input)
      }
      // Yield to main thread between batches
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
  void doTokenize()
}

export async function initializeModels(): Promise<void> {
  const focusedId = state.focusedId

  // 1. Load focused model first, solo
  if (focusedId) {
    await loadModel(focusedId)
    if (state.text) {
      tokenizeModel(focusedId, state.text)
    }
  }

  // 2. Load all other visible models in parallel
  const otherIds = getVisibleModelIds().filter(id => id !== focusedId)
  await Promise.allSettled(otherIds.map(id => loadModel(id)))

  // Tokenize with all loaded
  if (state.text) {
    const input = state.isBinary && state.binaryData ? state.binaryData : state.text
    for (const id of getVisibleModelIds()) {
      tokenizeModel(id, input)
    }
  }
}

export async function ensureModelLoaded(modelId: ModelId): Promise<void> {
  await loadModel(modelId)
}
