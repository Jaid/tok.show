import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import ModelCard from '#component/ModelCard'

import css from './style.module.sass'

type Props = {
  models: Array<Model>
  onUnhide: (modelId: string) => void
}

const HiddenCardStash: FunctionComponent<Props> = ({models, onUnhide}) => {
  if (models.length === 0) {
    return <div className={css.empty}>All models visible</div>
  }
  return (
    <div className={css.container}>
      {models.map(model => <ModelCard
        key={model.id}
        model={model}
        count={null}
        onClick={() => onUnhide(model.id)}
      />)}
    </div>
  )
}

export default HiddenCardStash
