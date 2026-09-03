import type {ModelId, TokenizeInput} from 'token-vocabs'

import modelsMap from '#src/lib/models/index.ts'
import {getVisibleModelIds, state} from '#src/lib/state.ts'

let pendingUiTokenizationOperations = 0
const uiTokenizationListeners = new Set<() => void>()

const getCurrentInput = (): TokenizeInput => state.isBinary && state.binaryData ? state.binaryData : state.text

const inputsEqual = (left: TokenizeInput, right: TokenizeInput): boolean => {
  if (typeof left === 'string' || typeof right === 'string') {
    return left === right
  }
  return left.byteLength === right.byteLength && left.every((byte, index) => byte === right[index])
}

const emitUiTokenizationChange = () => {
  for (const listener of uiTokenizationListeners) {
    listener()
  }
}

export const beginUiTokenization = (): (() => void) => {
  pendingUiTokenizationOperations++
  emitUiTokenizationChange()
  let ended = false
  return () => {
    if (ended) {
      return
    }
    ended = true
    pendingUiTokenizationOperations--
    emitUiTokenizationChange()
  }
}

export const isUiTokenizationIdle = (): boolean => {
  if (pendingUiTokenizationOperations > 0) {
    return false
  }
  const input = getCurrentInput()
  return getVisibleModelIds().every(modelId => {
    const modelState = state.modelStates[modelId]
    if (modelState.loading) {
      return false
    }
    if (modelState.error || !modelState.loaded) {
      return true
    }
    if (!modelState.tokenizeData) {
      return (typeof input === 'string' ? input.length : input.byteLength) === 0 && modelState.tokenCount === 0
    }
    return inputsEqual(modelState.tokenizeData.inputText, input)
  })
}

export const waitForUiTokenizationIdle = async (signal?: AbortSignal): Promise<void> => {
  while (!isUiTokenizationIdle()) {
    signal?.throwIfAborted()
    await new Promise<void>((resolve, reject) => {
      const onChange = () => {
        cleanup()
        resolve()
      }
      const onAbort = () => {
        cleanup()
        reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
      }
      const cleanup = () => {
        uiTokenizationListeners.delete(onChange)
        signal?.removeEventListener('abort', onAbort)
      }
      uiTokenizationListeners.add(onChange)
      signal?.addEventListener('abort', onAbort, {once: true})
      if (isUiTokenizationIdle()) {
        cleanup()
        resolve()
      }
    })
  }
}

export async function loadModel(modelId: ModelId): Promise<void> {
  const model = modelsMap.get(modelId)
  if (!model) {
    return
  }
  if (model.loaded) {
    state.modelStates[modelId].loaded = true
    state.modelStates[modelId].loading = false
    state.modelStates[modelId].error = null
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

const tokenizeLoadedModel = (modelId: ModelId, input: TokenizeInput): boolean => {
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

export function runTokenization(input: TokenizeInput): void {
  const focusedId = state.focusedId
  if (focusedId) {
    tokenizeLoadedModel(focusedId, input)
  }
  for (const modelId of getVisibleModelIds()) {
    if (modelId !== focusedId) {
      tokenizeLoadedModel(modelId, input)
    }
  }
}

export async function initializeModels(): Promise<void> {
  const finish = beginUiTokenization()
  try {
    const focusedId = state.focusedId
    if (focusedId) {
      await loadModel(focusedId)
      if (state.text) {
        tokenizeLoadedModel(focusedId, state.text)
      }
    }
    const otherIds = getVisibleModelIds().filter(id => id !== focusedId)
    await Promise.allSettled(otherIds.map(id => loadModel(id)))
    if (state.text) {
      const input = getCurrentInput()
      for (const id of getVisibleModelIds()) {
        tokenizeLoadedModel(id, input)
      }
    }
  } finally {
    finish()
  }
}

export async function ensureModelLoaded(modelId: ModelId): Promise<void> {
  const finish = beginUiTokenization()
  try {
    await loadModel(modelId)
    if (!getVisibleModelIds().includes(modelId)) {
      return
    }
    tokenizeLoadedModel(modelId, getCurrentInput())
  } finally {
    finish()
  }
}
