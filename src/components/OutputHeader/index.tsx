import type {FunctionComponent, ReactNode} from 'react'

import {Tab, TabbedView} from '#component/TabbedView'

export type OutputTab = 'ids' | 'preprocessed' | 'tokenized' | 'webmcp'

type Props = {
  children?: ReactNode
  currentTab: OutputTab
  onTabChange: (tab: OutputTab) => void
  showModelTabs: boolean
}

const OutputHeader: FunctionComponent<Props> = ({children, currentTab, onTabChange, showModelTabs}) => {
  const modelTabs: Array<{id: OutputTab
    label: string}> = [
    {
      id: 'tokenized',
      label: 'tokenized',
    },
    {
      id: 'ids',
      label: 'IDs',
    },
  ]
  const tabs: Array<{id: OutputTab
    label: string}> = [
    {
      id: 'preprocessed',
      label: 'preprocessed',
    },
    ...(showModelTabs ? modelTabs : []),
    {
      id: 'webmcp',
      label: 'WebMCP',
    },
  ]
  return <TabbedView<OutputTab> activeTabKey={currentTab} onTabChange={onTabChange}>
    {tabs.map(tab => <Tab key={tab.id}>{tab.label}</Tab>)}
    {children}
  </TabbedView>
}

export {default as WebmcpDocumentation} from './WebmcpDocumentation/index.tsx'
export default OutputHeader
