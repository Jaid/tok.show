import type {ClassValue} from 'clsx'
import type {ComponentProps, FunctionComponent} from 'react'

import clsx from 'clsx'
import {pick} from 'es-toolkit'

import {useTheme} from '#src/components/ThemeToggle/useTheme.ts'

import css from './style.module.sass'

type Theme = 'dark' | 'light'

type ThemedSource = Record<Theme, string>

type SvgSource = ThemedSource | string

type Props = {
  alt?: string
  className?: ClassValue
  defaultColorScheme?: Theme
  height?: ComponentProps<'img'>['height']
  imgClassName?: ClassValue
  imgProps?: Omit<ComponentProps<'img'>, 'alt' | 'className' | 'height' | 'src' | 'width'>
  pictureClassName?: ClassValue
  shouldUseTheme?: boolean
  src?: SvgSource
  width?: ComponentProps<'img'>['width']
}

const normalizeSvgSrc = (input: string) => {
  if (/^\s*<svg\s/i.test(input)) {
    const serializedInput = btoa(input)
    return `data:image/svg+xml;base64,${serializedInput}`
  }
  return input
}
const makePlaceholder = (theme: Theme) => {
  const fill = theme === 'light' ? 'black' : 'white'
  const placeHolder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${fill}"/></svg>`
  return placeHolder
}
const Svg: FunctionComponent<Props> = props => {
  const imgProps = {
    ...props.imgProps,
    ...pick(props, ['alt', 'height', 'width']),
  }
  let src = props.src
  if (!src) {
    src = {
      light: makePlaceholder('light'),
      dark: makePlaceholder('dark'),
    }
  }
  let isThemed = typeof src !== 'string'
  if (isThemed && (src as ThemedSource).light === (src as ThemedSource).dark) {
    src = (src as ThemedSource).dark
    isThemed = false
  }
  const shouldUseTheme = props.shouldUseTheme ?? true
  const theme = useTheme()
  if (shouldUseTheme) {
    if (isThemed) {
      src = (src as ThemedSource)[theme]
      isThemed = false
    }
  }
  if (!isThemed) {
    const className = clsx(css.element, props.className, props.imgClassName)
    const normalizedSrc = normalizeSvgSrc(src as string)
    return <img {...imgProps} src={normalizedSrc} className={className} />
  }
  const defaultColorScheme = props.defaultColorScheme || 'dark'
  const alternativeColorScheme = defaultColorScheme === 'light' ? 'dark' : 'light'
  const catcherQuery = `(prefers-color-scheme: ${alternativeColorScheme})`
  const catcherSrc = normalizeSvgSrc((src as ThemedSource)[alternativeColorScheme])
  const catcherElement = <source media={catcherQuery} srcSet={catcherSrc} />
  const defaultSrc = normalizeSvgSrc((src as ThemedSource)[defaultColorScheme])
  return <picture className={clsx(props.className, props.pictureClassName)}>
    {catcherElement}
    <img {...imgProps} src={defaultSrc} className={clsx(css.element, props.imgClassName)} />
  </picture>
}

export default Svg
