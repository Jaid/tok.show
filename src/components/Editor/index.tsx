import type {FunctionComponent, Ref} from 'react'
import type {TextEditorProps} from 'text-editor'

import {useCallback, useEffect, useImperativeHandle, useRef} from 'react'
import TextEditor from 'text-editor'

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

type TextEditorOnMount = NonNullable<TextEditorProps['onMount']>
type MonacoEditorInstance = Parameters<TextEditorOnMount>[0]
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
  const handleMount: TextEditorOnMount = editor => {
    editorRef.current = editor
    decorationsRef.current = editor.createDecorationsCollection()
  }
  const handleChange: NonNullable<TextEditorProps['onChange']> = val => {
    onChange(val ?? '')
  }
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
      readOnly={readOnly}
      spellCheck={false}
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
    />
  }
  return <div className={css.container}>
    <TextEditor
      dark={theme === 'dark'}
      language='plaintext'
      options={{
        padding: {top: 6},
        readOnly,
      }}
      value={value}
      onChange={handleChange}
      onMount={handleMount}
    />
  </div>
}

export default Editor
