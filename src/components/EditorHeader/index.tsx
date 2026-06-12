import type {InputTab, InputTabId} from '#src/lib/state.ts'
import type {FunctionComponent} from 'react'

import clsx from 'clsx'
import {FaRegCopy} from 'react-icons/fa6'

import NumberDisplay from '#component/NumberDisplay'

import css from './style.module.sass'

type Props = {
  activeTabId: InputTabId
  binaryByteCount?: number | null
  charCount: number
  isBinary?: boolean
  onCopy: () => void
  onTabSelect: (id: InputTabId) => void
  sizeInBytes: number
  tabs: ReadonlyArray<InputTab>
}

const EditorHeader: FunctionComponent<Props> = ({tabs, activeTabId, sizeInBytes, charCount, isBinary, binaryByteCount, onCopy, onTabSelect}) => {
  return <div className={css.container}>
    <div className={css.tabs}>
      {tabs.map(tab => <button
        key={tab.id}
        className={clsx(css.tab, tab.id === activeTabId && css.activeTab)}
        onClick={() => onTabSelect(tab.id)}
        title={tab.name}
      >
        {tab.name}
      </button>)}
    </div>
    <span className={css.size}>
      {isBinary && binaryByteCount !== null && binaryByteCount !== undefined ? <NumberDisplay value={binaryByteCount} suffix="byte" suffixPlural /> : <><NumberDisplay value={sizeInBytes} suffix="byte" suffixPlural /> · <NumberDisplay value={charCount} suffix="char" suffixPlural /></>
      }
    </span>
    <button className={css.iconBtn} onClick={onCopy} title="Copy input"><FaRegCopy /></button>
  </div>
}

export default EditorHeader
