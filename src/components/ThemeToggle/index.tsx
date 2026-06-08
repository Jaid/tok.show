import type {FunctionComponent} from 'react'

import {useCallback, useSyncExternalStore} from 'react'
import {FaMoon, FaSun} from 'react-icons/fa6'

import css from './style.module.sass'

const getSnapshot = () => document.documentElement.dataset.colorScheme ?? 'dark'
const subscribe = (callback: () => void) => {
  const mq = matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}
const ThemeToggle: FunctionComponent = () => {
  const scheme = useSyncExternalStore(subscribe, getSnapshot)
  const isDark = scheme === 'dark'
  const handleClick = useCallback(() => {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.style.colorScheme = next
    document.documentElement.dataset.colorScheme = next
  }, [isDark])
  return <button className={css.button} onClick={handleClick} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
    {isDark ? <FaMoon/> : <FaSun/>}
  </button>
}

export default ThemeToggle
