import type {Model} from '#src/lib/models/index.ts'
import type {EntryId} from '#src/lib/state.ts'

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

export default function OutputFooter({entries, modelsById, counts, errors, focusedId, hiddenEntryIds, loadingSet, onReorder, onFocus, onStashDrop, showAverage, averageCount, visibleModelCount, hiddenModels, onUnhide, onHide}: Props) {
  return <div className={css.footer}>
    <DraggableCardContainer entries={entries} modelsById={modelsById}
      counts={counts} errors={errors} focusedId={focusedId}
      hiddenEntryIds={hiddenEntryIds} loadingSet={loadingSet}
      onReorder={onReorder} onFocus={onFocus} onStashDrop={onStashDrop}
      showAverage={showAverage} averageCount={averageCount} visibleModelCount={visibleModelCount}>
      <HiddenCardStashButton hiddenModels={hiddenModels}
        onUnhide={onUnhide} onHide={(id: string) => onHide(id)} />
    </DraggableCardContainer>
  </div>
}
