import type {SwitchableEditorProps} from 'monacozen'
import type {FunctionComponent, Ref} from 'react'

import Monacozen from 'monacozen'
import {useCallback, useEffect, useImperativeHandle, useRef} from 'react'

import HexViewer from '#component/HexViewer'
import {useTheme} from '#src/components/ThemeToggle/useTheme.ts'
import {getTextRangeFromByteRange} from '#src/lib/tokenization.ts'

import css from './style.module.sass'

export type EditorHighlightRange = {
  end: number
  start: number
}

export type EditorHandle = {
  setHighlightRange: (range: EditorHighlightRange | null) => void
}

type MonacozenOnMount = NonNullable<SwitchableEditorProps['onMount']>
type MonacoEditorInstance = Exclude<Parameters<MonacozenOnMount>[0], HTMLTextAreaElement>
type DecorationsCollection = ReturnType<MonacoEditorInstance['createDecorationsCollection']>

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

const Editor: FunctionComponent<Props> = ({value, onChange, readOnly, useMonaco = true, isBinary, binaryData, highlightRange, ref}) => {
  const theme = useTheme()
  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const decorationsRef = useRef<DecorationsCollection | null>(null)
  const setHighlightRange = useCallback((range: EditorHighlightRange | null) => {
    const editor = editorRef.current
    const decorations = decorationsRef.current
    if (!editor || !decorations) {
      return
    }
    if (!range) {
      decorations.clear()
      return
    }
    const model = editor.getModel()
    if (!model) {
      return
    }
    const textRange = getTextRangeFromByteRange(model.getValue(), range)
    decorations.set([
      {
        range: textRange,
        options: {
          className: css.tokenHighlight,
          inlineClassName: css.tokenInlineHighlight,
        },
      },
    ])
  }, [])
  const handleMount: MonacozenOnMount = editor => {
    if (!('createDecorationsCollection' in editor)) {
      editorRef.current = null
      decorationsRef.current = null
      return
    }
    editorRef.current = editor
    decorationsRef.current = editor.createDecorationsCollection()
    if (highlightRange !== undefined) {
      setHighlightRange(highlightRange)
    }
  }
  const handleChange: NonNullable<SwitchableEditorProps['onChange']> = val => {
    onChange(val ?? '')
  }
  useImperativeHandle(ref, () => ({setHighlightRange}), [setHighlightRange])
  useEffect(() => {
    if (highlightRange !== undefined) {
      setHighlightRange(highlightRange)
    }
  }, [highlightRange, setHighlightRange])
  if (isBinary && binaryData) {
    return <HexViewer bytes={binaryData} />
  }
  return <div className={css.container}>
    <Monacozen
      dark={theme === 'dark'}
      language='plaintext'
      monaco={useMonaco ? {padding: {top: 6}} : false}
      readOnly={readOnly}
      value={value}
      onChange={handleChange}
      onMount={handleMount}
    />
  </div>
}

export default Editor
