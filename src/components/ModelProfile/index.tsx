import css from './style.module.sass'

type Props = {
  model: {
    icon: string
    name: string
    subname?: string
  }
}

export default function ModelProfile({model}: Props) {
  return <>
    <img className={css.icon} src={model.icon} alt="" loading="lazy" />
    <div className={css.name}>{model.name}</div>
    {model.subname && <div className={css.subname}>{model.subname}</div>}
  </>
}
