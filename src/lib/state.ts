import type {ModelId} from 'token-vocabs'
import {proxy} from 'valtio'
import {modelIds} from 'token-vocabs'

import modelsMap from './models/index.ts'

export type EntryId = string

export interface TokenizeData {
  inputText: string | Uint8Array
  offsets: readonly number[]
  processedInput?: string | Uint8Array
  tokens: readonly number[]
}

export interface ModelState {
  error: string | null
  loaded: boolean
  loading: boolean
  tokenCount: number
  tokenizeData: TokenizeData | null
}

const initialModelStates: Record<ModelId, ModelState> = {} as Record<ModelId, ModelState>
for (const id of modelIds) {
  initialModelStates[id] = {
    error: null,
    loaded: false,
    loading: false,
    tokenCount: 0,
    tokenizeData: null,
  }
}

export const state = proxy({
  text: '',
  isBinary: false,
  binaryData: null as Uint8Array | null,
  focusedId: 'gpt' as ModelId | null,
  visibleEntries: ['average', 'gpt', 'deepseek'] as EntryId[],
  hiddenEntryIds: [] as EntryId[],
  modelStates: initialModelStates,
  activeTab: 'tokenized' as 'ids' | 'mirror' | 'tokenized',
  hoveredTokenIndex: null as number | null,
  useMonaco: true,
  averageExplicitlyHidden: false,
})

export function getVisibleModelIds(): ModelId[] {
  return state.visibleEntries.filter((id): id is ModelId => id !== 'average')
}

export function getHiddenModelIds(): ModelId[] {
  const visible = new Set(getVisibleModelIds())
  return (modelIds as readonly ModelId[]).filter((id: ModelId) => !visible.has(id))
}

export function getShouldShowAverage(): boolean {
  const realCount = getVisibleModelIds().length
  return realCount >= 2 && !state.averageExplicitlyHidden
}

export function getModel(id: ModelId) {
  return modelsMap.get(id)!
}

export function getAverageCount(): number | null {
  const counts = getVisibleModelIds()
    .map(id => state.modelStates[id]?.tokenCount)
    .filter((c): c is number => c !== null && c !== undefined && c >= 0)
  if (counts.length < 2) {
    return null
  }
  const sum = counts.reduce((a, b) => a + b, 0)
  return Math.round((sum / counts.length) * 10) / 10
}
