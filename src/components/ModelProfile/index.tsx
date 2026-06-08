import type {FunctionComponent} from 'react'

import css from './style.module.sass'

type Props = {
  model: {
    icon: string
    name: string
    subname?: string
  }
}

const ModelProfile: FunctionComponent<Props> = ({model}) => {
  return <>
    <img className={css.icon} src={model.icon} alt="" loading="lazy" />
    <div className={css.name}>{model.name}</div>
    {model.subname && <div className={css.subname}>{model.subname}</div>}
  </>
}

export default ModelProfile
