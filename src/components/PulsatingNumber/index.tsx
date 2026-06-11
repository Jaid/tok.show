import type {FunctionComponent} from 'react'

import clsx from 'clsx'
import {useEffect, useRef} from 'react'

import NumberDisplay from '#component/NumberDisplay'

import css from './style.module.sass'

type NumberDisplayProps = Parameters<typeof NumberDisplay>[0]

type Props = NumberDisplayProps & {
  colorNegative?: string
  colorPositive?: string
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
    filter: `drop-shadow(0 0 0.1em ${color})`,
    transform: 'scale(1.25)',
    offset: 0.1,
  },
  {
    filter: `drop-shadow(0 0 0.1em ${color})`,
    transform: 'scale(.9)',
    offset: 0.3,
  },
  {
    filter: `drop-shadow(0 0 0.1em ${color})`,
    transform: 'scale(1)',
    offset: 0.5,
  },
  {
    filter: 'none',
    transform: 'scale(1)',
  },
]
const PulsatingNumber: FunctionComponent<Props> = ({colorNegative = '#ff1717', colorPositive = '#22c55e', numberClassName, ...numberDisplayProps}) => {
  const spanRef = useRef<HTMLSpanElement | null>(null)
  const prevRef = useRef(numberDisplayProps.value)
  const greenFrames = makeKeyframes(colorPositive)
  const redFrames = makeKeyframes(colorNegative)
  useEffect(() => {
    const el = spanRef.current
    if (!el) {
      return
    }
    const {value} = numberDisplayProps
    const prev = prevRef.current
    prevRef.current = value
    if (typeof value !== 'number' || typeof prev !== 'number') {
      return
    }
    const frames = value > prev ? redFrames : greenFrames
    el.animate(frames, timing)
  }, [numberDisplayProps.value, greenFrames, redFrames])
  return (
    <NumberDisplay
      {...numberDisplayProps}
      numberClassName={clsx(css.number, numberClassName)}
      numberRef={el => {
        spanRef.current = el
      }}
    />
  )
}

export default PulsatingNumber
