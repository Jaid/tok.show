import type {FunctionComponent, Key, ReactElement, ReactNode} from 'react'

import clsx from 'clsx'
import {Children, createContext, isValidElement, useContext, useState} from 'react'

import css from './style.module.sass'

type TabbedViewKey = string

type TabDefinition<TabKey extends TabbedViewKey = TabbedViewKey> = {
  disabled?: boolean
  key: TabKey
  label: ReactNode
  title?: string
}

type TabbedViewContextValue<TabKey extends TabbedViewKey = TabbedViewKey> = {
  selectTab: (tabKey: TabKey) => void
  tabIndex: number
  tabKey: TabKey
  tabs: ReadonlyArray<TabDefinition<TabKey>>
}

type TabProps<TabKey extends TabbedViewKey = TabbedViewKey> = {
  children: ReactNode
  disabled?: boolean
  tabKey?: TabKey
  title?: string
}

type TabbedViewProps<TabKey extends TabbedViewKey = TabbedViewKey> = {
  activeTabKey?: TabKey
  children: ReactNode
  className?: string
  decoration?: ReactNode
  defaultTabKey?: TabKey
  onTabChange?: (tabKey: TabKey, tabIndex: number) => void
}

const TabbedViewContext = createContext<TabbedViewContextValue | null>(null)
const getTabKey = <TabKey extends TabbedViewKey>(tabKey: TabKey | undefined, elementKey: Key | null): TabKey => {
  if (tabKey !== undefined) {
    return tabKey
  }
  if (elementKey === null) {
    throw new Error('TabbedView tabs need either a React key or a tabKey prop.')
  }
  return String(elementKey) as TabKey
}
const isTabElement = <TabKey extends TabbedViewKey>(child: ReactNode): child is ReactElement<TabProps<TabKey>> => {
  return isValidElement<TabProps<TabKey>>(child) && child.type === Tab
}

export const Tab = (() => {
  return null
}) as FunctionComponent<TabProps>

export const useTabbedView = <TabKey extends TabbedViewKey = TabbedViewKey>(): TabbedViewContextValue<TabKey> => {
  const context = useContext(TabbedViewContext)
  if (!context) {
    throw new Error('useTabbedView must be used inside a TabbedView.')
  }
  return context as unknown as TabbedViewContextValue<TabKey>
}

export const TabbedView = <TabKey extends TabbedViewKey = TabbedViewKey>({activeTabKey, children, className, decoration, defaultTabKey, onTabChange}: TabbedViewProps<TabKey>) => {
  const contentChildren: Array<ReactNode> = []
  const tabs: Array<TabDefinition<TabKey>> = []
  Children.forEach(children, child => {
    if (!isTabElement<TabKey>(child)) {
      contentChildren.push(child)
      return
    }
    tabs.push({
      key: getTabKey(child.props.tabKey, child.key),
      label: child.props.children,
      title: child.props.title,
      disabled: child.props.disabled,
    })
  })
  const fallbackTabKey = tabs[0]?.key
  const [uncontrolledTabKey, setUncontrolledTabKey] = useState<TabKey | undefined>(defaultTabKey ?? fallbackTabKey)
  const tabKey = activeTabKey ?? uncontrolledTabKey ?? fallbackTabKey
  if (tabKey === undefined) {
    throw new Error('TabbedView needs at least one Tab child.')
  }
  const foundTabIndex = tabs.findIndex(tab => tab.key === tabKey)
  const tabIndex = Math.max(foundTabIndex, 0)
  const selectTab = (nextTabKey: TabKey) => {
    const nextTabIndex = tabs.findIndex(tab => tab.key === nextTabKey)
    if (nextTabIndex === -1 || tabs[nextTabIndex]?.disabled) {
      return
    }
    setUncontrolledTabKey(nextTabKey)
    onTabChange?.(nextTabKey, nextTabIndex)
  }
  const context = {
    selectTab,
    tabIndex,
    tabKey,
    tabs,
  } satisfies TabbedViewContextValue<TabKey>
  return <TabbedViewContext.Provider value={context as unknown as TabbedViewContextValue}>
    <div className={clsx(css.container, className)} data-tab-index={tabIndex} data-tab-key={tabKey}>
      <div className={css.tabs} role="tablist">
        {tabs.map(tab => {
          const isActive = tab.key === tabKey
          return <button
            key={tab.key}
            aria-selected={isActive}
            className={clsx(css.tab, isActive && css.activeTab)}
            disabled={tab.disabled}
            onClick={() => selectTab(tab.key)}
            role="tab"
            title={tab.title}
            type="button"
          >
            {tab.label}
          </button>
        })}
      </div>
      {decoration && <div className={css.decoration}>{decoration}</div>}
    </div>
    {contentChildren}
  </TabbedViewContext.Provider>
}
