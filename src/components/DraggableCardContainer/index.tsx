import type {Model} from '#src/lib/models/index.ts'
import type {EntryId} from '#src/lib/state.ts'
import type {ReactNode} from 'react'

import {KeyboardSensor, PointerActivationConstraints, PointerSensor} from '@dnd-kit/dom'
import {DragDropProvider} from '@dnd-kit/react'
import {isSortableOperation, useSortable} from '@dnd-kit/react/sortable'
import {useCallback} from 'react'

import DraggableCard from '#component/DraggableCard'

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

export default function DraggableCardContainer({children, entries, modelsById, counts, errors, focusedId, loadingSet,
  onReorder, onFocus, onStashDrop, showAverage, averageCount, hiddenEntryIds, visibleModelCount}: Props) {
  const handleDragEnd = useCallback((event: any) => {
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
  }, [entries, onReorder, onStashDrop])
  return (
    <DragDropProvider onDragEnd={handleDragEnd} sensors={[pointerSensor, KeyboardSensor.configure({})]}>
      <div className="draggable-cards">
        {entries.map((entry, index) => {
          if (entry === 'average') {
            return (
              <DraggableAverageCard
                key="average"
                averageCount={averageCount}
                index={index}
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

function arrayMove<T>(array: Array<T>, from: number, to: number): Array<T> {
  const next = [...array]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
function AverageCard({count, subtext}: {count: number | null
  subtext: string}) {
  return (
    <div className="average-card">
      <div className="average-card-icon">⟲</div>
      <div className="average-card-text">
        <div className="average-card-name">Average</div>
        <div className="average-card-subname">{subtext}</div>
      </div>
      <div className="average-card-count">{count !== null ? count : '\u2013'}</div>
    </div>
  )
}
function DraggableAverageCard({averageCount, index, showAverage, visibleModelCount}: {averageCount: number | null
  index: number
  showAverage: boolean
  visibleModelCount: number}) {
  const {ref, handleRef, isDragging} = useSortable({
    id: 'average',
    index,
    data: {type: 'average'},
  })
  if (!showAverage) {
    return null
  }
  if (isDragging) {
    return <div ref={ref} className="draggable-card-placeholder" />
  }
  const subtext = visibleModelCount >= 2 ? `${visibleModelCount} visible models` : 'waiting for counts'
  return (
    <div ref={ref}>
      <div ref={handleRef} style={{display: 'contents'}}>
        <AverageCard count={averageCount} subtext={subtext} />
      </div>
    </div>
  )
}
