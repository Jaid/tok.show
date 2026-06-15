import type {InputTab, InputTabId} from '#src/lib/state.ts'
import type {FunctionComponent} from 'react'

import {FaRegCopy} from 'react-icons/fa6'

import NumberDisplay from '#component/NumberDisplay'
import PulsatingNumber from '#component/PulsatingNumber'
import {Tab, TabbedView} from '#component/TabbedView'

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
  const needsBinaryBytesDisplay = isBinary && binaryByteCount
  const binaryBytesDisplay = needsBinaryBytesDisplay ? <NumberDisplay value={binaryByteCount} suffix="byte" suffixPlural /> : undefined
  const needsUtfBytesDisplay = !isBinary && sizeInBytes && sizeInBytes !== charCount
  const utfBytesDisplay = needsUtfBytesDisplay ? <PulsatingNumber value={sizeInBytes} suffix="byte" suffixPlural /> : undefined
  const needsCharsDisplay = !isBinary && charCount
  const charsDisplay = needsCharsDisplay ? <PulsatingNumber value={charCount} suffix="character" suffixPlural /> : undefined
  const decoration = <>
    {binaryBytesDisplay}
    {utfBytesDisplay}
    {charsDisplay}
    <button className={css.iconBtn} onClick={onCopy} title="Copy input"><FaRegCopy /></button>
  </>
  return <TabbedView activeTabKey={activeTabId} decoration={decoration} onTabChange={onTabSelect}>
    {tabs.map(tab => <Tab key={tab.id} title={tab.name}>{tab.name}</Tab>)}
  </TabbedView>
}

export default EditorHeader
