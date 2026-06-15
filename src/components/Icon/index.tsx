import type {FunctionComponent} from 'react'

import Svg from '#component/Svg'

import css from './style.module.sass'

import icon from '/icon.svg'

const Icon: FunctionComponent = () => {
  return <a href='/'>
    <Svg imgClassName={css.element} src={icon} alt="favicon" />
  </a>
}

export default Icon
