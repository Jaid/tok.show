import type {Model} from '#src/lib/models/index.ts'

import {useSortable} from '@dnd-kit/react/sortable'

import ModelCard from '#component/ModelCard'

type Props = {
  count: number | null
  error?: string | null
  id: string
  isFocused?: boolean
  isLoading?: boolean
  model: Model
  onClick?: () => void
}

export default function DraggableCard({id, model, count, isFocused, isLoading, error, onClick}: Props) {
  const {ref, handleRef, isDragging} = useSortable({
    id,
    index: 0,
    data: {
      modelId: model.id,
      type: 'model',
    },
  })
  if (isDragging) {
    return <div ref={ref} className="draggable-card-placeholder" />
  }
  return (
    <div ref={ref}>
      <div ref={handleRef} style={{display: 'contents'}}>
        <ModelCard
          model={model}
          count={count}
          isFocused={isFocused}
          isLoading={isLoading}
          error={error}
          onClick={onClick}
        />
      </div>
      <style>{`
        .draggable-card-placeholder {
          width: 120px;
          height: 42px;
          background: #0a0a0a;
          border: 1px dashed #333;
          border-radius: 6px;
          opacity: 0.3;
        }
      `}</style>
    </div>
  )
}
