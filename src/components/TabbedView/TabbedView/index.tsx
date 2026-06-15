import type {Key, ReactElement, ReactNode} from 'react'

import clsx from 'clsx'
import {Children, isValidElement, useState} from 'react'

import {Tab} from '../Tab/index.tsx'
import {TabbedViewContext} from '../context.ts'
import type {TabDefinition, TabbedViewContextValue, TabbedViewKey, TabbedViewProps, TabProps} from '../types.ts'

import css from './style.module.sass'

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

export const TabbedView = <TabKey extends TabbedViewKey = TabbedViewKey>({activeTabKey, children, className, decoration, defaultTabKey, onTabChange, tabClassName}: TabbedViewProps<TabKey>) => {
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
            className={clsx(css.tab, tabClassName, isActive && css.activeTab)}
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
