import type {Model} from '#src/lib/models/index.ts'
import type {EntryId} from '#src/lib/state.ts'
import type {FunctionComponent} from 'react'

import DraggableCardContainer from '#component/DraggableCardContainer'
import HiddenCardStashButton from '#component/HiddenCardStashButton'

import css from './style.module.sass'

type Props = {
  averageCount: number | null
  counts: Record<string, number>
  entries: Array<EntryId>
  errors: Record<string, string | null>
  focusedId: string | null
  hiddenEntryIds: Array<EntryId>
  hiddenModels: Array<Model>
  loadingSet: Set<string>
  modelsById: Map<string, Model>
  onFocus: (modelId: string) => void
  onHide: (entry: EntryId) => void
  onReorder: (order: Array<EntryId>) => void
  onStashDrop: (entry: EntryId) => void
  onUnhide: (id: string) => void
  showAverage: boolean
  visibleModelCount: number
}

const OutputFooter: FunctionComponent<Props> = ({entries, modelsById, counts, errors, focusedId, hiddenEntryIds, loadingSet, onReorder, onFocus, onStashDrop, showAverage, averageCount, visibleModelCount, hiddenModels, onUnhide, onHide}) => {
  return <div className={css.container}>
    <DraggableCardContainer
      averageCount={averageCount} counts={counts}
      entries={entries} errors={errors} focusedId={focusedId}
      hiddenEntryIds={hiddenEntryIds} loadingSet={loadingSet}
      modelsById={modelsById} showAverage={showAverage} visibleModelCount={visibleModelCount}
      onFocus={onFocus} onReorder={onReorder} onStashDrop={onStashDrop}
    >
      <HiddenCardStashButton
        hiddenModels={hiddenModels}
        onHide={(id: string) => onHide(id)} onUnhide={onUnhide}
      />
    </DraggableCardContainer>
  </div>
}

export default OutputFooter
