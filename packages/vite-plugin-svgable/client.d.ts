type SvgableTheme = 'dark' | 'light'
type SvgableSource = Record<SvgableTheme, string> | string

declare module '*.shape.yml?svgable' {
  const source: SvgableSource
  export default source
}

declare module '*.shape.yaml?svgable' {
  const source: SvgableSource
  export default source
}

declare module '*.svg?svgable' {
  const source: SvgableSource
  export default source
}

export {}
