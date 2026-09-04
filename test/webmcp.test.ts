import {afterEach, describe, expect, test} from 'bun:test'

import {state} from '#src/lib/state.ts'
import {beginUiTokenization, ensureModelLoaded, unloadModel} from '#src/lib/tokenManager.ts'
import {createWebmcpTools} from '#src/lib/webmcp/tools.ts'

const originalState = {
  activeInputTabId: state.activeInputTabId,
  activeTab: state.activeTab,
  binaryData: state.binaryData,
  focusedId: state.focusedId,
  inputTabs: state.inputTabs.map(tab => ({...tab, binaryData: tab.binaryData?.slice() ?? null})),
  isBinary: state.isBinary,
  text: state.text,
  visibleEntries: [...state.visibleEntries],
}

const executeOptions = {signal: new AbortController().signal}

const createTools = () => {
  let permalinkText = ''
  return {
    tools: createWebmcpTools(() => ({
      setText: value => {
        permalinkText = value
      },
    })),
    getPermalinkText: () => permalinkText,
  }
}

const getTool = (tools: Array<WebMCP.ModelContextTool>, name: string) => tools.find(tool => tool.name === name)!

afterEach(() => {
  unloadModel('glm')
  unloadModel('sdxl')
  state.activeInputTabId = originalState.activeInputTabId
  state.activeTab = originalState.activeTab
  state.binaryData = originalState.binaryData
  state.focusedId = originalState.focusedId
  state.inputTabs = originalState.inputTabs.map(tab => ({...tab, binaryData: tab.binaryData?.slice() ?? null}))
  state.isBinary = originalState.isBinary
  state.text = originalState.text
  state.visibleEntries = [...originalState.visibleEntries]
})

describe('WebMCP', () => {
  test('exposes the GUI and headless tool contract', () => {
    const {tools} = createTools()
    expect(tools.map(tool => tool.name)).toEqual([
      'inspect',
      'read_editor',
      'read_results',
      'overwrite_editor',
      'get_permalink',
      'list_models',
      'count_tokens',
      'tokenize',
      'create_spans',
      'compare',
      'create_permalink',
    ])
  })

  test('GUI tools edit and inspect the current editor', async () => {
    const {tools, getPermalinkText} = createTools()
    const overwriteEditor = getTool(tools, 'overwrite_editor')
    const readEditor = getTool(tools, 'read_editor')
    const inspect = getTool(tools, 'inspect')

    await overwriteEditor.execute({text: 'WebMCP GUI state'}, executeOptions)
    const editor = await readEditor.execute({}, executeOptions) as {text: string, type: string}
    const ui = await inspect.execute({}, executeOptions) as {editor: {activeTab: {characters: number, type: string}}}

    expect(editor).toMatchObject({type: 'text', text: 'WebMCP GUI state'})
    expect(ui.editor.activeTab).toMatchObject({type: 'text', characters: 16})
    expect(getPermalinkText()).toBe('WebMCP GUI state')
  })

  test('headless tools accept arrayable models without changing GUI state', async () => {
    const {tools} = createTools()
    const originalText = state.text
    const countTokens = getTool(tools, 'count_tokens')
    const tokenize = getTool(tools, 'tokenize')
    const createSpans = getTool(tools, 'create_spans')

    const counts = await countTokens.execute({text: 'headless tokenizer', models: 'glm'}, executeOptions) as {counts: {glm: number}}
    const tokens = await tokenize.execute({text: 'headless tokenizer', models: 'glm'}, executeOptions) as {tokens: {glm: Array<number>}}
    const spans = await createSpans.execute({text: 'headless tokenizer', models: ['glm']}, executeOptions) as {spans: {glm: Array<{end: number, start: number}>}}

    expect(counts.counts.glm).toBeGreaterThan(0)
    expect(tokens.tokens.glm).toHaveLength(counts.counts.glm)
    expect(spans.spans.glm).toHaveLength(counts.counts.glm)
    expect(spans.spans.glm[0]?.start).toBe(0)
    expect(state.text).toBe(originalText)
  })

  test('rejects undeclared properties in code instead of relying on schema enforcement', async () => {
    const {tools} = createTools()
    const inspect = getTool(tools, 'inspect')
    const countTokens = getTool(tools, 'count_tokens')
    const compare = getTool(tools, 'compare')

    expect(() => inspect.execute({unexpected: true} as any, executeOptions)).toThrow('unknown property “unexpected”')
    await expect(countTokens.execute({text: 'strict', models: 'glm', unexpected: true} as any, executeOptions)).rejects.toThrow('unknown property “unexpected”')
    await expect(compare.execute({
      model: 'glm',
      cases: [{text: 'first', unexpected: true}, {text: 'second'}],
    } as any, executeOptions)).rejects.toThrow('cases[0] must not contain unknown property “unexpected”')
  })

  test('marks editor contents as untrusted agent output', () => {
    const {tools} = createTools()
    expect(getTool(tools, 'read_editor').annotations?.untrustedContentHint).toBe(true)
  })

  test('ContentSource URL inputs are fetched and text/url are mutually exclusive', async () => {
    const {tools} = createTools()
    const countTokens = getTool(tools, 'count_tokens')
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      if (url === 'https://example.test/content') {
        return new Response(`Fetched from ${url}`)
      }
      return originalFetch(input, init)
    }) as typeof fetch
    try {
      const result = await countTokens.execute({url: 'https://example.test/content', models: 'glm'}, executeOptions) as {
        counts: {glm: number}
        source: {type: string, url: string}
      }
      expect(result.counts.glm).toBeGreaterThan(0)
      expect(result.source).toEqual({type: 'url', url: 'https://example.test/content'})
      await expect(countTokens.execute({text: 'inline', url: 'https://example.test/content', models: 'glm'}, executeOptions)).rejects.toThrow('Exactly one of text or url')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('create_spans identifies normalized tokenizer input', async () => {
    const {tools} = createTools()
    const createSpans = getTool(tools, 'create_spans')
    const result = await createSpans.execute({text: '  HELLO  WORLD  ', models: 'sdxl'}, executeOptions) as {
      spanInputs: {sdxl: {type: string, text: string}}
      spans: {sdxl: Array<{end: number, start: number}>}
    }
    expect(result.spanInputs.sdxl).toEqual({type: 'processed', text: 'hello world'})
    expect(result.spans.sdxl).toEqual([{start: 0, end: 6}, {start: 6, end: 11}])
  })
  test('read_results waits for GUI tokenization to become idle', async () => {
    const {tools} = createTools()
    state.visibleEntries = ['glm']
    state.text = 'wait for idle'
    state.isBinary = false
    state.binaryData = null
    await ensureModelLoaded('glm')

    const finish = beginUiTokenization()
    let resolved = false
    const reading = Promise.resolve(getTool(tools, 'read_results').execute({}, executeOptions)).then((value: unknown) => {
      resolved = true
      return value as {counts: {glm: number}}
    })
    await Bun.sleep(5)
    expect(resolved).toBe(false)
    finish()

    const results = await reading
    expect(results.counts.glm).toBeGreaterThan(0)
  })

  test('compare and create_permalink operate headlessly', async () => {
    const {tools} = createTools()
    const compare = getTool(tools, 'compare')
    const createPermalink = getTool(tools, 'create_permalink')

    const comparison = await compare.execute({
      model: 'glm',
      cases: [{text: 'short'}, {text: 'a much longer comparison case'}],
    }, executeOptions) as {cases: Array<{tokens: number}>, model: string, summary: {spread: number}}
    expect(comparison.model).toBe('glm')
    expect(comparison.cases).toHaveLength(2)
    expect(comparison.summary.spread).toBeGreaterThanOrEqual(0)

    const permalink = await createPermalink.execute({
      text: 'made-up state',
      models: 'glm',
      monaco: false,
    }, executeOptions) as {url: string}
    const url = new URL(permalink.url)
    expect(url.searchParams.get('text')).toBe('made-up state')
    expect(url.searchParams.get('models')).toBe('glm')
    expect(url.searchParams.get('model')).toBe('glm')
    expect(url.searchParams.get('monaco')).toBe('false')
  })
})
