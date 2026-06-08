import type {FunctionComponent} from 'react'

import css from './style.module.sass'

import icon from '/icon.svg'

const Icon: FunctionComponent = () => {
  return <a href='/'>
    <img className={css.element} src={icon} alt="favicon" />
  </a>
}

export default Icon
