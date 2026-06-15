import type {FunctionComponent, ReactNode} from 'react'

import {Tab, TabbedView} from '#component/TabbedView'

export type OutputTab = 'ids' | 'mirror' | 'tokenized'

type Props = {
  children?: ReactNode
  currentTab: OutputTab
  onTabChange: (tab: OutputTab) => void
}

const OutputHeader: FunctionComponent<Props> = ({children, currentTab, onTabChange}) => {
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
  return <TabbedView<OutputTab> activeTabKey={currentTab} onTabChange={onTabChange}>
    {tabs.map(tab => <Tab key={tab.id}>{tab.label}</Tab>)}
    {children}
  </TabbedView>
}

export default OutputHeader
