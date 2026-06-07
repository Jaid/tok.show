import {NuqsAdapter} from 'nuqs/adapters/react'

import App from '#component/App'

const DecoratedApp = () => {
  const app = <NuqsAdapter>
    <App/>
  </NuqsAdapter>
  return app
}

export default DecoratedApp
