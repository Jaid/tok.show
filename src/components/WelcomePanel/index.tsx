import type {FunctionComponent} from 'react'

import AppTitle from '#component/AppTitle'
import ExampleList from '#component/ExampleList'
import Tok from '#component/Tok'

import css from './style.module.sass'

const WelcomePanel: FunctionComponent = () => {
  return <div className={css.container}>
    <div className={css.tokRow}>
      <Tok />
    </div>
    <div className={css.titleRow}>
      <AppTitle />
    </div>
    <div className={css.descriptionRow}>
      <picture className={css.pointing} aria-hidden='true'>
        <source srcSet='/pointing.jxl' type='image/jxl' />
        <img src='/pointing.webp' alt='' />
      </picture>
      <div className={css.descriptionText}>
        The left side of this page is a text editor. Write, paste or drop the content you want to tokenize or start with one of the examples.
      </div>
    </div>
    <div className={css.examplesRow}>
      <ExampleList />
    </div>
  </div>
}

export default WelcomePanel
