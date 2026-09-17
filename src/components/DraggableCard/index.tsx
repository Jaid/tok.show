import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import {Feedback} from '@dnd-kit/dom'
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
  const {ref, handleRef} = useSortable({
    id,
    index,
    data: {
      modelId: model.id,
      type: 'model',
    },
    plugins: defaults => [...defaults, Feedback.configure({feedback: 'clone'})],
  })
  return (
    <div className={css.item} ref={ref}>
      <ModelCard
        count={count}
        error={error}
        handleRef={handleRef}
        isBest={isBest}
        isFocused={isFocused}
        isLoading={isLoading}
        model={model}
        onClick={onClick}
      />
    </div>
  )
}

export default DraggableCard
