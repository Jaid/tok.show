import type {FunctionComponent} from 'react'

import clsx from 'clsx'

import css from './style.module.sass'

type Props = {
  className?: string
}

const AppTitle: FunctionComponent<Props> = ({className}) => {
  return <div className={clsx(css.container, className)}>
    <div className={css.title}>TokShow</div>
    <div className={css.subtitle}>Local Tokenization Playground</div>
  </div>
}

export default AppTitle
