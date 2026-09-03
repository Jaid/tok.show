import {createGuiTools} from './guiTools.ts'
import {createHeadlessTools} from './headlessTools.ts'

export type WebMcpUiBridge = {
  setText: (value: string) => void
}

export const createWebMcpTools = (getBridge: () => WebMcpUiBridge): Array<WebMCP.ModelContextTool> => [
  ...createGuiTools(getBridge),
  ...createHeadlessTools(),
]
