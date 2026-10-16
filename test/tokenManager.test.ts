import {describe, expect, test} from 'bun:test'

import {state} from '#src/lib/state.ts'
import {beginUiTokenization, ensureModelLoaded, isUiTokenizationIdle, waitForUiTokenizationIdle} from '#src/lib/tokenManager.ts'

import {restoreStateAfterEach} from './lib/restoreState.ts'

restoreStateAfterEach()
describe('token manager', () => {
  test('tokenizes a newly loaded visible model with the input current at load completion', async () => {
    state.visibleEntries = ['gpt', 'glm']
    state.text = 'before load'
    const loading = ensureModelLoaded('glm')
    state.text = 'after load'
    await loading
    expect(state.modelStates.glm.loaded).toBe(true)
    expect(state.modelStates.glm.tokenCount).toBeGreaterThan(0)
    expect(state.modelStates.glm.tokenizeData?.inputText).toBe('after load')
  })
  test('does not tokenize models that are not visible', async () => {
    state.visibleEntries = ['gpt']
    state.text = 'hidden model'
    await ensureModelLoaded('glm')
    expect(state.modelStates.glm.loaded).toBe(true)
    expect(state.modelStates.glm.tokenizeData).toBeNull()
  })
  test('waiting for idle UI tokenization can be aborted', async () => {
    state.visibleEntries = []
    const finish = beginUiTokenization()
    expect(isUiTokenizationIdle()).toBe(false)
    const controller = new AbortController
    const waiting = waitForUiTokenizationIdle(controller.signal)
    controller.abort(new Error('aborted by test'))
    await expect(waiting).rejects.toThrow('aborted by test')
    finish()
    expect(isUiTokenizationIdle()).toBe(true)
  })
})
