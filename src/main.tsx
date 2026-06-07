import '#src/style.sass'

import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'

import DecoratedApp from '#component/DecoratedApp'

if (import.meta.env.DEV) {
  let rootNode = document.body.querySelector(':scope>div')
  if (!rootNode) {
    rootNode = document.createElement('div')
    document.body.append(rootNode)
  }
  const root = createRoot(rootNode)
  root.render(<StrictMode><DecoratedApp/></StrictMode>)
} else {
  const rootNode = document.createElement('div')
  document.body.append(rootNode)
  const root = createRoot(rootNode)
  root.render(<DecoratedApp/>)
}
