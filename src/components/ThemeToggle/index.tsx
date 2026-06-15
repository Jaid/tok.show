import type {FunctionComponent} from 'react'

import {FaMoon, FaSun} from 'react-icons/fa6'

import {setTheme, useTheme} from './useTheme.ts'

import css from './style.module.sass'

const ThemeToggle: FunctionComponent = () => {
  const theme = useTheme()
  const isDark = theme === 'dark'
  const handleClick = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
  }
  const title = `Switch to ${isDark ? 'light' : 'dark'} mode`
  const icon = isDark ? <FaMoon/> : <FaSun/>
  return <button className={css.button} onClick={handleClick} title={title}>
    {icon}
  </button>
}

export default ThemeToggle
