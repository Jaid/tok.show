import type {EditorHandle} from '#component/Editor'
import type {OutputTab} from '#component/OutputHeader'
import type {Model} from '#src/lib/models/index.ts'
import type {EntryId} from '#src/lib/state.ts'
import type {TokenSpan} from '#src/lib/tokenSpans.ts'
import type {DragEvent, FunctionComponent} from 'react'
import type {ModelId} from 'token-vocabs'

import clsx from 'clsx'
import {useEffect, useRef, useState} from 'react'
import {useHotkeys} from 'react-hotkeys-hook'
import {Group, Panel, Separator} from 'react-resizable-panels'
import {modelIds} from 'token-vocabs'
import {useSnapshot} from 'valtio'

import Editor from '#component/Editor'
import EditorFooter from '#component/EditorFooter'
import EditorHeader from '#component/EditorHeader'
import OutputFooter from '#component/OutputFooter'
import OutputHeader from '#component/OutputHeader'
import {useTabbedView} from '#component/TabbedView'
import TokenizedText from '#component/TokenizedText'
import modelsMap from '#src/lib/models/index.ts'
import {createInputTab, getAverageCount, getHiddenModelIds, getModel, getShouldShowAverage, getVisibleModelIds, setActiveInputTab, state, syncInputStateFromActiveTab, updateActiveInputTab} from '#src/lib/state.ts'
import {ensureModelLoaded, initializeModels, runTokenization, unloadModel} from '#src/lib/tokenManager.ts'
import {getTokenSpans} from '#src/lib/tokenSpans.ts'
import {useUrlParameters} from '#src/lib/useUrlParameters.ts'

import css from './style.module.sass'

const numberHotkeys = '1,2,3,4,5,6,7,8,9'
const allModelIds = modelIds as ReadonlyArray<ModelId>
const isModelId = (value: string): value is ModelId => allModelIds.includes(value as ModelId)
const getModelIdsFromEntries = (entries: ReadonlyArray<EntryId>): Array<ModelId> => entries.filter(isModelId)
const getNumberHotkey = (event: KeyboardEvent): number | null => {
  const digit = event.code.replace(/^(?:Digit|Numpad)/, '')
  const key = /^\d$/.test(digit) ? digit : event.key
  if (!/^[1-9]$/.test(key)) {
    return null
  }
  return Number(key)
}
const getModelsFromUrl = (value: string | null): Array<string> => {
  if (!value) {
    return ['gpt', 'deepseek']
  }
  return value.split(',').map(s => s.trim()).filter(Boolean)
}
const serializeModels = (ids: Array<string>): string => ids.join(',')

type OutputPaneContentProps = {
  focusedModel: Model | null
  focusedSpans: Array<TokenSpan>
  input: Uint8Array | string
  onTokenClick: (span: TokenSpan) => void
  onTokenHover: (span: TokenSpan | null) => void
  preprocessedInput: Uint8Array | string
  tokenIds: ReadonlyArray<number> | null
}

const OutputPaneContent: FunctionComponent<OutputPaneContentProps> = ({focusedModel, focusedSpans, input, onTokenClick, onTokenHover, preprocessedInput, tokenIds}) => {
  const {tabKey: currentTab} = useTabbedView<OutputTab>()
  if (currentTab === 'preprocessed') {
    const displayInput = preprocessedInput instanceof Uint8Array ? new TextDecoder('utf-8', {fatal: false}).decode(preprocessedInput) : preprocessedInput
    return <div className={css.preprocessedView}>{displayInput || <span className={css.empty}>Start typing…</span>}</div>
  }
  if (currentTab === 'ids') {
    if (!tokenIds) {
      return <div className={clsx(css.idsView, css.empty)}>No tokens (focus a model)</div>
    }
    const elements = tokenIds.map((id: number, i: number) => {
      return <span key={i} className={css.tokenIdChip}>{id}</span>
    })
    return <div className={css.idsView} children={elements}/>
  }
  return <TokenizedText input={input} spans={focusedSpans} focusedModel={focusedModel} onHoverSpan={onTokenHover} onClickSpan={onTokenClick} />
}
const App: FunctionComponent = () => {
  const snap = useSnapshot(state)
  const {model: modelParam,
    models: modelsRaw,
    monaco: monacoParam,
    setModel: setModelParam,
    setModels: setModelsRaw,
    setText: setTextParam,
    shareUrl,
    text: textParam} = useUrlParameters()
  const [currentTab, setCurrentTab] = useState<OutputTab>('tokenized')
  const editorRef = useRef<EditorHandle>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const inputTab = state.inputTabs.find(tab => tab.id === 'input')
    if (!inputTab) {
      return
    }
    inputTab.text = textParam
    inputTab.isBinary = false
    inputTab.binaryData = null
    if (state.activeInputTabId === inputTab.id) {
      syncInputStateFromActiveTab()
    }
  }, [textParam])
  useEffect(() => {
    if (!modelParam || modelParam === '') {
      state.focusedId = null
    } else if (isModelId(modelParam)) {
      state.focusedId = modelParam
    }
  }, [modelParam])
  useEffect(() => {
    const ids = getModelsFromUrl(modelsRaw)
    state.visibleEntries = ids.filter(isModelId)
    if (getShouldShowAverage() && !state.visibleEntries.includes('average')) {
      state.visibleEntries.push('average')
    }
  }, [modelsRaw])
  useEffect(() => {
    state.useMonaco = monacoParam
  }, [monacoParam])
  useEffect(() => {
    void initializeModels()
  }, [])
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
  useEffect(() => {
    const visibleSet = new Set(getVisibleModelIds())
    for (const id of allModelIds) {
      if (!visibleSet.has(id)) {
        unloadModel(id)
      }
    }
  }, [snap.visibleEntries])
  const focusedSpans: Array<TokenSpan> = (() => {
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
  })()
  const loadingSet = (() => {
    const s = new Set<string>
    for (const id of getVisibleModelIds()) {
      if (snap.modelStates[id]?.loading) {
        s.add(id)
      }
    }
    return s
  })()
  const tokenCounts = (() => {
    const c: Record<string, number> = {}
    for (const [id, ms] of Object.entries(snap.modelStates) as Array<[string, {loaded: boolean
      tokenCount: number}]>) {
      if (ms && (ms.tokenCount > 0 || ms.loaded)) {
        c[id] = ms.tokenCount
      }
    }
    return c
  })()
  const modelErrors = (() => {
    const e: Record<string, string | null> = {}
    for (const [id, ms] of Object.entries(snap.modelStates) as Array<[string, {error: string | null}]>) {
      e[id] = ms?.error ?? null
    }
    return e
  })()
  const onInput = (v: string) => {
    updateActiveInputTab({
      text: v,
      isBinary: false,
      binaryData: null,
    })
    if (state.activeInputTabId === 'input') {
      setTextParam(v)
    }
  }
  const onFocus = (modelId: string) => {
    if (state.focusedId === modelId) {
      state.focusedId = null
      setModelParam('')
    } else {
      state.focusedId = modelId as ModelId
      setModelParam(modelId)
      if (!getVisibleModelIds().includes(modelId as ModelId)) {
        state.visibleEntries = [...state.visibleEntries, modelId]
        setModelsRaw(serializeModels(getVisibleModelIds()))
      }
      void ensureModelLoaded(modelId as ModelId)
    }
  }
  const onReorder = (order: Array<EntryId>) => {
    state.visibleEntries = order
    setModelsRaw(serializeModels(order.filter(e => e !== 'average')))
  }
  const onHide = (entry: EntryId) => {
    if (entry !== 'average' && getVisibleModelIds().length <= 1) {
      return
    }
    state.visibleEntries = state.visibleEntries.filter(e => e !== entry)
    setModelsRaw(serializeModels(getVisibleModelIds()))
    if (entry !== 'average' && state.focusedId === entry) {
      state.focusedId = null
      setModelParam('')
    }
  }
  const onUnhide = (id: string) => {
    if (!state.visibleEntries.includes(id)) {
      state.visibleEntries = [...state.visibleEntries, id]
      setModelsRaw(serializeModels(getVisibleModelIds()))
      void ensureModelLoaded(id as ModelId)
    }
  }
  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const onDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as unknown as Node)) {
      setIsDragOver(false)
    }
  }
  const onDrop = async (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let isUtf8 = true
      try {
        new TextDecoder('utf-8', {fatal: true}).decode(bytes)
      } catch {
        isUtf8 = false
      }
      if (isUtf8) {
        const text = (new TextDecoder).decode(bytes)
        createInputTab({
          name: file.name || 'dropped.txt',
          text,
          isBinary: false,
          binaryData: null,
        })
      } else {
        createInputTab({
          name: file.name || 'dropped.bin',
          text: '',
          isBinary: true,
          binaryData: bytes,
        })
      }
      return
    }
    const t = e.dataTransfer.getData('text/plain')
    if (t) {
      createInputTab({
        name: 'dropped.txt',
        text: t,
        isBinary: false,
        binaryData: null,
      })
    }
  }
  const onCopy = async () => {
    const t = state.isBinary && state.binaryData ? new TextDecoder('utf-8', {fatal: false}).decode(state.binaryData) : state.text
    try {
      await navigator.clipboard.writeText(t)
    } catch {
      const ta = document.body.appendChild(document.createElement('textarea'))
      ta.value = t; ta.select(); document.execCommand('copy'); ta.remove()
    }
  }
  const onTokenHover = (span: TokenSpan | null) => {
    editorRef.current?.setHighlightRange(span ? {
      start: span.byteStart,
      end: span.byteEnd,
    } : null)
  }
  const onTokenClick = (span: TokenSpan) => {
    editorRef.current?.setHighlightRange({
      start: span.byteStart,
      end: span.byteEnd,
    })
  }
  const onStashDrop = (entry: EntryId) => {
    onHide(entry)
  }
  useHotkeys('0', () => {
    state.focusedId = null
    setModelParam('')
  }, {preventDefault: true})
  useHotkeys(numberHotkeys, event => {
    const num = getNumberHotkey(event)
    if (num === null) {
      return
    }
    const target = getModelIdsFromEntries(state.visibleEntries)[num - 1]
    if (target) {
      onFocus(target)
    } else {
      state.focusedId = null
      setModelParam('')
    }
  }, {preventDefault: true})
  const showAvg = getShouldShowAverage()
  const avgCount = getAverageCount()
  const visibleCount = getVisibleModelIds().length
  const hidden = getHiddenModelIds().map((id: ModelId) => getModel(id)).filter(Boolean)
  const focusedModel = state.focusedId ? getModel(state.focusedId) : null
  const curInput = state.isBinary && state.binaryData ? state.binaryData : state.text
  const focusedTokenizeData = state.focusedId ? snap.modelStates[state.focusedId]?.tokenizeData ?? null : null
  const preprocessedInput = focusedTokenizeData?.processedInput ?? focusedTokenizeData?.inputText ?? curInput
  const tokenIds = focusedTokenizeData?.tokens ?? null
  const outputTab = state.focusedId ? currentTab : 'preprocessed'
  return <>
    <Group orientation="horizontal" className={css.container}>
      <Panel defaultSize={50} minSize={20}>
        <div className={css.pane} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          <EditorHeader
            tabs={snap.inputTabs}
            activeTabId={snap.activeInputTabId}
            sizeInBytes={(new TextEncoder).encode(state.text).byteLength}
            charCount={state.text.length}
            isBinary={state.isBinary}
            binaryByteCount={state.binaryData?.byteLength ?? null}
            onCopy={onCopy}
            onTabSelect={id => {
              setActiveInputTab(id)
              if (id === 'input') {
                setTextParam(state.text)
              }
            }}
          />
          <div className={css.paneBody}>
            <Editor ref={editorRef} value={state.text} onChange={onInput} useMonaco={state.useMonaco}
              isBinary={state.isBinary} binaryData={state.binaryData} />
          </div>
          <EditorFooter shareUrl={shareUrl} />
          {isDragOver && <div className={css.dropOverlay}>Drop text or file here</div>}
        </div>
      </Panel>
      <Separator className={css.paneSeparator} />
      <Panel defaultSize={50} minSize={20}>
        <div className={css.pane}>
          <OutputHeader currentTab={outputTab} onTabChange={setCurrentTab} showModelTabs={Boolean(state.focusedId)}>
            <div className={css.paneBody}>
              <OutputPaneContent focusedModel={focusedModel} focusedSpans={focusedSpans} input={curInput}
                onTokenClick={onTokenClick} onTokenHover={onTokenHover} preprocessedInput={preprocessedInput} tokenIds={tokenIds} />
            </div>
          </OutputHeader>
          <OutputFooter entries={state.visibleEntries} modelsById={modelsMap}
            counts={tokenCounts} errors={modelErrors} focusedId={state.focusedId}
            hiddenEntryIds={state.hiddenEntryIds} loadingSet={loadingSet}
            onReorder={onReorder} onFocus={onFocus} onStashDrop={onStashDrop}
            showAverage={showAvg} averageCount={avgCount} visibleModelCount={visibleCount}
            hiddenModels={hidden}
            onUnhide={onUnhide} onHide={(id: EntryId) => onHide(id)} />
        </div>
      </Panel>
    </Group>
  </>
}

export default App
