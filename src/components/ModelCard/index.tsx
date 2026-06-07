import type {Model} from '#src/lib/models/index.ts'

import clsx from 'clsx'

import ModelProfile from '#component/ModelProfile'
import PulsatingNumber from '#component/PulsatingNumber'

import css from './style.module.sass'

type Props = {
  count: number | null
  error?: string | null
  handleRef?: (element: HTMLElement | null) => void
  isFocused?: boolean
  isLoading?: boolean
  model: Model
  onClick?: () => void
}

export default function ModelCard({model, count, isFocused, isLoading, error, onClick, handleRef}: Props) {
  return <div className={clsx(css.card, isLoading && css.loading, isFocused && css.focused)}
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
    <div className={css.triangle}>⏶</div>
    <div className={css.count}>
      {isLoading ? <span className={css.countLoading}>…</span> : error ? <span className={css.countError}>⚠</span> : count !== null ? <PulsatingNumber suffix="token" suffixPlural gluedSuffix className={css.countElement} suffixClassName={css.countLabel} value={count} /> : <span className={css.countNa}>–</span>}
    </div>
    <div ref={handleRef} className={css.profile}>
      <ModelProfile model={model} />
    </div>
  </div>
}
