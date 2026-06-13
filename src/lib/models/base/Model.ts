import type {ModelId, RawTokenizeResult, TokenizeInput} from 'token-vocabs'
import type {ComponentProps, FunctionComponent, ReactElement} from 'react'

import {createElement} from 'react'
import {free, load, tokenizeLoaded} from 'token-vocabs'

export type ModelIcon = FunctionComponent<ComponentProps<'svg'> & {
  desc?: string
  descId?: string
  title?: string
  titleId?: string
}>

export default abstract class Model {
  id: ModelId
  initiallyVisible = false
  loaded = false
  loadPromise: Promise<ModelId> | undefined
  abstract name: string
  subname: string | undefined
  abstract getIcon(): ReactElement

  constructor(id: ModelId) {
    this.id = id
  }

  protected renderIcon(Icon: ModelIcon) {
    return createElement(Icon)
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
