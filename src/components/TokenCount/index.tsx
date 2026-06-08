import type {ComponentProps} from 'react'

import PulsatingNumber from '#component/PulsatingNumber'

import css from './style.module.sass'

type Props = ComponentProps<typeof PulsatingNumber>

export default function TokenCount(props: Props) {
  return <PulsatingNumber className={css.countElement} suffixClassName={css.countLabel} suffix="token" suffixPlural gluedSuffix {...props} />
}
