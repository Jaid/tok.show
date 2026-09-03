import {useEffect, useRef} from 'react'

import {registerWebMcp} from './register.ts'
import type {WebMcpUiBridge} from './tools.ts'

export const useWebMcp = (bridge: WebMcpUiBridge): void => {
  const bridgeRef = useRef(bridge)
  useEffect(() => {
    bridgeRef.current = bridge
  }, [bridge])
  useEffect(() => {
    const controller = new AbortController
    let unregister = () => {}
    void registerWebMcp(() => bridgeRef.current, controller.signal).then(cleanup => {
      if (controller.signal.aborted) {
        cleanup()
      } else {
        unregister = cleanup
      }
    }).catch(error => {
      if (!controller.signal.aborted) {
        console.warn('Could not register Tok·Show WebMCP tools:', error)
      }
    })
    return () => {
      controller.abort()
      unregister()
    }
  }, [])
}
