import {createContext} from 'react'

import type {TabbedViewContextValue} from './types.ts'

export const TabbedViewContext = createContext<TabbedViewContextValue | null>(null)
