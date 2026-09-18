import type {EditorProps} from '@monaco-editor/react'

import 'antimono/css/antimono-static.css'

import {loader, Editor as MonacoEditor} from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

export type TextEditorProps = Omit<EditorProps, 'beforeMount' | 'options' | 'theme'> & {
  beforeMount?: (monaco: Monaco) => void
  dark?: boolean
  font?: 'antimono' | 'dense' | 'mono'
  options?: Omit<MonacoOptions, 'disableMonospaceOptimizations' | 'fontFamily'>
}
type Monaco = typeof monaco

type MonacoOptions = NonNullable<EditorProps['options']>

const defaultOptions = {
  accessibilitySupport: 'off',
  contextmenu: true,
  dragAndDrop: false,
  folding: false,
  fontSize: 14,
  guides: {indentation: false},
  largeFileOptimizations: false,
  lineHeight: 16,
  lineNumbers: 'off',
  minimap: {enabled: false},
  overviewRulerBorder: false,
  renderControlCharacters: true,
  renderLineHighlight: 'none',
  renderWhitespace: 'trailing',
  scrollbar: {
    horizontal: 'auto',
    vertical: 'auto',
  },
  stickyScroll: {enabled: false},
  tabSize: 2,
  wordWrap: 'on',
} satisfies MonacoOptions
const fontOptions = {
  antimono: {
    disableMonospaceOptimizations: true,
    fontFamily: 'Antimono, Antimono Regular, monospace',
  },
  dense: {
    disableMonospaceOptimizations: true,
    fontFamily: 'Geologica NF, Geologica, sans-serif',
  },
  mono: {
    disableMonospaceOptimizations: false,
    fontFamily: 'monospace',
  },
} satisfies Record<TextEditorProps['font'], Pick<MonacoOptions, 'disableMonospaceOptimizations' | 'fontFamily'>>
loader.config({monaco})
const configuredMonacoInstances = new WeakSet<Monaco>
const ensureTheme = (monacoInstance: Monaco) => {
  if (configuredMonacoInstances.has(monacoInstance)) {
    return
  }
  monacoInstance.editor.defineTheme('black', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#000000',
      'editor.inactiveSelectionBackground': '#222222',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#333333',
      'editorCursor.foreground': '#fff',
    },
    rules: [],
  })
  configuredMonacoInstances.add(monacoInstance)
}
const TextEditor = ({beforeMount, dark = true, font = 'antimono', options, ...props}: TextEditorProps) => {
  const handleBeforeMount = (monacoInstance: Monaco) => {
    ensureTheme(monacoInstance)
    beforeMount?.(monacoInstance)
  }
  return <MonacoEditor
    {...props}
    beforeMount={handleBeforeMount}
    options={{
      ...defaultOptions,
      ...options,
      ...fontOptions[font],
    }}
    theme={dark ? 'black' : 'vs'}
  />
}

export default TextEditor
