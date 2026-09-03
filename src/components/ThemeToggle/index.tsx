import type {FunctionComponent} from 'react'

import {FaMoon} from 'react-icons/fa6'
import {GrSun} from 'react-icons/gr'

import IconButton from '#component/IconButton'

import {setTheme, useTheme} from './useTheme.ts'

const ThemeToggle: FunctionComponent = () => {
  const theme = useTheme()
  const isDark = theme === 'dark'
  const handleClick = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
  }
  const title = `Switch to ${isDark ? 'light' : 'dark'} mode`
  const icon = isDark ? FaMoon : GrSun
  return <IconButton icon={icon} onClick={handleClick} title={title} />
}

export default ThemeToggle
