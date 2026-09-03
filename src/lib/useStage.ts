import {useSnapshot} from 'valtio'

import {state} from './state.ts'

export type Stage = 'editing' | 'welcome'

export const useStage = (): Stage => {
  const snap = useSnapshot(state)
  const isEmpty = snap.isBinary ? !snap.binaryData?.byteLength : snap.text.length === 0
  return isEmpty ? 'welcome' : 'editing'
}
