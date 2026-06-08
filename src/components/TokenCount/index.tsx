import type {ComponentProps, FunctionComponent} from 'react'

import PulsatingNumber from '#component/PulsatingNumber'

import css from './style.module.sass'

const TokenCount: FunctionComponent<ComponentProps<typeof PulsatingNumber>> = props => {
  return <PulsatingNumber className={css.countElement} suffixClassName={css.countLabel} suffix="token" suffixPlural gluedSuffix {...props} />
}

export default TokenCount
