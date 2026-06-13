import type {FunctionComponent} from 'react'

import {useSortable} from '@dnd-kit/react/sortable'

import ModelCard from '#component/ModelCard'

import AverageIcon from './average.svg?react'

import css from './style.module.sass'

type Props = {
  averageCount: number | null
  index: number
  isBest?: boolean
  showAverage: boolean
  visibleModelCount: number
}

const DraggableAverageCard: FunctionComponent<Props> = ({averageCount, index, isBest, showAverage, visibleModelCount}) => {
  const {ref, handleRef, isDragging} = useSortable({
    id: 'average',
    index,
    data: {type: 'average'},
  })
  if (!showAverage) {
    return null
  }
  if (isDragging) {
    return <div ref={ref} className={css.placeholder} />
  }
  const subname = visibleModelCount >= 2 ? `of ${visibleModelCount} models` : undefined
  return (
    <div ref={ref}>
      <ModelCard
        model={{
          getIcon: () => <AverageIcon />,
          name: 'Average',
          subname,
        }}
        count={averageCount}
        isBest={isBest}
        handleRef={handleRef}
      />
    </div>
  )
}

export default DraggableAverageCard
