import type {TabbedViewContextValue} from './types.ts'

import {createContext} from 'react'

export const TabbedViewContext = createContext<TabbedViewContextValue | null>(null)
