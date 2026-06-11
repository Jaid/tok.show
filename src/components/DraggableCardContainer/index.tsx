import type {Model} from '#src/lib/models/index.ts'
import type {EntryId} from '#src/lib/state.ts'
import type {FunctionComponent, ReactNode} from 'react'

import {KeyboardSensor, PointerActivationConstraints, PointerSensor} from '@dnd-kit/dom'
import {DragDropProvider} from '@dnd-kit/react'
import {isSortableOperation} from '@dnd-kit/react/sortable'

import DraggableAverageCard from '#component/DraggableAverageCard'
import DraggableCard from '#component/DraggableCard'

import css from './style.module.sass'

const pointerSensor = PointerSensor.configure({
  activationConstraints: [new PointerActivationConstraints.Distance({value: 8})],
})

type Props = {
  averageCount: number | null
  children?: ReactNode
  counts: Record<string, number>
  entries: Array<EntryId>
  errors: Record<string, string | null>
  focusedId: string | null
  hiddenEntryIds: Array<EntryId>
  loadingSet: Set<string>
  modelsById: Map<string, Model>
  onFocus: (modelId: string) => void
  onReorder: (newOrder: Array<EntryId>) => void
  onStashDrop: (entry: EntryId) => void
  showAverage: boolean
  visibleModelCount: number
}

const getBestEntryId = (counts: Record<string, number>, entries: Array<EntryId>, averageCount: number | null): string | null => {
  const allCounts = new Map<string, number>
  for (const id of entries) {
    if (id === 'average') {
      if (averageCount !== null && averageCount > 0) {
        allCounts.set(id, averageCount)
      }
    } else {
      const c = counts[id]
      if (c !== null && c !== undefined && c > 0) {
        allCounts.set(id, c)
      }
    }
  }
  if (allCounts.size < 2) {
    return null
  }
  const values = [...allCounts.values()]
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) {
    return null
  }
  const winners = [...allCounts.entries()].filter(([, c]) => c === min).map(([id]) => id)
  if (winners.length !== 1) {
    return null
  }
  return winners[0]
}
const DraggableCardContainer: FunctionComponent<Props> = ({children, entries, modelsById, counts, errors, focusedId, loadingSet,
  onReorder, onFocus, onStashDrop, showAverage, averageCount, hiddenEntryIds, visibleModelCount}) => {
  const bestEntryId = getBestEntryId(counts, entries, averageCount)
  const handleDragEnd = (event: any) => {
    if (event.canceled) {
      return
    }
    const sourceId = event.operation.source?.id as EntryId | undefined
    const targetId = event.operation.target?.id as EntryId | undefined
    if (!sourceId || !targetId) {
      return
    }
    if (targetId === 'stash-zone') {
      onStashDrop(sourceId)
      return
    }
    if (isSortableOperation(event.operation) && sourceId !== targetId) {
      const from = entries.indexOf(sourceId)
      const to = entries.indexOf(targetId)
      if (from === -1 || to === -1) {
        return
      }
      onReorder(arrayMove(entries, from, to))
    }
  }
  return (
    <DragDropProvider onDragEnd={handleDragEnd} sensors={[pointerSensor, KeyboardSensor.configure({})]}>
      <div className={css.container}>
        {entries.map((entry, index) => {
          if (entry === 'average') {
            return (
              <DraggableAverageCard
                key="average"
                averageCount={averageCount}
                index={index}
                isBest={'average' === bestEntryId}
                showAverage={showAverage}
                visibleModelCount={visibleModelCount}
              />
            )
          }
          const model = modelsById.get(entry)
          if (!model) {
            return null
          }
          return (
            <DraggableCard
              key={entry}
              id={entry}
              index={index}
              model={model}
              count={counts[entry] ?? null}
              error={errors[entry] ?? null}
              isBest={entry === bestEntryId}
              isFocused={focusedId === entry}
              isLoading={loadingSet.has(entry)}
              onClick={() => onFocus(entry)}
            />
          )
        })}
      </div>
      {children}
    </DragDropProvider>
  )
}

export default DraggableCardContainer

function arrayMove<T>(array: Array<T>, from: number, to: number): Array<T> {
  const next = [...array]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
