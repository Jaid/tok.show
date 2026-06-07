import type {ModelId, TokenizeInput} from 'token-vocabs'

import modelsMap from '#src/lib/models/index.ts'
import {getVisibleModelIds, state} from '#src/lib/state.ts'

let tokenizeGeneration = 0

export async function loadModel(modelId: ModelId): Promise<void> {
  const model = modelsMap.get(modelId)
  if (!model) {
    return
  }
  if (model.loaded) {
    return
  }
  state.modelStates[modelId].loading = true
  state.modelStates[modelId].error = null
  try {
    await model.load()
    state.modelStates[modelId].loaded = true
    state.modelStates[modelId].loading = false
  } catch (error) {
    console.error(`Failed to load model ${modelId}:`, error)
    state.modelStates[modelId].error = error instanceof Error ? error.message : String(error)
    state.modelStates[modelId].loading = false
  }
}

export function unloadModel(modelId: ModelId): void {
  const model = modelsMap.get(modelId)
  if (model) {
    model.unload()
  }
  state.modelStates[modelId] = {
    error: null,
    loaded: false,
    loading: false,
    tokenCount: 0,
    tokenizeData: null,
  }
}

export function runTokenization(input: TokenizeInput): void {
  const gen = ++tokenizeGeneration
  const focusedId = state.focusedId
  const doTokenize = async () => {
    // 1. Focused model first — gives the user results ASAP for the model they care about
    if (focusedId) {
      const focusedModel = modelsMap.get(focusedId)
      if (focusedModel?.loaded) {
        tokenizeModel(focusedId, input)
      }
    }
    if (gen !== tokenizeGeneration) {
      return
    }
    // 2. Other visible models in parallel
    const visibleIds = getVisibleModelIds().filter(id => id !== focusedId)
    const otherLoaded = visibleIds.filter(id => modelsMap.get(id)?.loaded)
    for (const id of otherLoaded) {
      tokenizeModel(id, input)
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

function tokenizeModel(modelId: ModelId, input: TokenizeInput): boolean {
  const model = modelsMap.get(modelId)
  if (!model?.loaded) {
    return false
  }
  try {
    const result = model.tokenize(input)
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
