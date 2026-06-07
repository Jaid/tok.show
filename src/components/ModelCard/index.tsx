import type {Model} from '#src/lib/models/index.ts'

import clsx from 'clsx'

import PulsatingNumber from '#component/PulsatingNumber'

import css from './style.module.sass'

type Props = {
  count: number | null
  error?: string | null
  isFocused?: boolean
  isLoading?: boolean
  model: Model
  onClick?: () => void
}

export default function ModelCard({model, count, isFocused, isLoading, error, onClick}: Props) {
  return <div className={clsx(css.card, isFocused && css.focused, isLoading && css.loading)}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.()
      }
    }}
    title={error ?? undefined}
  >
    <img className={css.icon} src={model.icon} alt="" loading="lazy" />
      <div className={css.name}>{model.name}</div>
      {model.subname && <div className={css.subname}>{model.subname}</div>}
    <div className={css.count}>
      {isLoading ? <span className={css.countLoading}>…</span> : error ? <span className={css.countError}>⚠</span> : count !== null ? <PulsatingNumber value={count} /> : <span className={css.countNa}>–</span>}
    </div>
  </div>
}
