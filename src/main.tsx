import '#src/style.sass'

import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import App from '#component/App'

const app = <App/>
if (import.meta.env.DEV) {
  let rootNode = document.body.querySelector(':scope>div')
  if (!rootNode) {
    rootNode = document.createElement('div')
    document.body.append(rootNode)
  }
  const root = createRoot(rootNode)
  root.render(<StrictMode>{app}</StrictMode>)
} else {
  const rootNode = document.createElement('div')
  document.body.append(rootNode)
  const root = createRoot(rootNode)
  root.render(app)
}
