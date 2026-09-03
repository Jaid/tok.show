import {afterEach, describe, expect, test} from 'bun:test'

import {state} from '#src/lib/state.ts'
import {ensureModelLoaded, unloadModel} from '#src/lib/tokenManager.ts'

const originalVisibleEntries = [...state.visibleEntries]
const originalText = state.text
const originalIsBinary = state.isBinary
const originalBinaryData = state.binaryData

afterEach(() => {
  unloadModel('glm')
  state.visibleEntries = [...originalVisibleEntries]
  state.text = originalText
  state.isBinary = originalIsBinary
  state.binaryData = originalBinaryData
})

describe('token manager', () => {
  test('tokenizes a newly loaded visible model with the current input', async () => {
    state.visibleEntries = ['gpt', 'glm']
    state.text = 'before load'
    state.isBinary = false
    state.binaryData = null
    unloadModel('glm')

    const loading = ensureModelLoaded('glm')
    state.text = 'dddwefwfecfwec'
    await loading

    expect(state.modelStates.glm.loaded).toBe(true)
    expect(state.modelStates.glm.tokenCount).toBeGreaterThan(0)
    expect(state.modelStates.glm.tokenizeData?.inputText).toBe('dddwefwfecfwec')
  })
})
