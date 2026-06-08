import type {FunctionComponent} from 'react'

import {NuqsAdapter} from 'nuqs/adapters/react'

import App from '#component/App'

const DecoratedApp: FunctionComponent = () => {
  const app = <NuqsAdapter>
    <App/>
  </NuqsAdapter>
  return app
}

export default DecoratedApp
