import {useEffect, useRef} from 'react'

import {registerWebmcp} from './register.ts'
import type {WebmcpUiBridge} from './tools.ts'

export const useWebmcp = (bridge: WebmcpUiBridge): void => {
  const bridgeRef = useRef(bridge)
  useEffect(() => {
    bridgeRef.current = bridge
  }, [bridge])
  useEffect(() => {
    const controller = new AbortController
    let unregister = () => {}
    void registerWebmcp(() => bridgeRef.current, controller.signal).then(cleanup => {
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
