import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import Svg from '#component/Svg'

import css from './style.module.sass'

type Props = {
  model: Pick<Model, 'icon' | 'name' | 'subname' | 'title'>
}

const ModelProfile: FunctionComponent<Props> = ({model}) => {
  return <>
    <Svg alt="" className={css.icon} src={model.icon} />
    <div className={css.name} title={model.title}>{model.name}</div>
    {model.subname && <div className={css.subname}>{model.subname}</div>}
  </>
}

export default ModelProfile
