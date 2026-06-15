import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import ModelProfile from '#component/ModelProfile'

import css from './style.module.sass'

type Props = {
  models: Array<Model>
  onUnhide: (modelId: string) => void
}

const HiddenCardStash: FunctionComponent<Props> = ({models, onUnhide}) => {
  if (models.length === 0) {
    return <div className={css.empty}>All models visible</div>
  }
  const items = models.map(model => {
    return <button key={model.id} className={css.item} onClick={() => onUnhide(model.id)}>
      <ModelProfile model={model} />
    </button>
  })
  return (
    <div className={css.container}>
      {items}
    </div>
  )
}

export default HiddenCardStash
