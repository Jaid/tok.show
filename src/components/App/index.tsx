import type {OutputTab} from '#component/OutputHeader'
import type {EntryId} from '#src/lib/state.ts'
import type {TokenSpan} from '#src/lib/tokenSpans.ts'
import type {FunctionComponent} from 'react'
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
import TokenizedText from '#component/TokenizedText'
import modelsMap from '#src/lib/models/index.ts'
import {getAverageCount, getHiddenModelIds, getModel, getShouldShowAverage, getVisibleModelIds, state} from '#src/lib/state.ts'
import {ensureModelLoaded, initializeModels, runTokenization, unloadModel} from '#src/lib/tokenManager.ts'
import {getTokenSpans} from '#src/lib/tokenSpans.ts'
import {useUrlParameters} from '#src/lib/useUrlParameters.ts'

import css from './style.module.sass'

const allModelIds = modelIds as ReadonlyArray<ModelId>
const getModelsFromUrl = (value: string | null): Array<string> => {
  if (!value) {
    return ['gpt', 'deepseek']
  }
  return value.split(',').map(s => s.trim()).filter(Boolean)
}
const serializeModels = (ids: Array<string>): string => ids.join(',')
const App: FunctionComponent = () => {
  const snap = useSnapshot(state)
  const {model: modelParam,
    models: modelsRaw,
    monaco: monacoParam,
    setModel: setModelParam,
    setModels: setModelsRaw,
    setMonaco: setMonacoParam,
    setText: setTextParam,
    shareUrl,
    text: textParam} = useUrlParameters()
  const [currentTab, setCurrentTab] = useState<OutputTab>('tokenized')
  const [editorRange, setEditorRange] = useState<{end: number
    start: number} | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    if (state.isBinary) {
      state.isBinary = false; state.binaryData = null
    }
    state.text = v; setTextParam(v)
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
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as unknown as Node)) {
      setIsDragOver(false)
    }
  }
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
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
    setEditorRange(span ? {
      start: span.byteStart,
      end: span.byteEnd,
    } : null)
  }
  const onTokenClick = (span: TokenSpan) => {
    setEditorRange({
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
      setModelParam('')
    }
  }, {preventDefault: true})
  const showAvg = getShouldShowAverage()
  const avgCount = getAverageCount()
  const visibleCount = getVisibleModelIds().length
  const hidden = getHiddenModelIds().map((id: ModelId) => getModel(id)).filter(Boolean)
  const focusedModel = state.focusedId ? getModel(state.focusedId) : null
  const curInput = state.isBinary && state.binaryData ? state.binaryData : state.text
  const rightContent = () => {
    if (currentTab === 'mirror') {
      const d = curInput instanceof Uint8Array ? new TextDecoder('utf-8', {fatal: false}).decode(curInput) : curInput
      return <div className={css.mirrorView}>{d || <span className={css.empty}>Start typing…</span>}</div>
    }
    if (currentTab === 'ids') {
      const td = state.focusedId ? snap.modelStates[state.focusedId]?.tokenizeData : null
      if (!td) {
        return <div className={clsx(css.idsView, css.empty)}>No tokens (focus a model)</div>
      }
      const elements = td.tokens.map((id: number, i: number) => {
        return <span key={i} className={css.tokenIdChip}>{id}</span>
      })
      return <div className={css.idsView} children={elements}/>
    }
    return <TokenizedText input={curInput} spans={focusedSpans} focusedModel={focusedModel} onHoverSpan={onTokenHover} onClickSpan={onTokenClick} />
  }
  return <>
    <Group orientation="horizontal" className={css.container}>
      <Panel defaultSize={50} minSize={20}>
        <div className={css.pane}>
          <EditorHeader
            sizeInBytes={(new TextEncoder).encode(state.text).byteLength}
            charCount={state.text.length}
            isBinary={state.isBinary}
            binaryByteCount={state.binaryData?.byteLength ?? null}
            onCopy={onCopy}
          />
          <div className={css.paneBody}>
            <Editor value={state.text} onChange={onInput} useMonaco={state.useMonaco}
              isBinary={state.isBinary} binaryData={state.binaryData} highlightRange={editorRange} />
          </div>
          <EditorFooter
            useMonaco={state.useMonaco}
            onToggleMonaco={() => {
              state.useMonaco = !state.useMonaco
              setMonacoParam(state.useMonaco)
            }}
            shareUrl={shareUrl}
          />
        </div>
      </Panel>
      <Separator className={css.paneSeparator} />
      <Panel defaultSize={50} minSize={20}>
        <div className={css.pane}>
          <OutputHeader currentTab={currentTab} onTabChange={setCurrentTab} />
          <div className={css.paneBody}>{rightContent()}</div>
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
    {isDragOver && <div className={css.dropOverlay}>Drop text or file anywhere</div>}
  </>
}

export default App
