import type {ModelId, RawTokenizeResult, TokenizeInput} from 'token-vocabs'

import {free, load, models, tokenizeLoaded} from 'token-vocabs'

export type ModelIconTheme = 'dark' | 'light'
export type ModelIcon = Record<ModelIconTheme, string> | string

const compactNameOverrides: Partial<Record<ModelId, string>> = {
  sdxl: 'SDXL',
}

export default abstract class Model {
  abstract icon: ModelIcon
  id: ModelId
  initiallyVisible = false
  loaded = false
  loadPromise: Promise<ModelId> | undefined
  get title() {
    return models[this.id].title
  }

  get name() {
    const override = compactNameOverrides[this.id]
    if (override) {
      return override
    }
    const prefix = this.title.slice(0, this.id.length)
    return prefix.toLowerCase() === this.id ? prefix : this.id
  }

  get subname() {
    if (compactNameOverrides[this.id]) {
      return undefined
    }
    return this.title.slice(this.name.length).replace(/^[\s-]+/, '') || undefined
  }

  constructor(id: ModelId) {
    this.id = id
  }

  async load() {
    if (this.loaded) {
      return this.id
    }
    this.loadPromise ??= load(this.id).then(modelId => {
      this.loaded = true
      return modelId
    }).finally(() => {
      this.loadPromise = undefined
    })
    return this.loadPromise
  }

  tokenize(input: TokenizeInput): RawTokenizeResult {
    if (!this.loaded) {
      throw new Error(`Model “${this.id}” is not loaded.`)
    }
    return tokenizeLoaded(input, this.id)
  }

  unload() {
    free(this.id)
    this.loaded = false
    this.loadPromise = undefined
  }
}
