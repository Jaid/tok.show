import {describe, expect, test} from 'bun:test'

import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

import {SassModulePlugin} from './lib/sassModulesPlugin.js'

Bun.plugin(SassModulePlugin)
async function render(componentSegment: string, props?: Record<string, unknown>) {
  const Component = (await import(`#src/components/${componentSegment}/index.tsx`)).default
  const element = createElement(Component, props)
  return renderToStaticMarkup(element)
}
describe('components', () => {
  test('PulsatingNumber renders known count', async () => {
    const html = await render('PulsatingNumber', {value: 12_345})
    expect(html).toContain('12')
    expect(html).toContain('345')
  })
  test('HexViewer renders offsets and byte values', async () => {
    const html = await render('HexViewer', {bytes: new Uint8Array([0, 10, 255])})
    expect(html).toContain('00000000')
    expect(html).toContain('ff')
  })
})
