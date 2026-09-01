import {describe, expect, test} from 'bun:test'

import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'

import vitePluginSvgable from '../src/main.ts'

type TestPluginContext = {
  emitted: Array<{name: string, source: string, type: 'asset'}>
  watched: Array<string>
  addWatchFile: (path: string) => void
  emitFile: (file: {name: string, source: string, type: 'asset'}) => string
}

const makeContext = (): TestPluginContext => {
  const context: TestPluginContext = {
    emitted: [],
    watched: [],
    addWatchFile(path) {
      this.watched.push(path)
    },
    emitFile(file) {
      this.emitted.push(file)
      return `asset${this.emitted.length}`
    },
  }
  return context
}

const callConfigResolved = (plugin: ReturnType<typeof vitePluginSvgable>, config: unknown) => {
  if (typeof plugin.configResolved !== 'function') {
    throw new TypeError('Expected configResolved hook to be a function.')
  }
  return (plugin.configResolved as (this: unknown, config: unknown) => unknown).call({}, config)
}

const callLoad = async (plugin: ReturnType<typeof vitePluginSvgable>, context: TestPluginContext, id: string) => {
  if (typeof plugin.load !== 'function') {
    throw new TypeError('Expected load hook to be a function.')
  }
  return await (plugin.load as unknown as (this: TestPluginContext, id: string) => unknown).call(context, id)
}

const readDefaultExport = (code: string) => {
  const expression = code.replace(/^export default /, '')
  return Function(`return (${expression})`)() as unknown
}

const withTempFolder = async <Result>(task: (folder: string) => Promise<Result>) => {
  const folder = await mkdtemp(join(tmpdir(), 'vite-plugin-svgable-'))
  try {
    return await task(folder)
  } finally {
    await rm(folder, {force: true, recursive: true})
  }
}

describe('vite-plugin-svgable', () => {
  test('exports a persisted SVG URL for static shape data in development', async () => {
    await withTempFolder(async folder => {
      const sourcePath = join(folder, 'logo.shape.yml')
      const outputDirectory = join(folder, 'svg')
      await writeFile(sourcePath, `shape: M0 0H1V1H0Z\nsize: 1\ncolor: '#123456'\n`)
      const plugin = vitePluginSvgable({outputDirectory})
      const context = makeContext()
      callConfigResolved(plugin, {
        command: 'serve',
        root: folder,
      })
      const code = await callLoad(plugin, context, `${sourcePath}?svgable`)
      expect(typeof code).toBe('string')
      const url = readDefaultExport(code as string)
      expect(url).toStartWith('/@fs/')
      expect(context.watched).toEqual([sourcePath])
      expect(context.emitted).toHaveLength(0)
      const outputPath = decodeURI((url as string).replace('/@fs/', ''))
      const svg = await readFile(outputPath, 'utf8')
      expect(svg).toContain('<svg')
      expect(svg).toContain('fill="#123456"')
    })
  })

  test('exports themed persisted SVG URLs when shape paths differ', async () => {
    await withTempFolder(async folder => {
      const sourcePath = join(folder, 'logo.shape.yml')
      const outputDirectory = join(folder, 'svg')
      await writeFile(sourcePath, `shape:\n  light: M0 0H1V1H0Z\n  dark: M0 0H2V2H0Z\nsize: 2\n`)
      const plugin = vitePluginSvgable({outputDirectory})
      const context = makeContext()
      callConfigResolved(plugin, {
        command: 'serve',
        root: folder,
      })
      const code = await callLoad(plugin, context, `${sourcePath}?svgable`)
      const urls = readDefaultExport(code as string) as Record<string, string>
      expect(Object.keys(urls).sort()).toEqual(['dark', 'light'])
      expect(urls.light).toContain('-light.')
      expect(urls.dark).toContain('-dark.')
      const lightSvg = await readFile(decodeURI(urls.light.replace('/@fs/', '')), 'utf8')
      const darkSvg = await readFile(decodeURI(urls.dark.replace('/@fs/', '')), 'utf8')
      expect(lightSvg).toContain('M0 0H1V1H0Z')
      expect(darkSvg).toContain('M0 0H2V2H0Z')
    })
  })

  test('emits Rollup asset URLs for production builds', async () => {
    await withTempFolder(async folder => {
      const sourcePath = join(folder, 'logo.shape.yml')
      const outputDirectory = join(folder, 'svg')
      await writeFile(sourcePath, `shape: M0 0H1V1H0Z\nsize: 1\n`)
      const plugin = vitePluginSvgable({outputDirectory})
      const context = makeContext()
      callConfigResolved(plugin, {
        command: 'build',
        root: folder,
      })
      const code = await callLoad(plugin, context, `${sourcePath}?svgable`)
      expect(code).toBe('export default import.meta.ROLLUP_FILE_URL_asset1')
      expect(context.emitted).toHaveLength(1)
      expect(context.emitted[0]?.name).toMatch(/^logo\.[a-f0-9]{12}\.svg$/)
      expect(context.emitted[0]?.source).toContain('<svg')
    })
  })

  test('exports an SVG file URL in development', async () => {
    await withTempFolder(async folder => {
      const sourcePath = join(folder, 'logo.svg')
      await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H1V1H0Z"/></svg>')
      const plugin = vitePluginSvgable()
      const context = makeContext()
      callConfigResolved(plugin, {
        command: 'serve',
        root: folder,
      })
      const code = await callLoad(plugin, context, `${sourcePath}?svgable`)
      const url = readDefaultExport(code as string)
      expect(url).toBe(`/@fs/${sourcePath.replaceAll('\\', '/')}`)
      expect(context.watched).toEqual([sourcePath])
      expect(context.emitted).toHaveLength(0)
    })
  })

  test('exports themed SVG file URLs from dark sidecars', async () => {
    await withTempFolder(async folder => {
      const sourcePath = join(folder, 'logo.svg')
      const darkPath = join(folder, 'logo.dark.svg')
      await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H1V1H0Z"/></svg>')
      await writeFile(darkPath, '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H2V2H0Z"/></svg>')
      const plugin = vitePluginSvgable()
      const context = makeContext()
      callConfigResolved(plugin, {
        command: 'serve',
        root: folder,
      })
      const code = await callLoad(plugin, context, `${sourcePath}?svgable`)
      const urls = readDefaultExport(code as string) as Record<string, string>
      expect(urls).toEqual({
        dark: `/@fs/${darkPath.replaceAll('\\', '/')}`,
        light: `/@fs/${sourcePath.replaceAll('\\', '/')}`,
      })
      expect(context.watched).toEqual([darkPath, sourcePath])
    })
  })

  test('exports themed SVG file URLs from light sidecars', async () => {
    await withTempFolder(async folder => {
      const sourcePath = join(folder, 'logo.svg')
      const lightPath = join(folder, 'logo.light.svg')
      await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H2V2H0Z"/></svg>')
      await writeFile(lightPath, '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H1V1H0Z"/></svg>')
      const plugin = vitePluginSvgable()
      const context = makeContext()
      callConfigResolved(plugin, {
        command: 'serve',
        root: folder,
      })
      const code = await callLoad(plugin, context, `${sourcePath}?svgable`)
      const urls = readDefaultExport(code as string) as Record<string, string>
      expect(urls).toEqual({
        dark: `/@fs/${sourcePath.replaceAll('\\', '/')}`,
        light: `/@fs/${lightPath.replaceAll('\\', '/')}`,
      })
      expect(context.watched).toEqual([sourcePath, lightPath])
    })
  })

  test('emits SVG files as Rollup assets for production builds', async () => {
    await withTempFolder(async folder => {
      const sourcePath = join(folder, 'logo.svg')
      const darkPath = join(folder, 'logo.dark.svg')
      await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H1V1H0Z"/></svg>')
      await writeFile(darkPath, '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H2V2H0Z"/></svg>')
      const plugin = vitePluginSvgable()
      const context = makeContext()
      callConfigResolved(plugin, {
        command: 'build',
        root: folder,
      })
      const code = await callLoad(plugin, context, `${sourcePath}?svgable`)
      expect(code).toBe('export default {light:import.meta.ROLLUP_FILE_URL_asset2,dark:import.meta.ROLLUP_FILE_URL_asset1}')
      expect(context.emitted).toEqual([
        {
          name: 'logo.dark.svg',
          source: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H2V2H0Z"/></svg>',
          type: 'asset',
        },
        {
          name: 'logo.svg',
          source: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0H1V1H0Z"/></svg>',
          type: 'asset',
        },
      ])
    })
  })
})
