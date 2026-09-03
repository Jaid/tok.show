import type {CSSProperties, FunctionComponent} from 'react'

import css from './style.module.sass'

type Beam = {
  delay: string
  endWidth: number
  endX: number
  endY: number
  startWidth: number
  startX: number
  startY: number
}

type Point = {
  x: number
  y: number
}

const sourceSize = {
  width: 2206,
  height: 1704,
} as const
const beams = [
  {
    startX: 715,
    startY: 508,
    startWidth: 20,
    endX: 1030,
    endY: 1383,
    endWidth: 600,
    delay: '0ms',
  },
  {
    startX: 1229,
    startY: 498,
    startWidth: 20,
    endX: 1700,
    endY: 1265,
    endWidth: 500,
    delay: '-600ms',
  },
] satisfies Array<Beam>
const getBeamCorners = ({startX, startY, startWidth, endX, endY, endWidth}: Beam): [Point, Point, Point, Point] => {
  const dx = endX - startX
  const dy = endY - startY
  const length = Math.hypot(dx, dy)
  const perpendicularX = -dy / length
  const perpendicularY = dx / length
  const startHalfWidth = startWidth / 2
  const endHalfWidth = endWidth / 2
  return [
    {
      x: startX + perpendicularX * startHalfWidth,
      y: startY + perpendicularY * startHalfWidth,
    },
    {
      x: endX + perpendicularX * endHalfWidth,
      y: endY + perpendicularY * endHalfWidth,
    },
    {
      x: endX - perpendicularX * endHalfWidth,
      y: endY - perpendicularY * endHalfWidth,
    },
    {
      x: startX - perpendicularX * startHalfWidth,
      y: startY - perpendicularY * startHalfWidth,
    },
  ]
}
const toPoints = (beam: Beam) => getBeamCorners(beam).map(({x, y}) => `${x},${y}`).join(' ')

type BeamStyle = CSSProperties & {
  '--beam-delay': string
}

const Tok: FunctionComponent = () => {
  return <div className={css.tok}>
    <picture>
      <source srcSet='/tok.jxl' type='image/jxl' />
      <img className={css.image} src='/tok.webp' alt='Tok' />
    </picture>
    <svg className={css.beams} viewBox={`0 0 ${sourceSize.width} ${sourceSize.height}`} aria-hidden='true'>
      <defs>
        {beams.map((beam, index) => <linearGradient
          key={index}
          id={`beam-gradient-${index}`}
          gradientUnits='userSpaceOnUse'
          x1={beam.startX}
          y1={beam.startY}
          x2={beam.endX}
          y2={beam.endY}
        >
          <stop offset='0%' stopColor='oklch(99% 0.04 95)' stopOpacity='0.98' />
          <stop offset='28%' stopColor='oklch(91% 0.11 88)' stopOpacity='0.58' />
          <stop offset='72%' stopColor='oklch(79% 0.17 72)' stopOpacity='0.22' />
          <stop offset='100%' stopColor='oklch(73% 0.14 67)' stopOpacity='0' />
        </linearGradient>)}
      </defs>
      {beams.map((beam, index) => {
        const points = toPoints(beam)
        const style: BeamStyle = {'--beam-delay': beam.delay}
        return <g key={index} className={css.beam} style={style}>
          <polygon className={css.beamGlow} points={points} fill={`url(#beam-gradient-${index})`} />
          <polygon className={css.beamCore} points={points} fill={`url(#beam-gradient-${index})`} />
        </g>
      })}
    </svg>
  </div>
}

export default Tok
