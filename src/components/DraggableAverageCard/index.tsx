import type {FunctionComponent} from 'react'

import {Feedback} from '@dnd-kit/dom'
import {useSortable} from '@dnd-kit/react/sortable'

import ModelCard from '#component/ModelCard'

import averageIcon from './average.svg?raw'

import css from './style.module.sass'

type Props = {
  averageCount: number | null
  index: number
  isBest?: boolean
  showAverage: boolean
  visibleModelCount: number
}

const DraggableAverageCard: FunctionComponent<Props> = ({averageCount, index, isBest, showAverage, visibleModelCount}) => {
  const {ref, handleRef} = useSortable({
    id: 'average',
    index,
    data: {type: 'average'},
    plugins: defaults => [...defaults, Feedback.configure({feedback: 'clone'})],
  })
  if (!showAverage) {
    return null
  }
  const subname = visibleModelCount >= 2 ? `of ${visibleModelCount} models` : undefined
  return (
    <div className={css.item} ref={ref}>
      <ModelCard
        count={averageCount}
        handleRef={handleRef}
        isBest={isBest}
        model={{
          icon: averageIcon,
          name: 'Average',
          subname,
        }}
      />
    </div>
  )
}

export default DraggableAverageCard
