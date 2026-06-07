import type {ModelId, TokenizeInput} from 'token-vocabs'

import {countLoaded, free, load, tokenizeLoaded} from 'token-vocabs'

export type TokenizationResult = {
  count: number
  offsets: Array<number>
  processedInput?: Uint8Array | string
  tokens: Array<number>
}

export default abstract class Model {
  id: ModelId
  initiallyVisible = false
  isLoaded = false
  isLoading = false
  lastError: Error | null = null
  abstract name: string
  subname: string | undefined

  constructor(id: ModelId) {
    this.id = id
  }

  get icon() {
    return `/${this.id}.svg`
  }

  async getTokenCount(input: TokenizeInput): Promise<number> {
    if (!this.isLoaded) {
      await this.load()
    }
    return this.getTokenCountSync(input)
  }

  getTokenCountSync(input: TokenizeInput): number {
    if (!this.isLoaded) {
      throw new Error(`Model ${this.id} is not loaded`)
    }
    try {
      return countLoaded(input, this.id)
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      throw this.lastError
    }
  }

  async load(): Promise<void> {
    if (this.isLoaded) {
      return
    }
    if (this.isLoading) {
      // Wait for existing load
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      return
    }
    this.isLoading = true
    this.lastError = null
    try {
      await load(this.id)
      this.isLoaded = true
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      throw this.lastError
    } finally {
      this.isLoading = false
    }
  }

  supportsInput(input: TokenizeInput): boolean {
    // Most tokenizers require valid UTF-8 for string-like, but Uint8Array may fail for some
    // We let the actual tokenize call fail and handle it in the UI
    return true
  }

  async tokenize(input: TokenizeInput): Promise<TokenizationResult> {
    if (!this.isLoaded) {
      await this.load()
    }
    return this.tokenizeSync(input)
  }

  tokenizeSync(input: TokenizeInput): TokenizationResult {
    if (!this.isLoaded) {
      throw new Error(`Model ${this.id} is not loaded`)
    }
    try {
      const result = tokenizeLoaded(input, this.id)
      return {
        tokens: result.tokens,
        offsets: result.offsets,
        count: result.tokens.length,
        processedInput: result.processedInput,
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      throw this.lastError
    }
  }

  unload(): void {
    if (this.isLoaded) {
      free(this.id)
      this.isLoaded = false
    }
    this.isLoading = false
  }
}
