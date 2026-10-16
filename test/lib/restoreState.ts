import {afterEach} from 'bun:test'

import {omit} from 'es-toolkit'
import {modelIds} from 'token-vocabs'
import {snapshot} from 'valtio'

import {state} from '#src/lib/state.ts'
import {unloadModel} from '#src/lib/tokenManager.ts'

/**
 * Registers an afterEach hook that unloads every model and resets the shared app state to how it was when this was called.
 */
export const restoreStateAfterEach = () => {
  const initialState = structuredClone(omit(snapshot(state), ['modelStates']))
  afterEach(() => {
    for (const modelId of modelIds) {
      unloadModel(modelId)
    }
    Object.assign(state, structuredClone(initialState))
  })
}
