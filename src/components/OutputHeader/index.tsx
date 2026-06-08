import type {FunctionComponent} from 'react'

import clsx from 'clsx'

import css from './style.module.sass'

export type OutputTab = 'ids' | 'mirror' | 'tokenized'

type Props = {
  currentTab: OutputTab
  onTabChange: (tab: OutputTab) => void
}

const OutputHeader: FunctionComponent<Props> = ({currentTab, onTabChange}) => {
  const tabs: Array<{id: OutputTab
    label: string}> = [
    {
      id: 'mirror',
      label: 'mirror',
    },
    {
      id: 'tokenized',
      label: 'tokenized',
    },
    {
      id: 'ids',
      label: 'IDs',
    },
  ]
  return <div className={css.header}>
    {tabs.map(tab => <button
      key={tab.id}
      className={clsx(css.tab, currentTab === tab.id && css.active)}
      onClick={() => onTabChange(tab.id)}
    >
      {tab.label}
    </button>)}
  </div>
}

export default OutputHeader
