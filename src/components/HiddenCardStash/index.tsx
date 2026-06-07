import type {Model} from '#src/lib/models/index.ts'

import ModelCard from '#component/ModelCard'

import css from './style.module.sass'

type Props = {
  models: Array<Model>
  onUnhide: (modelId: string) => void
}

export default function HiddenCardStash({models, onUnhide}: Props) {
  if (models.length === 0) {
    return <div className={css.empty}>All models visible</div>
  }
  return (
    <div className={css.list}>
      {models.map(model => <ModelCard
        key={model.id}
        model={model}
        count={null}
        onClick={() => onUnhide(model.id)}
      />)}
    </div>
  )
}
