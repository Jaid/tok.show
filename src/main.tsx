import '#src/style.sass'

import mountRoot from 'mount-root'
import {NuqsAdapter} from 'nuqs/adapters/react'

import App from '#component/App'

import css from './style.module.sass'

mountRoot(App, {
  id: css.container,
  wrapper: NuqsAdapter,
  strict: true,
})
