import type {ColorOptions, Options as ShapeToSvgOptions, ThemedColor} from 'shape-to-svg'
import type {Plugin, ResolvedConfig} from 'vite'

import {createHash} from 'node:crypto'
import {access, mkdir, readFile, writeFile} from 'node:fs/promises'
import {basename, dirname, extname, isAbsolute, join, relative, resolve} from 'node:path'

import shapeToSvg from 'shape-to-svg'
import {parse as parseYaml} from 'yaml'

type Theme = 'dark' | 'light'

type PluginConfig = Pick<ResolvedConfig, 'command' | 'root'>

type SvgablePluginOptions = {
  outputDirectory?: string
}

type SvgableRequest = {
  path: string
}

type SvgablePluginContext = {
  addWatchFile: (path: string) => void
  emitFile: (emittedFile: {name: string
    source: string
    type: 'asset'}) => string
}

type ThemedValue<T> = Record<Theme, T>

type ShapeData = {
  color: ThemedValue<string> | undefined
  path: ThemedValue<string>
  size: SvgSizeOptions
}

type SvgSizeOptions = Pick<ShapeToSvgOptions, 'height' | 'size' | 'viewbox' | 'width'>

const defaultOutputDirectory = 'out/svg'
const shapeSuffixPattern = /\.shape$/i
const svgExtensionPattern = /\.svg$/i
const svgableQueryPattern = /(?:^|[&?])svgable(?:&|$)/
const themes = ['light', 'dark'] as const
const defaultShapeColor: ThemedValue<string> = {
  light: 'black',
  dark: 'white',
}
const isRecord = (input: unknown): input is Record<string, unknown> => {
  return Boolean(input) && typeof input === 'object' && !Array.isArray(input)
}
const toPosixPath = (path: string) => path.replaceAll('\\', '/')
const normalizeFilePath = (path: string) => toPosixPath(path)
const getHash = (input: string) => {
  return createHash('sha256').update(input).digest('hex').slice(0, 12)
}
const isSvgPath = (path: string) => svgExtensionPattern.test(path)
const getSvgSidecarPath = (path: string, theme: Theme) => {
  const extension = extname(path)
  const baseName = basename(path, extension)
  return join(dirname(path), `${baseName}.${theme}${extension}`)
}
const exists = async (path: string) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
const isSvgableRequest = (id: string) => svgableQueryPattern.test(id)
const parseSvgableRequest = (id: string): SvgableRequest | undefined => {
  if (!isSvgableRequest(id)) {
    return
  }
  const [path] = id.split('?', 1)
  if (!path) {
    return
  }
  return {path}
}
const readStringProperty = (data: Record<string, unknown>, key: string, label: string) => {
  const value = data[key]
  if (typeof value !== 'string') {
    throw new TypeError(`SVGable option “${label}” must be a string.`)
  }
  const trimmedValue = value.trim()
  if (!trimmedValue) {
    throw new TypeError(`SVGable option “${label}” must be a non-empty string.`)
  }
  return trimmedValue
}
const readThemedStringProperty = (data: Record<string, unknown>, theme: Theme, label: string, alias?: string) => {
  const keys = [...new Set([alias, theme].filter(Boolean))]
  const key = keys.find(key => data[key] !== undefined)
  if (!key) {
    throw new TypeError(`SVGable option “${label}” must define “${keys.join('” or “')}”.`)
  }
  return readStringProperty(data, key, `${label}.${key}`)
}
const normalizeThemedString = (input: unknown, label: string, aliases?: Partial<Record<Theme, string>>) => {
  if (typeof input === 'string') {
    const value = input.trim()
    if (!value) {
      throw new TypeError(`SVGable option “${label}” must be a non-empty string.`)
    }
    return {
      dark: value,
      light: value,
    } satisfies ThemedValue<string>
  }
  if (!isRecord(input)) {
    throw new TypeError(`SVGable option “${label}” must be a string or a themed object.`)
  }
  return Object.fromEntries(themes.map(theme => {
    return [theme, readThemedStringProperty(input, theme, label, aliases?.[theme])]
  })) as ThemedValue<string>
}
const normalizeOptionalThemedString = (input: unknown, label: string, aliases?: Partial<Record<Theme, string>>) => {
  if (input === undefined) {
    return
  }
  return normalizeThemedString(input, label, aliases)
}
const getSourceValue = (data: Record<string, unknown>, keys: Array<string>, label: string) => {
  const key = keys.find(key => data[key] !== undefined)
  if (!key) {
    throw new TypeError(`SVGable data must define “${label}”.`)
  }
  return data[key]
}
const readPositiveNumberProperty = (data: Record<string, unknown>, key: string, label: string) => {
  const value = data[key]
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`SVGable option “${label}” must be a positive finite number.`)
  }
  return value
}
const normalizeSize = (data: Record<string, unknown>): SvgSizeOptions => {
  const hasViewbox = data.viewbox !== undefined || data.viewBox !== undefined
  const hasSize = data.size !== undefined
  const hasRectangle = data.width !== undefined || data.height !== undefined
  const sizeModeCount = Number(hasViewbox) + Number(hasSize) + Number(hasRectangle)
  if (sizeModeCount === 0) {
    return {}
  }
  if (sizeModeCount > 1) {
    throw new TypeError('SVGable data can only define one viewBox mode: “size”, “viewbox” or “width” + “height”.')
  }
  if (hasViewbox) {
    const viewboxKey = data.viewbox === undefined ? 'viewBox' : 'viewbox'
    return {viewbox: readStringProperty(data, viewboxKey, viewboxKey)}
  }
  if (hasSize) {
    return {size: readPositiveNumberProperty(data, 'size', 'size')}
  }
  return {
    width: readPositiveNumberProperty(data, 'width', 'width'),
    height: readPositiveNumberProperty(data, 'height', 'height'),
  }
}
const normalizeShapeData = (input: unknown): ShapeData => {
  if (!isRecord(input)) {
    throw new TypeError('SVGable data must be an object.')
  }
  const path = normalizeThemedString(getSourceValue(input, ['shape', 'path'], 'shape'), 'shape')
  const color = normalizeOptionalThemedString(input.color, 'color', {
    dark: 'onDark',
    light: 'onLight',
  }) ?? defaultShapeColor
  const size = normalizeSize(input)
  return {
    color,
    path,
    size,
  }
}
const makeThemedColor = (color: ThemedValue<string> | undefined) => {
  if (!color) {
    return
  }
  if (color.dark === color.light) {
    return color.light
  }
  return {
    onDark: color.dark,
    onLight: color.light,
  } satisfies ThemedColor
}
const makeStaticColor = (color: ThemedValue<string> | undefined, theme: Theme) => {
  if (!color) {
    return
  }
  return color[theme]
}
const makeSvg = (data: ShapeData, theme?: Theme) => {
  const input = {
    ...data.size,
    color: theme ? makeStaticColor(data.color, theme) : makeThemedColor(data.color),
    path: theme ? data.path[theme] : data.path.light,
  }
  return shapeToSvg(input as ShapeToSvgOptions & ColorOptions)
}
const makePersistedFileName = (sourcePath: string, root: string, svg: string, theme?: Theme) => {
  const relativePath = normalizeFilePath(relative(root, sourcePath))
  const extension = extname(sourcePath)
  const sourceBaseName = basename(sourcePath, extension).replace(shapeSuffixPattern, '')
  const themeSuffix = theme ? `-${theme}` : ''
  const hash = getHash(`${relativePath}\0${theme ?? ''}\0${svg}`)
  return `${sourceBaseName}${themeSuffix}.${hash}.svg`
}
const resolveOutputDirectory = (config: PluginConfig, outputDirectory: string) => {
  if (isAbsolute(outputDirectory)) {
    return outputDirectory
  }
  return resolve(config.root, outputDirectory)
}
const persistSvg = async (config: PluginConfig, outputDirectory: string, sourcePath: string, svg: string, theme?: Theme) => {
  const fileName = makePersistedFileName(sourcePath, config.root, svg, theme)
  const outputPath = join(resolveOutputDirectory(config, outputDirectory), fileName)
  await mkdir(resolveOutputDirectory(config, outputDirectory), {recursive: true})
  await writeFile(outputPath, svg)
  return {
    fileName,
    outputPath,
  }
}
const makeDevUrl = (path: string) => {
  return encodeURI(`/@fs/${normalizeFilePath(path)}`)
}
const makeBuildUrl = (referenceId: string) => {
  return `import.meta.ROLLUP_FILE_URL_${referenceId}`
}
const makeDefaultExport = (value: Record<Theme, string> | string) => {
  if (typeof value === 'string') {
    return `export default ${value}`
  }
  return `export default {light:${value.light},dark:${value.dark}}`
}
const makeCodeForSvg = async (context: SvgablePluginContext, config: PluginConfig, outputDirectory: string, sourcePath: string, svg: string, theme?: Theme) => {
  const persistedSvg = await persistSvg(config, outputDirectory, sourcePath, svg, theme)
  if (config.command === 'serve') {
    return JSON.stringify(makeDevUrl(persistedSvg.outputPath))
  }
  const referenceId = context.emitFile({
    name: persistedSvg.fileName,
    source: svg,
    type: 'asset',
  })
  return makeBuildUrl(referenceId)
}
const makeCodeForSvgFile = async (context: SvgablePluginContext, config: PluginConfig, sourcePath: string) => {
  context.addWatchFile(sourcePath)
  if (config.command === 'serve') {
    return JSON.stringify(makeDevUrl(sourcePath))
  }
  const source = await readFile(sourcePath, 'utf8')
  const referenceId = context.emitFile({
    name: basename(sourcePath),
    source,
    type: 'asset',
  })
  return makeBuildUrl(referenceId)
}
const loadSvgFileModule = async (context: SvgablePluginContext, config: PluginConfig, request: SvgableRequest) => {
  const darkSidecarPath = getSvgSidecarPath(request.path, 'dark')
  if (await exists(darkSidecarPath)) {
    return makeDefaultExport({
      dark: await makeCodeForSvgFile(context, config, darkSidecarPath),
      light: await makeCodeForSvgFile(context, config, request.path),
    })
  }
  const lightSidecarPath = getSvgSidecarPath(request.path, 'light')
  if (await exists(lightSidecarPath)) {
    return makeDefaultExport({
      dark: await makeCodeForSvgFile(context, config, request.path),
      light: await makeCodeForSvgFile(context, config, lightSidecarPath),
    })
  }
  const value = await makeCodeForSvgFile(context, config, request.path)
  return makeDefaultExport(value)
}
const loadShapeModule = async (context: SvgablePluginContext, config: PluginConfig, outputDirectory: string, request: SvgableRequest) => {
  context.addWatchFile(request.path)
  const source = await readFile(request.path, 'utf8')
  const shapeData = normalizeShapeData(parseYaml(source))
  if (shapeData.path.light === shapeData.path.dark && shapeData.color?.light === shapeData.color?.dark) {
    const svg = makeSvg(shapeData)
    const value = await makeCodeForSvg(context, config, outputDirectory, request.path, svg)
    return makeDefaultExport(value)
  }
  const themedEntries = await Promise.all(themes.map(async theme => {
    const svg = makeSvg(shapeData, theme)
    const value = await makeCodeForSvg(context, config, outputDirectory, request.path, svg, theme)
    return [theme, value] as const
  }))
  return makeDefaultExport(Object.fromEntries(themedEntries) as Record<Theme, string>)
}
const loadSvgableModule = async (context: SvgablePluginContext, config: PluginConfig, outputDirectory: string, request: SvgableRequest) => {
  if (isSvgPath(request.path)) {
    return loadSvgFileModule(context, config, request)
  }
  return loadShapeModule(context, config, outputDirectory, request)
}

export const svgablePlugin = (options: SvgablePluginOptions = {}): Plugin => {
  const outputDirectory = options.outputDirectory ?? defaultOutputDirectory
  let config: PluginConfig | undefined
  return {
    enforce: 'pre',
    name: 'svgable',
    configResolved(resolvedConfig) {
      config = {
        command: resolvedConfig.command,
        root: resolvedConfig.root,
      }
    },
    async load(id) {
      const request = parseSvgableRequest(id)
      if (!request) {
        return
      }
      if (!config) {
        throw new Error('SVGable plugin config has not been resolved.')
      }
      return loadSvgableModule(this, config, outputDirectory, request)
    },
  }
}

export default svgablePlugin
