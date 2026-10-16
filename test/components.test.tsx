import {describe, expect, test} from 'bun:test'

import {renderToStaticMarkup} from 'react-dom/server'

import HexViewer from '#component/HexViewer'
import ModelProfile from '#component/ModelProfile'
import PulsatingNumber from '#component/PulsatingNumber'
import Svg from '#component/Svg'
import TokenizedText from '#component/TokenizedText'
import modelsMap from '#src/lib/models/index.ts'
import {encodeUtf8} from '#src/lib/tokenization.ts'
import {getTokenSpans} from '#src/lib/tokenSpans.ts'

const focusedModel = modelsMap.get('gpt')!
// Token boundaries are the byte offsets where every token but the first starts.
const renderTokenizedText = (input: string, boundaries: Array<number>) => {
  const spans = getTokenSpans({
    offsets: boundaries,
    originalInput: input,
    tokens: Array.from({length: boundaries.length + 1}, (_, index) => index),
  })
  return renderToStaticMarkup(<TokenizedText focusedModel={focusedModel} input={input} spans={spans} />)
}
describe('components', () => {
  test('PulsatingNumber splits large numbers into thousands chunks', () => {
    const html = renderToStaticMarkup(<PulsatingNumber value={12_345} />)
    expect(html).toContain('>12</span>')
    expect(html).toContain('>345</span>')
  })
  test('HexViewer renders offsets and byte values', () => {
    const html = renderToStaticMarkup(<HexViewer bytes={new Uint8Array([0, 10, 255])} />)
    expect(html).toContain('00000000')
    expect(html).toContain('>0a</span>')
    expect(html).toContain('>ff</span>')
  })
  test('Svg renders plain and themed sources', () => {
    expect(renderToStaticMarkup(<Svg alt='Static icon' src='/static.svg' />)).toContain('src="/static.svg"')
    const themedHtml = renderToStaticMarkup(<Svg
      className='icon' alt='Test icon' src={{
        dark: '/dark.svg',
        light: '/light.svg',
      }}
    />)
    expect(themedHtml).toMatch(/class="[^"]*\bicon\b[^"]*"/)
    expect(themedHtml).toContain('src="/dark.svg"')
    expect(themedHtml).toContain('alt="Test icon"')
  })
  test.each(['Variant', '0', '', undefined])('ModelProfile renders an optional subname: %j', subname => {
    const html = renderToStaticMarkup(<ModelProfile
      model={{
        icon: '/model.svg',
        name: 'Model name',
        subname,
        title: 'Model title',
      }}
    />)
    expect(html).toContain('src="/model.svg"')
    expect(html).toContain('<div class="name" title="Model title">Model name</div>')
    if (subname) {
      expect(html).toContain(`<div class="subname">${subname}</div>`)
    } else {
      expect(html).not.toContain('class="subname"')
    }
  })
  test.each(['\n', '\r\n'])('TokenizedText renders a real line break after the newline token %j', newline => {
    const html = renderTokenizedText(`${newline}X`, [encodeUtf8(newline).byteLength])
    expect(html).toContain('</span><br/><span')
  })
  test('TokenizedText renders byte-ranged non-ASCII spans as the original characters', () => {
    const html = renderTokenizedText('ÄÄ', [2])
    expect(html).toContain('>Ä</span><span')
    expect(html).not.toContain('ÄÄ')
    expect(html).not.toContain('␣')
  })
  test('TokenizedText falls back to plain text for binary input without spans', () => {
    const html = renderToStaticMarkup(<TokenizedText focusedModel={null} input={new Uint8Array([0x68, 0x69, 0xFF])} spans={[]} />)
    expect(html).toContain('hi\u{FFFD}')
  })
})
