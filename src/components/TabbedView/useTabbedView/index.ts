import {useContext} from 'react'

import {TabbedViewContext} from '../context.ts'
import type {TabbedViewContextValue, TabbedViewKey} from '../types.ts'

export const useTabbedView = <TabKey extends TabbedViewKey = TabbedViewKey>(): TabbedViewContextValue<TabKey> => {
  const context = useContext(TabbedViewContext)
  if (!context) {
    throw new Error('useTabbedView must be used inside a TabbedView.')
  }
  return context as unknown as TabbedViewContextValue<TabKey>
}
