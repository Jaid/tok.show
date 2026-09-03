import {createWebMcpTools} from './tools.ts'
import type {WebMcpUiBridge} from './tools.ts'

const noop = () => {}

export const registerWebMcp = async (getBridge: () => WebMcpUiBridge, signal: AbortSignal): Promise<() => void> => {
  const modelContext = globalThis.document?.modelContext
  if (!modelContext || signal.aborted) {
    return noop
  }

  const registrationController = new AbortController
  const abortRegistration = () => registrationController.abort(signal.reason)
  signal.addEventListener('abort', abortRegistration, {once: true})
  if (signal.aborted) {
    abortRegistration()
  }

  try {
    for (const tool of createWebMcpTools(getBridge)) {
      registrationController.signal.throwIfAborted()
      await modelContext.registerTool(tool, {signal: registrationController.signal})
    }
  } catch (error) {
    registrationController.abort(error)
    signal.removeEventListener('abort', abortRegistration)
    throw error
  }

  return () => {
    signal.removeEventListener('abort', abortRegistration)
    registrationController.abort()
  }
}
