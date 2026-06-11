import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import {useSortable} from '@dnd-kit/react/sortable'

import ModelCard from '#component/ModelCard'

import css from './style.module.sass'

type Props = {
  count: number | null
  error?: string | null
  id: string
  index: number
  isBest?: boolean
  isFocused?: boolean
  isLoading?: boolean
  model: Model
  onClick?: () => void
}

const DraggableCard: FunctionComponent<Props> = ({id, index, model, count, isBest, isFocused, isLoading, error, onClick}) => {
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
    <div ref={ref} className={css.container}>
      <ModelCard
        model={model}
        count={count}
        isBest={isBest}
        isFocused={isFocused}
        isLoading={isLoading}
        error={error}
        onClick={onClick}
        handleRef={handleRef}
      />
    </div>
  )
}

export default DraggableCard
