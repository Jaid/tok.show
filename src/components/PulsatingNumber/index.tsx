import {useEffect, useRef} from 'react'

import css from './style.module.sass'

type Props = {
  value: number | string
}

const timing: KeyframeAnimationOptions = {
  duration: 1000,
  easing: 'ease-out',
}
const makeKeyframes = (color: string): Array<Keyframe> => [
  {
    filter: 'none',
    transform: 'scale(1)',
  },
  {
    filter: `drop-shadow(0 0 0.2em ${color})`,
    transform: 'scale(1.25)',
    offset: 0.1,
  },
  {
    filter: `drop-shadow(0 0 0.2em ${color})`,
    transform: 'scale(.9)',
    offset: 0.3,
  },
  {
    filter: `drop-shadow(0 0 0.2em ${color})`,
    transform: 'scale(1)',
    offset: 0.5,
  },
  {
    filter: 'none',
    transform: 'scale(1)',
  },
]
const greenFrames = makeKeyframes('#22c55e')
const redFrames = makeKeyframes('#ff1717')

export default function PulsatingNumber({value}: Props) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const prevRef = useRef(value)
  useEffect(() => {
    const el = spanRef.current
    if (!el) {
      return
    }
    const prev = prevRef.current
    prevRef.current = value
    if (typeof value !== 'number' || typeof prev !== 'number') {
      return
    }
    const frames = value > prev ? redFrames : greenFrames
    if (frames) {
      el.animate(frames, timing)
    }
  }, [value])
  return (
    <span ref={spanRef} className={css.number}>
      {value}
    </span>
  )
}
