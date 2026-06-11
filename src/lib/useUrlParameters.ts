import {useCallback, useMemo, useState} from 'react'

type UrlParameters = {
  model: string
  models: string
  monaco: boolean
  text: string
}

type UrlParameterName = keyof UrlParameters

const defaults: UrlParameters = {
  model: 'gpt',
  models: 'gpt,deepseek',
  monaco: true,
  text: '',
}

const parseBoolean = (value: string | null): boolean => {
  if (value === null) {
    return defaults.monaco
  }
  return value !== 'false'
}

const readUrlParameters = (): UrlParameters => {
  if (globalThis.window === undefined) {
    return defaults
  }
  const params = new URLSearchParams(globalThis.location.search)
  return {
    text: params.get('text') ?? defaults.text,
    model: params.get('model') ?? defaults.model,
    monaco: parseBoolean(params.get('monaco')),
    models: params.get('models') ?? defaults.models,
  }
}

export function useUrlParameters() {
  const [parameters, setParameters] = useState<UrlParameters>(readUrlParameters)
  const setParameter = useCallback(<Name extends UrlParameterName>(name: Name, value: UrlParameters[Name]) => {
    setParameters(current => ({
      ...current,
      [name]: value,
    }))
  }, [])
  const shareUrl = useMemo(() => {
    if (globalThis.window === undefined) {
      return '#'
    }
    const url = new URL(globalThis.location.href)
    url.search = ''
    url.searchParams.set('text', parameters.text)
    url.searchParams.set('model', parameters.model)
    url.searchParams.set('models', parameters.models)
    url.searchParams.set('monaco', String(parameters.monaco))
    return url.toString()
  }, [parameters])
  return {
    ...parameters,
    setModel: useCallback((value: string) => setParameter('model', value), [setParameter]),
    setModels: useCallback((value: string) => setParameter('models', value), [setParameter]),
    setMonaco: useCallback((value: boolean) => setParameter('monaco', value), [setParameter]),
    setText: useCallback((value: string) => setParameter('text', value), [setParameter]),
    shareUrl,
  }
}
