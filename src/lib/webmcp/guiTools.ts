import {getAverageCount, getHiddenModelIds, getVisibleModelIds, state, updateActiveInputTab} from '#src/lib/state.ts'
import {isUiTokenizationIdle, waitForUiTokenizationIdle} from '#src/lib/tokenManager.ts'

import {contentSourceProperties, contentSourceRequirement, resolveContentSource} from './contentSource.ts'
import {buildPermalink} from './permalink.ts'
import {getExecutionSignal} from './shared.ts'
import type {WebMcpUiBridge} from './tools.ts'

const textEncoder = new TextEncoder

const emptySchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

const getActiveInputTab = () => state.inputTabs.find(tab => tab.id === state.activeInputTabId) ?? state.inputTabs[0]!

export const createGuiTools = (getBridge: () => WebMcpUiBridge): Array<WebMCP.ModelContextTool> => [
  {
    name: 'inspect',
    title: 'Inspect UI',
    description: 'Get a compact description of the current Tok·Show UI state without reading the editor contents or detailed token results.',
    inputSchema: emptySchema,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: () => {
      const tab = getActiveInputTab()
      const visibleModels = getVisibleModelIds()
      return {
        editor: {
          activeTab: {
            id: tab.id,
            name: tab.name,
            type: tab.isBinary ? 'binary' : 'text',
            bytes: tab.isBinary ? tab.binaryData?.byteLength ?? 0 : textEncoder.encode(tab.text).byteLength,
            ...(tab.isBinary ? {} : {characters: tab.text.length}),
          },
          tabs: state.inputTabs.map(inputTab => ({
            id: inputTab.id,
            name: inputTab.name,
            active: inputTab.id === state.activeInputTabId,
            type: inputTab.isBinary ? 'binary' : 'text',
          })),
          monaco: state.useMonaco,
        },
        models: {
          focused: state.focusedId,
          visible: visibleModels,
          hidden: getHiddenModelIds(),
          entries: [...state.visibleEntries],
        },
        output: {
          tab: state.focusedId ? state.activeTab : 'preprocessed',
        },
        tokenization: {
          idle: isUiTokenizationIdle(),
          loadingModels: visibleModels.filter(modelId => state.modelStates[modelId].loading),
        },
      }
    },
  },
  {
    name: 'read_editor',
    title: 'Read editor',
    description: 'Read the complete contents of the editor currently visible in Tok·Show.',
    inputSchema: emptySchema,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: () => {
      const tab = getActiveInputTab()
      if (tab.isBinary) {
        const bytes = tab.binaryData ?? new Uint8Array
        return {
          type: 'binary',
          bytes: Array.from(bytes),
          byteLength: bytes.byteLength,
        }
      }
      return {
        type: 'text',
        text: tab.text,
        characters: tab.text.length,
        bytes: textEncoder.encode(tab.text).byteLength,
      }
    },
  },
  {
    name: 'read_results',
    title: 'Read results',
    description: 'Get the current token counts for the models visible in Tok·Show. If GUI tokenization is still pending or running, waits for the current UI state to become idle before reading results.',
    inputSchema: emptySchema,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: false,
    },
    execute: async (_input, options) => {
      const signal = getExecutionSignal(options)
      await waitForUiTokenizationIdle(signal)
      const visibleModels = getVisibleModelIds()
      return {
        counts: Object.fromEntries(visibleModels.map(modelId => [modelId, state.modelStates[modelId].tokenCount])),
        errors: Object.fromEntries(visibleModels.flatMap(modelId => {
          const error = state.modelStates[modelId].error
          return error ? [[modelId, error]] : []
        })),
        average: getAverageCount(),
      }
    },
  },
  {
    name: 'overwrite_editor',
    title: 'Overwrite editor',
    description: 'Replace the contents of the editor currently visible in Tok·Show with supplied text or the UTF-8 body fetched from a URL.',
    inputSchema: {
      type: 'object',
      properties: contentSourceProperties,
      ...contentSourceRequirement,
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      untrustedContentHint: true,
    },
    execute: async (input, options) => {
      const signal = getExecutionSignal(options)
      const content = await resolveContentSource(input, signal)
      const isPrimaryInput = state.activeInputTabId === 'input'
      updateActiveInputTab({
        text: content.text,
        isBinary: false,
        binaryData: null,
      })
      if (isPrimaryInput) {
        getBridge().setText(content.text)
      }
      return {
        source: content.source,
        characters: content.text.length,
        bytes: textEncoder.encode(content.text).byteLength,
      }
    },
  },
  {
    name: 'get_permalink',
    title: 'Get permalink',
    description: 'Get a permalink representing the current visible Tok·Show editor, model selection, focused model and editor mode.',
    inputSchema: emptySchema,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true,
    },
    execute: () => {
      if (state.isBinary) {
        throw new Error('The current binary editor contents cannot be represented by a Tok·Show permalink.')
      }
      return {
        url: buildPermalink({
          text: state.text,
          model: state.focusedId,
          models: getVisibleModelIds(),
          monaco: state.useMonaco,
        }),
      }
    },
  },
]
