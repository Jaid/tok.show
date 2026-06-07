import type {EntryId} from '#src/lib/state.ts'
import type {TokenSpan} from '#src/lib/tokenSpans.ts'
import type {ModelId} from 'token-vocabs'

import clsx from 'clsx'
import {parseAsBoolean, parseAsString, useQueryState} from 'nuqs'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useHotkeys} from 'react-hotkeys-hook'
import {FaArrowUpRightFromSquare, FaRegCopy} from 'react-icons/fa6'
import {Group, Panel, Separator} from 'react-resizable-panels'
import {modelIds} from 'token-vocabs'
import {useSnapshot} from 'valtio'

import DraggableCardContainer from '#component/DraggableCardContainer'
import Editor from '#component/Editor'
import HiddenCardStashButton from '#component/HiddenCardStashButton'
import TokenizedText from '#component/TokenizedText'
import modelsMap from '#src/lib/models/index.ts'
import {getAverageCount, getHiddenModelIds, getModel, getShouldShowAverage, getVisibleModelIds, state} from '#src/lib/state.ts'
import {ensureModelLoaded, initializeModels, runTokenization, unloadModel} from '#src/lib/tokenManager.ts'
import {getTokenSpans} from '#src/lib/tokenSpans.ts'

const allModelIds = modelIds as ReadonlyArray<ModelId>

type Tab = 'ids' | 'mirror' | 'tokenized'

export default function App() {
  const snap = useSnapshot(state)
  // URL params
  const [textParam, setTextParam] = useQueryState('text', parseAsString.withDefault(''))
  const [modelParam, setModelParam] = useQueryState('model', parseAsString.withDefault('gpt'))
  const [monacoParam] = useQueryState('monaco', parseAsBoolean.withDefault(true))
  // models param (handled manually)
  const [modelsRaw, setModelsRaw] = useQueryState('models', parseAsString.withDefault('gpt,deepseek,mimo,qwen'))
  // Local UI
  const [currentTab, setCurrentTab] = useState<Tab>('tokenized')
  const [editorRange, setEditorRange] = useState<{end: number
    start: number} | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Sync URL → valtio
  useEffect(() => {
    state.text = textParam
  }, [textParam])
  useEffect(() => {
    if (!modelParam || modelParam === '') {
      state.focusedId = null
    } else if (allModelIds.includes(modelParam as ModelId)) {
      state.focusedId = modelParam as ModelId
    }
  }, [modelParam])
  useEffect(() => {
    const ids = getModelsFromUrl(modelsRaw)
    state.visibleEntries = ids.filter(s => allModelIds.includes(s as ModelId))
    if (getShouldShowAverage() && !state.visibleEntries.includes('average')) {
      state.visibleEntries.push('average')
    }
  }, [modelsRaw])
  useEffect(() => {
    state.useMonaco = monacoParam
  }, [monacoParam])
  // Initial load
  useEffect(() => {
    void initializeModels()
  }, [])
  // Tokenization pipeline
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      const input = state.isBinary && state.binaryData ? state.binaryData : state.text
      runTokenization(input)
    }, 16)
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [state.text, state.isBinary, state.binaryData, snap.focusedId, snap.visibleEntries])
  // Free memory for hidden model vocabularies
  useEffect(() => {
    const visibleSet = new Set(getVisibleModelIds())
    for (const id of allModelIds) {
      if (!visibleSet.has(id)) {
        unloadModel(id)
      }
    }
  }, [snap.visibleEntries])
  // Token spans
  const focusedSpans = useMemo<Array<TokenSpan>>(() => {
    const fid = state.focusedId
    if (!fid) {
      return []
    }
    const ms = snap.modelStates[fid]
    if (!ms?.tokenizeData) {
      return []
    }
    return getTokenSpans({
      offsets: ms.tokenizeData.offsets,
      originalInput: ms.tokenizeData.inputText,
      processedInput: ms.tokenizeData.processedInput,
      tokens: ms.tokenizeData.tokens,
    })
  }, [snap.modelStates, snap.focusedId])
  // Loading set
  const loadingSet = useMemo(() => {
    const s = new Set<string>
    for (const id of getVisibleModelIds()) {
      if (snap.modelStates[id]?.loading) {
        s.add(id)
      }
    }
    return s
  }, [snap.modelStates, snap.visibleEntries])
  // Counts & errors
  const tokenCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const [id, ms] of Object.entries(snap.modelStates) as Array<[string, {loaded: boolean
      tokenCount: number}]>) {
      if (ms && (ms.tokenCount > 0 || ms.loaded)) {
        c[id] = ms.tokenCount
      }
    }
    return c
  }, [snap.modelStates])
  const modelErrors = useMemo(() => {
    const e: Record<string, string | null> = {}
    for (const [id, ms] of Object.entries(snap.modelStates) as Array<[string, {error: string | null}]>) {
      e[id] = ms?.error ?? null
    }
    return e
  }, [snap.modelStates])
  // Handlers
  const onInput = useCallback((v: string) => {
    if (state.isBinary) {
      state.isBinary = false; state.binaryData = null
    }
    state.text = v; setTextParam(v)
  }, [setTextParam])
  const onFocus = useCallback((modelId: string) => {
    if (state.focusedId === modelId) {
      state.focusedId = null
    } else {
      state.focusedId = modelId as ModelId
      if (!getVisibleModelIds().includes(modelId as ModelId)) {
        state.visibleEntries = [...state.visibleEntries, modelId]
      }
      void ensureModelLoaded(modelId as ModelId)
    }
  }, [])
  const onReorder = useCallback((order: Array<EntryId>) => {
    state.visibleEntries = order
    setModelsRaw(serializeModels(order.filter(e => e !== 'average')))
  }, [setModelsRaw])
  const onHide = useCallback((entry: EntryId) => {
    if (entry !== 'average' && getVisibleModelIds().length <= 1) {
      return
    }
    state.visibleEntries = state.visibleEntries.filter(e => e !== entry)
    setModelsRaw(serializeModels(getVisibleModelIds()))
    if (entry !== 'average' && state.focusedId === entry) {
      state.focusedId = null
    }
  }, [setModelsRaw])
  const onUnhide = useCallback((id: string) => {
    if (!state.visibleEntries.includes(id)) {
      state.visibleEntries = [...state.visibleEntries, id]
      setModelsRaw(serializeModels(getVisibleModelIds()))
      void ensureModelLoaded(id as ModelId)
    }
  }, [setModelsRaw])
  // Drag & drop
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(true)
  }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as unknown as Node)) {
      setIsDragOver(false)
    }
  }, [])
  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const buf = await file.arrayBuffer(); const bytes = new Uint8Array(buf)
      let text = true
      try {
        new TextDecoder('utf-8', {fatal: true}).decode(bytes)
      } catch {
        text = false
      }
      if (text) {
        const s = (new TextDecoder).decode(bytes)
        state.isBinary = false; state.binaryData = null; state.text = s; setTextParam(s)
      } else {
        state.isBinary = true; state.binaryData = bytes; state.text = ''; setTextParam('')
      }
      return
    }
    const t = e.dataTransfer.getData('text/plain')
    if (t) {
      state.isBinary = false; state.binaryData = null; state.text = t; setTextParam(t)
    }
  }, [setTextParam])
  // Copy
  const onCopy = useCallback(async () => {
    const t = state.isBinary && state.binaryData ? new TextDecoder('utf-8', {fatal: false}).decode(state.binaryData) : state.text
    try {
      await navigator.clipboard.writeText(t)
    } catch {
      const ta = document.body.appendChild(document.createElement('textarea'))
      ta.value = t; ta.select(); document.execCommand('copy'); ta.remove()
    }
  }, [])
  // Token interactions
  const onTokenHover = useCallback((span: TokenSpan | null) => {
    setEditorRange(span ? {
      start: span.byteStart,
      end: span.byteEnd,
    } : null)
  }, [])
  const onTokenClick = useCallback((span: TokenSpan) => {
    setEditorRange({
      start: span.byteStart,
      end: span.byteEnd,
    })
  }, [])
  // Stash drag
  const onStashDrop = useCallback((entry: EntryId) => {
    onHide(entry)
  }, [onHide])
  // Share URL
  const shareUrl = useMemo(() => {
    if (globalThis.window === undefined) {
      return '#'
    }
    const u = new URL(globalThis.location.href)
    u.search = ''
    u.searchParams.set('text', state.text)
    u.searchParams.set('model', state.focusedId ?? '')
    u.searchParams.set('models', getVisibleModelIds().join(','))
    u.searchParams.set('monaco', String(state.useMonaco))
    return u.toString()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Hotkeys 0-9
  useHotkeys('0', () => {
    state.focusedId = null
  }, {preventDefault: true})
  useHotkeys('1,2,3,4,5,6,7,8,9', (event, handler) => {
    const keys = (handler as Record<string, unknown>).keys as Array<string> | undefined
    const key = keys?.[0] ?? event.key
    const num = Number.parseInt(String(key), 10)
    if (!num || num < 1 || num > 9) {
      return
    }
    const real = state.visibleEntries.filter((e): e is ModelId => e !== 'average')
    const target = real[num - 1]
    if (target) {
      onFocus(target)
    } else {
      state.focusedId = null
    }
  }, {preventDefault: true})
  // Derived
  const showAvg = getShouldShowAverage()
  const avgCount = getAverageCount()
  const visibleCount = getVisibleModelIds().length
  const hidden = getHiddenModelIds().map((id: ModelId) => getModel(id)).filter(Boolean)
  const focusedModel = state.focusedId ? getModel(state.focusedId) : null
  const curInput = state.isBinary && state.binaryData ? state.binaryData : state.text
  const rightContent = () => {
    if (currentTab === 'mirror') {
      const d = curInput instanceof Uint8Array ? new TextDecoder('utf-8', {fatal: false}).decode(curInput) : curInput
      return <div className="mirror-view">{d || <span className="tok-empty">Start typing…</span>}</div>
    }
    if (currentTab === 'ids') {
      const td = state.focusedId ? snap.modelStates[state.focusedId]?.tokenizeData : null
      if (!td) {
        return <div className="ids-view tok-empty">No tokens (focus a model)</div>
      }
      return (
        <div className="ids-view">
          {td.tokens.map((id: number, i: number) => <span key={i} className="token-id-chip">{id}</span>)}
        </div>
      )
    }
    return (
      <TokenizedText
        input={curInput}
        spans={focusedSpans}
        focusedModel={focusedModel}
        onHoverSpan={onTokenHover}
        onClickSpan={onTokenClick}
      />
    )
  }
  return (
    <div className={clsx('app-root', isDragOver && 'drag-over')}
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <Group orientation="horizontal" className="main-panels">
        {/* LEFT */}
        <Panel defaultSize={50} minSize={20}>
          <div className="pane">
            <div className="pane-header">
              <div className="tab active">input.txt</div>
              <button className="icon-btn" onClick={onCopy} title="Copy input"><FaRegCopy /></button>
            </div>
            <div className="pane-body">
              <Editor value={state.text} onChange={onInput} useMonaco={state.useMonaco}
                isBinary={state.isBinary} binaryData={state.binaryData} highlightRange={editorRange} />
            </div>
            <div className="pane-footer">
              <div className="footer-info">
                <span className="footer-icon">📝</span>
                <span className="footer-title">Tok·Show</span>
                <span className="footer-size">{state.isBinary && state.binaryData ? `${state.binaryData.byteLength.toLocaleString('en-US')} bytes` : `${(new TextEncoder).encode(state.text).byteLength.toLocaleString('en-US')} bytes · ${state.text.length.toLocaleString('en-US')} chars`}</span>
              </div>
              <div className="footer-right">
                <button className="mini-btn" onClick={() => {
                  state.useMonaco = !state.useMonaco
                }}>
                  {state.useMonaco ? 'Monaco' : 'textarea'}
                </button>
                <a className="share-link" href={shareUrl} target="_blank" rel="noopener noreferrer"
                  title="Duplicate or share this session (right-click to copy link)">
                  <FaArrowUpRightFromSquare /><span>session URL</span>
                </a>
              </div>
            </div>
          </div>
        </Panel>

        <Separator className="pane-separator" />

        {/* RIGHT */}
        <Panel defaultSize={50} minSize={20}>
          <div className="pane">
            <div className="pane-header tabs-row">
              <button className={clsx('tab', currentTab === 'mirror' && 'active')}
                onClick={() => setCurrentTab('mirror')}>mirror</button>
              <button className={clsx('tab', currentTab === 'tokenized' && 'active')}
                onClick={() => setCurrentTab('tokenized')}>tokenized</button>
              <button className={clsx('tab', currentTab === 'ids' && 'active')}
                onClick={() => setCurrentTab('ids')}>IDs</button>
            </div>
            <div className="pane-body tokenized-body">{rightContent()}</div>
            <div className="pane-footer model-bar">
              <DraggableCardContainer entries={state.visibleEntries} modelsById={modelsMap}
                counts={tokenCounts} errors={modelErrors} focusedId={state.focusedId}
                hiddenEntryIds={state.hiddenEntryIds} loadingSet={loadingSet}
                onReorder={onReorder} onFocus={onFocus} onStashDrop={onStashDrop}
                showAverage={showAvg} averageCount={avgCount} visibleModelCount={visibleCount}>
                <HiddenCardStashButton hiddenModels={hidden}
                  onUnhide={onUnhide} onHide={(id: string) => onHide(id)} />
              </DraggableCardContainer>
            </div>
          </div>
        </Panel>
      </Group>

      {isDragOver && <div className="drop-overlay">Drop text or file anywhere</div>}
    </div>
  )
}

// Custom URL param parser for models array (comma-separated)
function getModelsFromUrl(value: string | null): Array<string> {
  if (!value) {
    return ['gpt', 'deepseek', 'mimo', 'qwen']
  }
  return value.split(',').map(s => s.trim()).filter(Boolean)
}
function serializeModels(ids: Array<string>): string {
  return ids.join(',')
}
