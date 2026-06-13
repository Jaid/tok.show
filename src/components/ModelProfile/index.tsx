import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import css from './style.module.sass'

type Props = {
  model: Pick<Model, 'getIcon' | 'name' | 'subname'>
}

const ModelProfile: FunctionComponent<Props> = ({model}) => {
  return <>
    <div className={css.icon}>{model.getIcon()}</div>
    <div className={css.name}>{model.name}</div>
    {model.subname && <div className={css.subname}>{model.subname}</div>}
  </>
}

export default ModelProfile
