import type {FunctionComponent} from 'react'

import Svg from '#component/Svg'

import css from './style.module.sass'

import icon from '/icon.svg'

const Icon: FunctionComponent = () => {
  return <a href='/'>
    <Svg alt='favicon' imgClassName={css.element} src={icon} />
  </a>
}

export default Icon
