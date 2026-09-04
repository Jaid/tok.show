import {createGuiTools} from './guiTools.ts'
import {createHeadlessTools} from './headlessTools.ts'

export type WebmcpUiBridge = {
  setText: (value: string) => void
}

export const createWebmcpTools = (getBridge: () => WebmcpUiBridge): Array<WebMCP.ModelContextTool> => [
  ...createGuiTools(getBridge),
  ...createHeadlessTools(),
]
