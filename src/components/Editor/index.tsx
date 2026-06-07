import type {OnChange, OnMount} from '@monaco-editor/react'

import {Editor as MonacoEditor} from '@monaco-editor/react'
import {once} from 'es-toolkit/function'
import {useEffect, useMemo, useRef} from 'react'

type Props = {
  binaryData?: Uint8Array | null
  highlightRange?: {end: number
    start: number} | null
  isBinary?: boolean
  onBinaryChange?: (data: Uint8Array) => void
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
      'editorLineNumber.foreground': '#333',
    },
    rules: [],
  })
})
const bytesPerLine = 16
export default function Editor({value, onChange, onBinaryChange, readOnly, useMonaco = true, isBinary, binaryData, highlightRange}: Props) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const decorationsRef = useRef<Array<string>>([])
  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // No-op: prevent save dialog
    })
  }
  const handleChange: OnChange = val => {
    onChange(val ?? '')
  }
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
          className: 'tok-highlight-decoration',
          inlineClassName: 'tok-highlight-inline',
        },
      },
    ])
  }, [highlightRange])
  // Binary hex viewer
  if (isBinary && binaryData) {
    const hex = useMemo(() => formatHexViewer(binaryData), [binaryData])
    return (
      <div className="hex-viewer">
        <pre>{hex}</pre>
        <style>{`
          .hex-viewer {
            font-family: code, monospace;
            font-size: 12px;
            line-height: 1.4;
            padding: 12px;
            color: #aaa;
            overflow: auto;
            height: 100%;
            background: #000;
            white-space: pre;
          }
          .hex-viewer pre {
            margin: 0;
          }
        `}</style>
      </div>
    )
  }
  // Fallback textarea when Monaco disabled
  if (!useMonaco) {
    return (
      <textarea
        className="basic-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    )
  }
  return (
    <div className="monaco-wrapper">
      <MonacoEditor
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        beforeMount={ensureTheme}
        theme="black"
        language="plaintext"
        options={{
          minimap: {enabled: false},
          stickyScroll: {enabled: false},
          lineNumbers: 'off',
          fontFamily: 'code',
          fontSize: 14,
          tabSize: 2,
          dragAndDrop: false,
          accessibilitySupport: 'off',
          guides: {indentation: false},
          lineHeight: 1.3,
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
          links: false,
          occurrencesHighlight: 'off',
          selectionHighlight: false,
          matchBrackets: 'never',
        }}
      />
    </div>
  )
}

function formatHexViewer(bytes: Uint8Array): string {
  const lines: Array<string> = []
  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    const chunk = bytes.slice(i, i + bytesPerLine)
    const hex = Array.from(chunk, b => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = Array.from(chunk, b => b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.').join('')
    lines.push(`${i.toString(16).padStart(8, '0')}  ${hex.padEnd(48, ' ')}  |${ascii}|`)
  }
  return lines.join('\n') || '(empty)'
}
