import {useEffect, useSyncExternalStore} from 'react'

export type Theme = 'dark' | 'light'

const fallbackTheme: Theme = 'dark'
const darkAttribute = 'data-dark'
const lightAttribute = 'data-light'
const getSystemTheme = (): Theme => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : fallbackTheme
const getAttributeTheme = (): Theme | null => {
  if (typeof document === 'undefined') {
    return null
  }
  const {documentElement} = document
  const hasDark = documentElement.hasAttribute(darkAttribute)
  const hasLight = documentElement.hasAttribute(lightAttribute)
  if (hasDark === hasLight) {
    return null
  }
  return hasDark ? 'dark' : 'light'
}
export const setTheme = (theme: Theme) => {
  if (typeof document === 'undefined') {
    return
  }
  const {documentElement} = document
  documentElement.toggleAttribute(darkAttribute, theme === 'dark')
  documentElement.toggleAttribute(lightAttribute, theme === 'light')
  documentElement.style.colorScheme = theme
}
const hydrateTheme = () => {
  if (!getAttributeTheme()) {
    setTheme(getSystemTheme())
  }
}
const getSnapshot = (): Theme => getAttributeTheme() ?? getSystemTheme()
const getServerSnapshot = (): Theme => fallbackTheme
const subscribe = (callback: () => void) => {
  if (typeof document === 'undefined' || typeof matchMedia !== 'function' || typeof MutationObserver !== 'function') {
    return () => {}
  }
  const mq = matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', callback)
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributeFilter: [darkAttribute, lightAttribute],
    attributes: true,
  })
  return () => {
    mq.removeEventListener('change', callback)
    observer.disconnect()
  }
}
export const useTheme = (): Theme => {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useEffect(hydrateTheme, [])
  return theme
}
