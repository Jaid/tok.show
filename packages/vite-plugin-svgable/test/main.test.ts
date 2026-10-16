import type {Plugin} from 'vite'

import {describe, expect, test} from 'bun:test'
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import svgablePlugin from '../src/main.ts'

type EmittedFile = {
  name: string
  source: string
  type: 'asset'
}

type LoadHook = (this: unknown, id: string) => Promise<string | undefined>
type ConfigResolvedHook = (this: unknown, config: unknown) => void

const square = (size: number) => `M0 0H${size}V${size}H0Z`
const svgFile = (size: number) => `<svg xmlns="http://www.w3.org/2000/svg"><path d="${square(size)}"/></svg>`
const toDevUrl = (path: string) => `/@fs/${path.replaceAll('\\', '/')}`
const readDevUrl = (url: string) => readFile(decodeURI(url.replace('/@fs/', '')), 'utf8')
const evaluateDefaultExport = (code: string) => {
  const evaluate = new Function(`return (${code.replace(/^export default /, '')})`) as () => unknown
  return evaluate()
}
const createFixture = async (command: 'build' | 'serve', files: Record<string, string>) => {
  const folder = await mkdtemp(join(tmpdir(), 'vite-plugin-svgable-'))
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(folder, name), content)
  }
  const plugin: Plugin = svgablePlugin({outputDirectory: join(folder, 'svg')})
  const configResolved = plugin.configResolved as ConfigResolvedHook
  configResolved.call({}, {
    command,
    root: folder,
  })
  const emitted: Array<EmittedFile> = []
  const watched: Array<string> = []
  const context = {
    addWatchFile: (path: string) => watched.push(path),
    emitFile: (file: EmittedFile) => `asset${emitted.push(file)}`,
  }
  const load = async (name: string) => {
    const loadHook = plugin.load as LoadHook
    const code = await loadHook.call(context, `${join(folder, name)}?svgable`)
    expect(code).toBeString()
    return code!
  }
  return {
    emitted,
    load,
    path: (name: string) => join(folder, name),
    watched,
    [Symbol.asyncDispose]: () => rm(folder, {
      force: true,
      recursive: true,
    }),
  }
}
describe('vite-plugin-svgable shapes', () => {
  test('exports a persisted SVG URL for static shape data in development', async () => {
    await using fixture = await createFixture('serve', {'logo.shape.yml': `shape: ${square(1)}\nsize: 1\ncolor: '#123456'\n`})
    const url = evaluateDefaultExport(await fixture.load('logo.shape.yml')) as string
    expect(url).toStartWith('/@fs/')
    expect(fixture.watched).toEqual([fixture.path('logo.shape.yml')])
    expect(fixture.emitted).toHaveLength(0)
    const svg = await readDevUrl(url)
    expect(svg).toContain('<svg')
    expect(svg).toContain('fill="#123456"')
  })
  test('exports themed persisted SVG URLs when shape paths differ', async () => {
    await using fixture = await createFixture('serve', {'logo.shape.yml': `shape:\n  light: ${square(1)}\n  dark: ${square(2)}\nsize: 2\n`})
    const urls = evaluateDefaultExport(await fixture.load('logo.shape.yml')) as Record<'dark' | 'light', string>
    expect(Object.keys(urls).toSorted()).toEqual(['dark', 'light'])
    expect(urls.light).toContain('-light.')
    expect(urls.dark).toContain('-dark.')
    expect(await readDevUrl(urls.light)).toContain(square(1))
    expect(await readDevUrl(urls.dark)).toContain(square(2))
  })
  test('emits Rollup asset URLs for production builds', async () => {
    await using fixture = await createFixture('build', {'logo.shape.yml': `shape: ${square(1)}\nsize: 1\ncolor: '#123456'\n`})
    expect(await fixture.load('logo.shape.yml')).toBe('export default import.meta.ROLLUP_FILE_URL_asset1')
    expect(fixture.emitted).toHaveLength(1)
    expect(fixture.emitted[0]?.name).toMatch(/^logo\.[\da-f]{12}\.svg$/)
    expect(fixture.emitted[0]?.source).toContain('fill="#123456"')
  })
  test('defaults uncolored shapes to black and white theme assets', async () => {
    await using fixture = await createFixture('build', {'logo.shape.yml': `shape: ${square(1)}\nsize: 1\n`})
    expect(await fixture.load('logo.shape.yml')).toBe('export default {light:import.meta.ROLLUP_FILE_URL_asset1,dark:import.meta.ROLLUP_FILE_URL_asset2}')
    expect(fixture.emitted).toHaveLength(2)
    expect(fixture.emitted[0]?.source).toContain('fill="black"')
    expect(fixture.emitted[1]?.source).toContain('fill="white"')
    for (const file of fixture.emitted) {
      expect(file.source).not.toContain('currentColor')
    }
  })
})
describe('vite-plugin-svgable SVG files', () => {
  test('exports an SVG file URL in development', async () => {
    await using fixture = await createFixture('serve', {'logo.svg': svgFile(1)})
    expect(evaluateDefaultExport(await fixture.load('logo.svg'))).toBe(toDevUrl(fixture.path('logo.svg')))
    expect(fixture.watched).toEqual([fixture.path('logo.svg')])
    expect(fixture.emitted).toHaveLength(0)
  })
  test.each([
    ['dark', 'logo.dark.svg', 'logo.svg'],
    ['light', 'logo.svg', 'logo.light.svg'],
  ])('exports themed SVG file URLs from %s sidecars', async (sidecarTheme, darkName, lightName) => {
    const sidecarName = sidecarTheme === 'dark' ? darkName : lightName
    await using fixture = await createFixture('serve', {
      'logo.svg': svgFile(1),
      [sidecarName]: svgFile(2),
    })
    expect(evaluateDefaultExport(await fixture.load('logo.svg'))).toEqual({
      dark: toDevUrl(fixture.path(darkName)),
      light: toDevUrl(fixture.path(lightName)),
    })
    expect(fixture.watched).toEqual([fixture.path(darkName), fixture.path(lightName)])
  })
  test('emits SVG files as Rollup assets for production builds', async () => {
    await using fixture = await createFixture('build', {
      'logo.svg': svgFile(1),
      'logo.dark.svg': svgFile(2),
    })
    expect(await fixture.load('logo.svg')).toBe('export default {light:import.meta.ROLLUP_FILE_URL_asset2,dark:import.meta.ROLLUP_FILE_URL_asset1}')
    expect(fixture.emitted).toEqual([
      {
        name: 'logo.dark.svg',
        source: svgFile(2),
        type: 'asset',
      },
      {
        name: 'logo.svg',
        source: svgFile(1),
        type: 'asset',
      },
    ])
  })
})
