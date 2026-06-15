import type {Theme} from '#src/components/ThemeToggle/useTheme.ts'
import type {OnChange, OnMount} from '@monaco-editor/react'
import type {FirstParameter} from 'more-types'
import type {ComponentProps, FunctionComponent, Ref} from 'react'

import {Editor as MonacoEditor} from '@monaco-editor/react'
import {once} from 'es-toolkit/function'
import {useCallback, useEffect, useImperativeHandle, useRef} from 'react'

import HexViewer from '#component/HexViewer'
import {useTheme} from '#src/components/ThemeToggle/useTheme.ts'
import {getTextRangeFromByteRange} from '#src/lib/tokenization.ts'

import css from './style.module.sass'

export type EditorHighlightRange = {end: number
  start: number}

export type EditorHandle = {
  setHighlightRange: (range: EditorHighlightRange | null) => void
}

type Props = {
  binaryData?: Uint8Array | null
  highlightRange?: EditorHighlightRange | null
  isBinary?: boolean
  onChange: (value: string) => void
  readOnly?: boolean
  ref?: Ref<EditorHandle>
  useMonaco?: boolean
  value: string
}

const monacoThemeByTheme = {
  dark: 'black',
  light: 'vs',
} satisfies Record<Theme, string>
const ensureTheme = once((monaco: FirstParameter<ComponentProps<typeof MonacoEditor>['beforeMount']>) => {
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
const Editor: FunctionComponent<Props> = ({value, onChange, readOnly, useMonaco = true, isBinary, binaryData, highlightRange, ref}) => {
  const theme = useTheme()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const decorationsRef = useRef<Array<string>>([])
  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
  }
  const handleChange: OnChange = val => {
    onChange(val ?? '')
  }
  const setHighlightRange = useCallback((range: EditorHighlightRange | null) => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) {
      return
    }
    if (!range) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
      return
    }
    const model = editor.getModel()
    if (!model) {
      return
    }
    const textRange = getTextRangeFromByteRange(model.getValue(), range)
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(textRange.startLineNumber, textRange.startColumn, textRange.endLineNumber, textRange.endColumn),
        options: {
          className: css.tokenHighlight,
          inlineClassName: css.tokenInlineHighlight,
        },
      },
    ])
  }, [])
  useImperativeHandle(ref, () => ({setHighlightRange}), [setHighlightRange])
  useEffect(() => {
    if (highlightRange !== undefined) {
      setHighlightRange(highlightRange)
    }
  }, [highlightRange, setHighlightRange])
  if (isBinary && binaryData) {
    return <HexViewer bytes={binaryData} />
  }
  if (!useMonaco) {
    return <textarea
      className={css.textarea}
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
      readOnly={readOnly}
      spellCheck={false}
    />
  }
  const monacoOptions: ComponentProps<typeof MonacoEditor>['options'] = {
    minimap: {enabled: false},
    stickyScroll: {enabled: false},
    lineNumbers: 'off',
    fontFamily: 'code',
    fontSize: 14,
    lineHeight: 16,
    tabSize: 2,
    dragAndDrop: false,
    accessibilitySupport: 'off',
    guides: {indentation: false},
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
    renderControlCharacters: true,
    folding: false,
    padding: {
      top: 6,
    },
  }
  return <div className={css.container}>
    <MonacoEditor
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      beforeMount={ensureTheme}
      theme={monacoThemeByTheme[theme]}
      language='plaintext'
      options={monacoOptions}
    />
  </div>
}

export default Editor
