import '#src/style.sass'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NuqsAdapter } from 'nuqs/adapters/react'
import App from '#component/App'

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>,
)
