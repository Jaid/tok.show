import type {FunctionComponent} from 'react'

import {FaMoon, FaSun} from 'react-icons/fa6'

import css from './style.module.sass'
import {setTheme, useTheme} from './useTheme.ts'

const ThemeToggle: FunctionComponent = () => {
  const theme = useTheme()
  const isDark = theme === 'dark'
  const handleClick = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
  }
  return <button className={css.button} onClick={handleClick} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
    {isDark ? <FaMoon/> : <FaSun/>}
  </button>
}

export default ThemeToggle
