import type {FunctionComponent} from 'react'

import Tok from './Tok.tsx'
import css from './style.module.sass'

const WelcomePanel: FunctionComponent = () => {
  return <div className={css.container}>
    <Tok />
  </div>
}

export default WelcomePanel
