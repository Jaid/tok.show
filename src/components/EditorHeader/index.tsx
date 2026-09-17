import type {InputTab, InputTabId} from '#src/lib/state.ts'
import type {FunctionComponent} from 'react'

import IconButton from '#component/IconButton'
import NumberDisplay from '#component/NumberDisplay'
import PulsatingNumber from '#component/PulsatingNumber'
import Svg from '#component/Svg'
import {Tab, TabbedView} from '#component/TabbedView'
import textIcon from '#root/node_modules/material-icon-theme/icons/prompt.svg'
import {useStage} from '#src/lib/useStage.ts'

import css from './style.module.sass'

type Props = {
  activeTabId: InputTabId
  binaryByteCount?: number | null
  charCount: number
  isBinary?: boolean
  onClear: () => void
  onCopy: () => void
  onTabSelect: (id: InputTabId) => void
  sizeInBytes: number
  tabs: ReadonlyArray<InputTab>
}

const EditorHeader: FunctionComponent<Props> = ({tabs, activeTabId, sizeInBytes, charCount, isBinary, binaryByteCount, onClear, onCopy, onTabSelect}) => {
  const needsBinaryBytesDisplay = isBinary && binaryByteCount
  const binaryBytesDisplay = needsBinaryBytesDisplay ? <NumberDisplay suffix='byte' suffixPlural value={binaryByteCount} /> : undefined
  const needsUtfBytesDisplay = !isBinary && sizeInBytes && sizeInBytes !== charCount
  const utfBytesDisplay = needsUtfBytesDisplay ? <PulsatingNumber suffix='byte' suffixPlural value={sizeInBytes} /> : undefined
  const needsCharsDisplay = !isBinary && charCount
  const charsDisplay = needsCharsDisplay ? <PulsatingNumber suffix='character' suffixPlural value={charCount} /> : undefined
  const stage = useStage()
  const decoration = <>
    {binaryBytesDisplay}
    {utfBytesDisplay}
    {charsDisplay}
    {stage === 'editing' && <div className={css.buttons}>
      <IconButton icon='' title='Clear input' onClick={onClear} />
      <IconButton icon='' title='Copy input' onClick={onCopy} />
    </div>}
  </>
  const tabElements = tabs.map(tab => {
    const icon = <Svg lineHeight src={textIcon} />
    return <Tab key={tab.id} title={tab.name}>{icon}{tab.name}</Tab>
  })
  return <TabbedView activeTabKey={activeTabId} decoration={decoration} tabClassName={css.tab} onTabChange={onTabSelect}>
    {tabElements}
  </TabbedView>
}

export default EditorHeader
