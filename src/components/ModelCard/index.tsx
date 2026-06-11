import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import clsx from 'clsx'

import ModelProfile from '#component/ModelProfile'
import TokenCount from '#component/TokenCount'

import css from './style.module.sass'

type Props = {
  count: number | null
  error?: string | null
  handleRef?: (element: HTMLElement | null) => void
  isBest?: boolean
  isFocused?: boolean
  isLoading?: boolean
  model: Pick<Model, 'icon' | 'name' | 'subname'>
  onClick?: () => void
  ref?: React.Ref<HTMLDivElement>
}

const ModelCard: FunctionComponent<Props> = ({model, count, isBest, isFocused, isLoading, error, onClick, handleRef, ref}) => {
  return <div ref={ref} className={clsx(css.container, isLoading && css.loading, isFocused && css.focused, isBest && css.best)}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    } : undefined}
    title={error ?? undefined}
  >
    <div className={css.triangle}>⏶</div>
    <div className={css.count}>
      {isLoading ? <span className={css.countLoading}>…</span> : error ? <span className={css.countError}>⚠</span> : count !== null ? <TokenCount className={css.countElement} suffixClassName={css.countLabel} numberClassName={css.countNumber} value={count} /> : <span className={css.countNa}>–</span>}
    </div>
    <div ref={handleRef} className={css.profile}>
      <ModelProfile model={model} />
    </div>
  </div>
}

export default ModelCard
