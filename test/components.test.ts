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
  test('TokenizedText renders an actual line break after hex newline tokens', async () => {
    const cases = [
      {hexDisplay: '0a', input: '\nX', lineBreakByteEnd: 1, text: '\n'},
      {hexDisplay: '0d 0a', input: '\r\nX', lineBreakByteEnd: 2, text: '\r\n'},
    ]
    for (const tokenCase of cases) {
      const html = await render('TokenizedText', {
        focusedModel: {},
        input: tokenCase.input,
        spans: [
          {
            byteEnd: tokenCase.lineBreakByteEnd,
            byteStart: 0,
            hexDisplay: tokenCase.hexDisplay,
            id: 1,
            index: 0,
            isNonRepresentable: true,
            text: tokenCase.text,
          },
          {
            byteEnd: tokenCase.lineBreakByteEnd + 1,
            byteStart: tokenCase.lineBreakByteEnd,
            hexDisplay: null,
            id: 2,
            index: 1,
            isNonRepresentable: false,
            text: 'X',
          },
        ],
      })
      expect(html).toContain('</span><br/><span')
    }
  })
})
