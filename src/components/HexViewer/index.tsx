import {bytesToHexPairs} from '#src/lib/tokenization.ts'

import css from './style.module.sass'

type HexViewerProperties = {
  bytes: Uint8Array
}

export default function HexViewer({bytes}: HexViewerProperties) {
  const rows: Array<Uint8Array> = []
  for (let index = 0; index < bytes.length; index += 16) {
    rows.push(bytes.slice(index, index + 16))
  }
  return <div aria-label='read-only hex viewer' className={css.viewer} role='textbox' aria-readonly='true'>
    {rows.map((row, rowIndex) => <div className={css.row} key={rowIndex}>
      <span className={css.offset}>{(rowIndex * 16).toString(16).padStart(8, '0')}</span>
      <span className={css.hex}>{bytesToHexPairs(row).map((pair, pairIndex) => <span className={css.byte} key={pairIndex}>{pair}</span>)}</span>
    </div>)}
  </div>
}
