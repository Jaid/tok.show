import type {OnChange, OnMount} from '@monaco-editor/react'
import type {FunctionComponent} from 'react'

import {Editor as MonacoEditor} from '@monaco-editor/react'
import {once} from 'es-toolkit/function'
import {useCallback, useEffect, useRef} from 'react'

import HexViewer from '#component/HexViewer'

import css from './style.module.sass'

type Props = {
  binaryData?: Uint8Array | null
  highlightRange?: {end: number
    start: number} | null
  isBinary?: boolean
  onChange: (value: string) => void
  readOnly?: boolean
  useMonaco?: boolean
  value: string
}

const ensureTheme = once((monaco: any) => {
  monaco.editor.defineTheme('black', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#000000',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#333333',
      'editor.inactiveSelectionBackground': '#222222',
      'editorCursor.foreground': '#fff',
    },
    rules: [],
  })
})
const Editor: FunctionComponent<Props> = ({value, onChange, readOnly, useMonaco = true, isBinary, binaryData, highlightRange}) => {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const decorationsRef = useRef<Array<string>>([])
  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
  }, [])
  const handleChange: OnChange = useCallback(val => {
    onChange(val ?? '')
  }, [onChange])
  // Highlight decoration sync
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) {
      return
    }
    if (!highlightRange) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
      return
    }
    const model = editor.getModel()
    if (!model) {
      return
    }
    const startPos = model.getPositionAt(highlightRange.start)
    const endPos = model.getPositionAt(highlightRange.end)
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
        options: {
          className: css.tokenHighlight,
          inlineClassName: css.tokenInlineHighlight,
        },
      },
    ])
  }, [highlightRange])
  // Binary hex viewer
  if (isBinary && binaryData) {
    return <HexViewer bytes={binaryData} />
  }
  // Fallback textarea when Monaco disabled
  if (!useMonaco) {
    return <textarea
      aria-label='input text'
      className={css.textarea}
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
      readOnly={readOnly}
      spellCheck={false}
    />
  }
  return <div className={css.container}>
    <MonacoEditor
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      beforeMount={ensureTheme}
      theme='black'
      language='plaintext'
      options={{
        minimap: {enabled: false},
        stickyScroll: {enabled: false},
        lineNumbers: 'off',
        fontFamily: 'code, monospace',
        fontSize: 14,
        tabSize: 2,
        dragAndDrop: false,
        accessibilitySupport: 'off',
        guides: {indentation: false},
        lineHeight: 1.4,
        overviewRulerBorder: false,
        renderWhitespace: 'trailing',
        wordWrap: 'on',
        contextmenu: true,
        readOnly,
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
        },
        renderLineHighlight: 'none',
        folding: false,
        padding: {
          top: 6,
        },
      }}
    />
  </div>
}

export default Editor
