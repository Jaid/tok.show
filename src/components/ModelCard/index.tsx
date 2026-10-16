import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import clsx from 'clsx'

import ModelProfile from '#component/ModelProfile'
import TokenCount from '#component/TokenCount'
import {useStage} from '#src/lib/useStage.ts'

import css from './style.module.sass'

type Props = {
  count: number | null
  error?: string | null
  handleRef?: (element: HTMLElement | null) => void
  isBest?: boolean
  isFocused?: boolean
  isLoading?: boolean
  model: Pick<Model, 'icon' | 'name' | 'subname'> & {title: string}
  onClick?: () => void
  ref?: React.Ref<HTMLDivElement>
}

const CountContent: FunctionComponent<Pick<Props, 'count' | 'error' | 'isLoading'>> = ({count, error, isLoading}) => {
  if (isLoading) {
    return <span className={css.countLoading}>…</span>
  }
  if (error) {
    return <span className={css.countError}>⚠</span>
  }
  if (count === null) {
    return <span className={css.countNa}>–</span>
  }
  return <TokenCount className={css.countElement} numberClassName={css.countNumber} suffixClassName={css.countLabel} value={count} />
}
const ModelCard: FunctionComponent<Props> = ({model, count, isBest, isFocused, isLoading, error, onClick, handleRef, ref}) => {
  const stage = useStage()
  return <div
    className={clsx(css.container, isLoading && css.loading, isFocused && css.focused, isBest && css.best)} role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    title={error ?? undefined}
    ref={ref}
    onClick={onClick}
    onKeyDown={onClick ? e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    } : undefined}
  >
    {stage === 'editing' && <div className={css.triangle}>⏶</div>}
    {stage === 'editing' && <div className={css.count}>
      <CountContent count={count} error={error} isLoading={isLoading} />
    </div>}
    <div className={css.profile} ref={handleRef}>
      <ModelProfile model={model} />
    </div>
  </div>
}

export default ModelCard
