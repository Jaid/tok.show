import clsx from 'clsx'
import {useEffect, useRef} from 'react'

type Props = {
  className?: string
  value: number | string
}

export default function PulsatingNumber({value, className}: Props) {
  const prevRef = useRef<number | string>(value)
  const spanRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (prevRef.current !== value && spanRef.current) {
      spanRef.current.classList.remove('pulse')
      void spanRef.current.offsetWidth // force reflow to restart animation
      spanRef.current.classList.add('pulse')
    }
    prevRef.current = value
  }, [value])
  return (
    <span ref={spanRef} className={clsx('pulsating-number', className)}>
      {value}
      <style>{`
        .pulsating-number {
          display: inline-block;
          will-change: transform;
        }
        .pulsating-number.pulse {
          animation: token-pulse 0.3s ease-out;
        }
        @keyframes token-pulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </span>
  )
}
