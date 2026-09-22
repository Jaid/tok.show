import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import Branch from 'branch-component'

import Svg from '#component/Svg'

import css from './style.module.sass'

type Props = {
  model: Pick<Model, 'icon' | 'name' | 'subname' | 'title'>
}

const ModelProfile: FunctionComponent<Props> = ({model}) => {
  return <>
    <Svg className={css.icon} alt='' src={model.icon} />
    <div className={css.caption}>
      <div className={css.name} title={model.title}>{model.name}</div>
      <Branch if={model.subname}>
        <div className={css.subname}>{model.subname}</div>
      </Branch>
    </div>
  </>
}

export default ModelProfile
