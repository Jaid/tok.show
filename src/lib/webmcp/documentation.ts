import {createGuiTools} from './guiTools.ts'
import {createHeadlessTools} from './headlessTools.ts'
import {modelIdSchema} from './shared.ts'

export type WebmcpToolGroup = 'GUI' | 'headless'

export type WebmcpToolDocumentation = {
  annotations?: WebMCP.ToolAnnotations
  description: string
  group: WebmcpToolGroup
  inputSchema: object
  name: string
  outputSchema: object
  title?: string
}

const emptyObjectSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

const contentSourceOutputSchema = {
  oneOf: [
    {
      type: 'object',
      properties: {type: {const: 'text'}},
      required: ['type'],
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        type: {const: 'url'},
        url: {type: 'string'},
      },
      required: ['type', 'url'],
      additionalProperties: false,
    },
  ],
} as const

const modelIdArraySchema = {
  type: 'array',
  items: modelIdSchema,
} as const

const errorMapSchema = {
  type: 'object',
  additionalProperties: {type: 'string'},
} as const

const guiOutputSchemas: Record<string, object> = {
  inspect: {
    type: 'object',
    properties: {
      editor: {
        type: 'object',
        properties: {
          activeTab: {
            type: 'object',
            properties: {
              id: {type: 'string'},
              name: {type: 'string'},
              type: {enum: ['binary', 'text']},
              bytes: {type: 'integer', minimum: 0},
              characters: {type: 'integer', minimum: 0},
            },
            required: ['id', 'name', 'type', 'bytes'],
            additionalProperties: false,
          },
          tabs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {type: 'string'},
                name: {type: 'string'},
                active: {type: 'boolean'},
                type: {enum: ['binary', 'text']},
              },
              required: ['id', 'name', 'active', 'type'],
              additionalProperties: false,
            },
          },
          monaco: {type: 'boolean'},
        },
        required: ['activeTab', 'tabs', 'monaco'],
        additionalProperties: false,
      },
      models: {
        type: 'object',
        properties: {
          focused: {oneOf: [modelIdSchema, {type: 'null'}]},
          visible: modelIdArraySchema,
          hidden: modelIdArraySchema,
          entries: {type: 'array', items: {type: 'string'}},
        },
        required: ['focused', 'visible', 'hidden', 'entries'],
        additionalProperties: false,
      },
      output: {
        type: 'object',
        properties: {tab: {enum: ['ids', 'preprocessed', 'tokenized', 'webmcp']}},
        required: ['tab'],
        additionalProperties: false,
      },
      tokenization: {
        type: 'object',
        properties: {
          idle: {type: 'boolean'},
          loadingModels: modelIdArraySchema,
        },
        required: ['idle', 'loadingModels'],
        additionalProperties: false,
      },
    },
    required: ['editor', 'models', 'output', 'tokenization'],
    additionalProperties: false,
  },
  read_editor: {
    oneOf: [
      {
        type: 'object',
        properties: {
          type: {const: 'text'},
          text: {type: 'string'},
          characters: {type: 'integer', minimum: 0},
          bytes: {type: 'integer', minimum: 0},
        },
        required: ['type', 'text', 'characters', 'bytes'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          type: {const: 'binary'},
          bytes: {type: 'array', items: {type: 'integer', minimum: 0, maximum: 255}},
          byteLength: {type: 'integer', minimum: 0},
        },
        required: ['type', 'bytes', 'byteLength'],
        additionalProperties: false,
      },
    ],
  },
  read_results: {
    type: 'object',
    properties: {
      counts: {type: 'object', additionalProperties: {type: 'number'}},
      errors: errorMapSchema,
      average: {type: ['number', 'null']},
    },
    required: ['counts', 'errors', 'average'],
    additionalProperties: false,
  },
  overwrite_editor: {
    type: 'object',
    properties: {
      source: contentSourceOutputSchema,
      characters: {type: 'integer', minimum: 0},
      bytes: {type: 'integer', minimum: 0},
    },
    required: ['source', 'characters', 'bytes'],
    additionalProperties: false,
  },
  get_permalink: {
    type: 'object',
    properties: {url: {type: 'string'}},
    required: ['url'],
    additionalProperties: false,
  },
}

const headlessOutputSchemas: Record<string, object> = {
  list_models: {
    type: 'object',
    properties: {
      models: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: modelIdSchema,
            name: {type: 'string'},
            subname: {type: ['string', 'null']},
            title: {type: 'string'},
            kind: {type: 'string'},
            encoding: {type: 'string'},
            openrouter: {type: 'string'},
            source: {type: 'object', additionalProperties: {type: 'string'}},
          },
          required: ['id', 'name', 'subname', 'title', 'kind', 'source'],
          additionalProperties: true,
        },
      },
    },
    required: ['models'],
    additionalProperties: false,
  },
  count_tokens: {
    type: 'object',
    properties: {
      source: contentSourceOutputSchema,
      counts: {type: 'object', additionalProperties: {type: 'integer', minimum: 0}},
      errors: errorMapSchema,
    },
    required: ['source', 'counts'],
    additionalProperties: false,
  },
  tokenize: {
    type: 'object',
    properties: {
      source: contentSourceOutputSchema,
      tokens: {type: 'object', additionalProperties: {type: 'array', items: {type: 'integer'}}},
      errors: errorMapSchema,
    },
    required: ['source', 'tokens'],
    additionalProperties: false,
  },
  create_spans: {
    type: 'object',
    properties: {
      source: contentSourceOutputSchema,
      spans: {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              start: {type: 'integer', minimum: 0},
              end: {type: 'integer', minimum: 0},
            },
            required: ['start', 'end'],
            additionalProperties: false,
          },
        },
      },
      spanInputs: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            {
              type: 'object',
              properties: {type: {const: 'original'}},
              required: ['type'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: {const: 'processed'},
                text: {type: 'string'},
              },
              required: ['type', 'text'],
              additionalProperties: false,
            },
          ],
        },
      },
      errors: errorMapSchema,
    },
    required: ['source', 'spans', 'spanInputs'],
    additionalProperties: false,
  },
  compare: {
    type: 'object',
    properties: {
      model: modelIdSchema,
      title: {type: 'string'},
      cases: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: {type: 'integer', minimum: 0},
            source: contentSourceOutputSchema,
            characters: {type: 'integer', minimum: 0},
            bytes: {type: 'integer', minimum: 0},
            tokens: {type: 'integer', minimum: 0},
            deltaFromFirst: {type: 'integer'},
            ratioToFirst: {type: ['number', 'null']},
          },
          required: ['index', 'source', 'characters', 'bytes', 'tokens', 'deltaFromFirst', 'ratioToFirst'],
          additionalProperties: false,
        },
      },
      summary: {
        type: 'object',
        properties: {
          minimum: {
            type: 'object',
            properties: {
              tokens: {type: 'integer', minimum: 0},
              cases: {type: 'array', items: {type: 'integer', minimum: 0}},
            },
            required: ['tokens', 'cases'],
            additionalProperties: false,
          },
          maximum: {
            type: 'object',
            properties: {
              tokens: {type: 'integer', minimum: 0},
              cases: {type: 'array', items: {type: 'integer', minimum: 0}},
            },
            required: ['tokens', 'cases'],
            additionalProperties: false,
          },
          spread: {type: 'integer', minimum: 0},
        },
        required: ['minimum', 'maximum', 'spread'],
        additionalProperties: false,
      },
    },
    required: ['model', 'title', 'cases', 'summary'],
    additionalProperties: false,
  },
  create_permalink: {
    type: 'object',
    properties: {
      source: contentSourceOutputSchema,
      url: {type: 'string'},
    },
    required: ['source', 'url'],
    additionalProperties: false,
  },
}

const documentTools = (group: WebmcpToolGroup, tools: ReadonlyArray<WebMCP.ModelContextTool>, outputSchemas: Record<string, object>): Array<WebmcpToolDocumentation> => tools.map(tool => {
  const outputSchema = outputSchemas[tool.name]
  if (!outputSchema) {
    throw new Error('Missing WebMCP output schema documentation for \u201C' + tool.name + '\u201D.')
  }
  return {
    annotations: tool.annotations,
    description: tool.description,
    group,
    inputSchema: tool.inputSchema ?? emptyObjectSchema,
    name: tool.name,
    outputSchema,
    title: tool.title,
  }
})

const documentationBridge = () => ({setText: (_value: string) => {}})

export const webmcpToolDocumentation = [
  ...documentTools('GUI', createGuiTools(documentationBridge), guiOutputSchemas),
  ...documentTools('headless', createHeadlessTools(), headlessOutputSchemas),
]
