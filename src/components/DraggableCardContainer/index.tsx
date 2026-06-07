import type {Model} from '#src/lib/models/index.ts'
import type {EntryId} from '#src/lib/state.ts'

import {DragDropProvider} from '@dnd-kit/react'
import {useSortable} from '@dnd-kit/react/sortable'
import {useCallback} from 'react'

import DraggableCard from '#component/DraggableCard'

type Props = {
  averageCount: number | null
  counts: Record<string, number>
  entries: Array<EntryId>
  errors: Record<string, string | null>
  focusedId: string | null
  hiddenEntryIds: Array<EntryId>
  loadingSet: Set<string>
  modelsById: Map<string, Model>
  onFocus: (modelId: string) => void
  onReorder: (newOrder: Array<EntryId>) => void
  onStashDrop?: (entry: EntryId) => void
  showAverage: boolean
}

export default function DraggableCardContainer({entries, modelsById, counts, errors, focusedId, loadingSet,
  onReorder, onFocus, onStashDrop, showAverage, averageCount, hiddenEntryIds}: Props) {
  const handleDragEnd = useCallback((event: any) => {
    const {active, over} = event.operation ?? {}
    if (!over) {
      return
    }
    if (over.id === 'stash-zone') {
      const entry = String(active?.id)
      if (entry && onStashDrop) {
        onStashDrop(entry)
      }
      return
    }
    if (active?.id === over?.id) {
      return
    }
    const from = entries.indexOf(String(active?.id))
    const to = entries.indexOf(String(over?.id))
    if (from === -1 || to === -1) {
      return
    }
    onReorder(arrayMove(entries, from, to))
  }, [entries, onReorder, onStashDrop])
  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="draggable-cards">
        {entries.map(entry => {
          if (entry === 'average') {
            return (
              <DraggableAverageCard
                key="average"
                averageCount={averageCount}
                showAverage={showAverage}
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
              model={model}
              count={counts[entry] ?? null}
              error={errors[entry] ?? null}
              isFocused={focusedId === entry}
              isLoading={loadingSet.has(entry)}
              onClick={() => onFocus(entry)}
            />
          )
        })}
      </div>
    </DragDropProvider>
  )
}

function arrayMove<T>(array: Array<T>, from: number, to: number): Array<T> {
  const next = [...array]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
function AverageCard({count}: {count: number | null
  isDragging?: boolean}) {
  return (
    <div className="average-card">
      <div className="average-card-icon">⟲</div>
      <div className="average-card-text">
        <div className="average-card-name">Average</div>
        <div className="average-card-subname">of visible models</div>
      </div>
      <div className="average-card-count">{count !== null ? count : '\u2013'}</div>
    </div>
  )
}
function DraggableAverageCard({averageCount, showAverage}: {averageCount: number | null
  showAverage: boolean}) {
  const {ref, handleRef, isDragging} = useSortable({
    id: 'average',
    index: 0,
    data: {type: 'average'},
  })
  if (!showAverage) {
    return null
  }
  if (isDragging) {
    return <div ref={ref} className="draggable-card-placeholder" />
  }
  return (
    <div ref={ref}>
      <div ref={handleRef} style={{display: 'contents'}}>
        <AverageCard count={averageCount} />
      </div>
    </div>
  )
}
