import type {ReactNode} from 'react'

export type TabbedViewKey = string

export type TabDefinition<TabKey extends TabbedViewKey = TabbedViewKey> = {
  disabled?: boolean
  key: TabKey
  label: ReactNode
  title?: string
}

export type TabbedViewContextValue<TabKey extends TabbedViewKey = TabbedViewKey> = {
  selectTab: (tabKey: TabKey) => void
  tabIndex: number
  tabKey: TabKey
  tabs: ReadonlyArray<TabDefinition<TabKey>>
}

export type TabProps<TabKey extends TabbedViewKey = TabbedViewKey> = {
  children: ReactNode
  disabled?: boolean
  tabKey?: TabKey
  title?: string
}

export type TabbedViewProps<TabKey extends TabbedViewKey = TabbedViewKey> = {
  activeTabKey?: TabKey
  children: ReactNode
  className?: string
  decoration?: ReactNode
  defaultTabKey?: TabKey
  onTabChange?: (tabKey: TabKey, tabIndex: number) => void
  tabClassName?: string
}
