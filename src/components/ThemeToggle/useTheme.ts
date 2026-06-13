import {useEffect, useSyncExternalStore} from 'react'

export type Theme = 'dark' | 'light'

const darkAttribute = 'data-dark'
const lightAttribute = 'data-light'
const getSystemTheme = (): Theme => matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
const getAttributeTheme = (): Theme | null => {
  const {documentElement} = document
  const hasDark = documentElement.hasAttribute(darkAttribute)
  const hasLight = documentElement.hasAttribute(lightAttribute)
  if (hasDark === hasLight) {
    return null
  }
  return hasDark ? 'dark' : 'light'
}
export const setTheme = (theme: Theme) => {
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
const getSnapshot = () => getAttributeTheme() ?? getSystemTheme()
const subscribe = (callback: () => void) => {
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
export const useTheme = () => {
  const theme = useSyncExternalStore(subscribe, getSnapshot)
  useEffect(hydrateTheme, [])
  return theme
}
