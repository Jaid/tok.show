import type {Model} from '#src/lib/models/index.ts'

import {useSortable} from '@dnd-kit/react/sortable'

import ModelCard from '#component/ModelCard'

import css from './style.module.sass'

type Props = {
  count: number | null
  error?: string | null
  id: string
  index: number
  isFocused?: boolean
  isLoading?: boolean
  model: Model
  onClick?: () => void
}

export default function DraggableCard({id, index, model, count, isFocused, isLoading, error, onClick}: Props) {
  const {ref, handleRef, isDragging} = useSortable({
    id,
    index,
    data: {
      modelId: model.id,
      type: 'model',
    },
  })
  if (isDragging) {
    return <div ref={ref} className={css.placeholder} />
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
    </div>
  )
}
