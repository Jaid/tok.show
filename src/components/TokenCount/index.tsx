import type {ComponentProps, FunctionComponent} from 'react'

import PulsatingNumber from '#component/PulsatingNumber'

import css from './style.module.sass'

const TokenCount: FunctionComponent<ComponentProps<typeof PulsatingNumber>> = props => {
  return <PulsatingNumber className={css.countElement} gluedSuffix suffix='token' suffixClassName={css.countLabel} suffixPlural {...props} />
}

export default TokenCount
