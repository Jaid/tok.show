import type {SwitchableEditorProps} from 'monacozen'
import type {FunctionComponent} from 'react'

import Monacozen from 'monacozen'
import {useEffect, useRef} from 'react'

import HexViewer from '#component/HexViewer'
import {useTheme} from '#src/components/ThemeToggle/useTheme.ts'
import {getTextRangeFromByteRange} from '#src/lib/tokenization.ts'

import css from './style.module.sass'

export type EditorHighlightRange = {
  end: number
  start: number
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
  useMonaco?: boolean
  value: string
}

const Editor: FunctionComponent<Props> = ({value, onChange, readOnly, useMonaco = true, isBinary, binaryData, highlightRange = null}) => {
  const theme = useTheme()
  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const decorationsRef = useRef<DecorationsCollection | null>(null)
  const applyHighlightRange = (range: EditorHighlightRange | null) => {
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
  }
  const handleMount: MonacozenOnMount = editor => {
    if (!('createDecorationsCollection' in editor)) {
      editorRef.current = null
      decorationsRef.current = null
      return
    }
    editorRef.current = editor
    decorationsRef.current = editor.createDecorationsCollection()
    applyHighlightRange(highlightRange)
  }
  const handleChange: NonNullable<SwitchableEditorProps['onChange']> = val => {
    onChange(val ?? '')
  }
  useEffect(() => {
    applyHighlightRange(highlightRange)
  }, [highlightRange])
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
