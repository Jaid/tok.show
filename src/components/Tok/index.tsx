import type {CSSProperties, FunctionComponent} from 'react'

import css from './style.module.sass'

type Beam = {
  endWidth: number
  endX: number
  endY: number
  startWidth: number
  startX: number
  startY: number
}

type BeamEffect = {
  accent: string
  core: string
  darkness: number
  delay: string
  duration: string
  source: string
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
    startX: 726,
    startY: 555,
    startWidth: 22,
    endX: 1030,
    endY: 1383,
    endWidth: 600,
  },
  {
    startX: 1260,
    startY: 530,
    startWidth: 22,
    endX: 1700,
    endY: 1265,
    endWidth: 500,
  },
] satisfies Array<Beam>
const beamEffects = [
  {
    source: '#fffde8',
    core: '#ffe47a',
    accent: '#ffb51b',
    darkness: 0.24,
    delay: '0ms',
    duration: '3900ms',
  },
  {
    source: '#f2fdff',
    core: '#8be6ff',
    accent: '#259eea',
    darkness: 0.24,
    delay: '-1450ms',
    duration: '4300ms',
  },
] satisfies Array<BeamEffect>
const getBeamCorners = ({startX, startY, startWidth, endX, endY, endWidth}: Beam, widthFactor = 1): [Point, Point, Point, Point] => {
  const dx = endX - startX
  const dy = endY - startY
  const length = Math.hypot(dx, dy)
  const perpendicularX = -dy / length
  const perpendicularY = dx / length
  const startHalfWidth = startWidth * widthFactor / 2
  const endHalfWidth = endWidth * widthFactor / 2
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
const getBeamAngle = ({startX, startY, endX, endY}: Beam) => Math.atan2(endY - startY, endX - startX) * 180 / Math.PI
const toPoints = (beam: Beam, widthFactor = 1) => getBeamCorners(beam, widthFactor).map(({x, y}) => `${x},${y}`).join(' ')

type BeamStyle = CSSProperties & {
  '--beam-darkness'?: number
  '--beam-delay': string
  '--beam-duration': string
}

const Tok: FunctionComponent = () => {
  return <div className={css.tok}>
    <picture>
      <source srcSet='/tok.jxl' type='image/jxl' />
      <img className={css.image} alt='Tok' src='/tok.webp' />
    </picture>
    {beamEffects.map((effect, index) => {
      const style: BeamStyle = {
        '--beam-darkness': effect.darkness,
        '--beam-delay': effect.delay,
        '--beam-duration': effect.duration,
      }
      return <picture key={index} aria-hidden='true'>
        <source srcSet='/tok.jxl' type='image/jxl' />
        <img className={css.imageShade} alt='' src='/tok.webp' style={style} />
      </picture>
    })}
    <svg className={css.beams} aria-hidden='true' viewBox={`0 0 ${sourceSize.width} ${sourceSize.height}`}>
      <defs>
        {beams.map((beam, index) => {
          const effect = beamEffects[index]
          return <linearGradient
            key={index}
            id={`beam-gradient-${index}`}
            gradientUnits='userSpaceOnUse'
            x1={beam.startX}
            x2={beam.endX}
            y1={beam.startY}
            y2={beam.endY}
          >
            <stop offset='0%' stopColor={effect.source} stopOpacity='1' />
            <stop offset='14%' stopColor={effect.core} stopOpacity='0.96' />
            <stop offset='48%' stopColor={effect.core} stopOpacity='0.68' />
            <stop offset='82%' stopColor={effect.accent} stopOpacity='0.42' />
            <stop offset='100%' stopColor={effect.accent} stopOpacity='0.16' />
          </linearGradient>
        })}
        {beams.map((beam, index) => <filter
          key={index}
          id={`beam-edge-soften-${index}`}
          colorInterpolationFilters='sRGB'
          height='170%'
          width='170%'
          x='-35%'
          y='-35%'
        >
          <feGaussianBlur stdDeviation='18' />
        </filter>)}
        {beams.map((beam, index) => <mask
          key={index}
          id={`beam-mask-${index}`}
          height={sourceSize.height}
          maskUnits='userSpaceOnUse'
          width={sourceSize.width}
          x='0'
          y='0'
        >
          <polygon
            fill='white'
            filter={`url(#beam-edge-soften-${index})`}
            points={toPoints(beam, 1.04)}
          />
        </mask>)}
      </defs>
      {beams.map((beam, index) => {
        const effect = beamEffects[index]
        const style: BeamStyle = {
          '--beam-delay': effect.delay,
          '--beam-duration': effect.duration,
        }
        const landingRotation = getBeamAngle(beam) + 90
        return <g key={index} className={css.beam} style={style}>
          <g mask={`url(#beam-mask-${index})`}>
            <image
              className={css.beamTexture}
              height={sourceSize.height}
              href='/tok.webp'
              width={sourceSize.width}
            />
            <polygon className={css.beamAtmosphere} fill={`url(#beam-gradient-${index})`} points={toPoints(beam, 1.08)} />
            <polygon className={css.beamBody} fill={`url(#beam-gradient-${index})`} points={toPoints(beam, 0.82)} />
            <polygon className={css.beamCore} fill={`url(#beam-gradient-${index})`} points={toPoints(beam, 0.42)} />
            <polygon className={css.beamFlash} fill={effect.source} points={toPoints(beam, 0.58)} />
          </g>
          <ellipse
            className={css.beamSourceHalo}
            cx={beam.startX}
            cy={beam.startY}
            fill={effect.source}
            rx={Math.max(42, beam.startWidth * 3.5)}
            ry={Math.max(42, beam.startWidth * 3.5)}
          />
          <ellipse
            className={css.beamSourceRing}
            cx={beam.startX}
            cy={beam.startY}
            fill='none'
            rx={Math.max(26, beam.startWidth * 1.8)}
            ry={Math.max(26, beam.startWidth * 1.8)}
            stroke={effect.core}
            strokeWidth='8'
          />
          <ellipse
            className={css.beamSourceCore}
            cx={beam.startX}
            cy={beam.startY}
            fill={effect.source}
            rx={Math.max(15, beam.startWidth)}
            ry={Math.max(15, beam.startWidth)}
          />
          <ellipse
            className={css.beamLandingGlow}
            cx={beam.endX}
            cy={beam.endY}
            fill={effect.core}
            rx={beam.endWidth * 0.38}
            ry={beam.endWidth * 0.1}
            transform={`rotate(${landingRotation} ${beam.endX} ${beam.endY})`}
          />
          <ellipse
            className={css.beamLandingCore}
            cx={beam.endX}
            cy={beam.endY}
            fill={effect.source}
            rx={beam.endWidth * 0.24}
            ry={beam.endWidth * 0.045}
            transform={`rotate(${landingRotation} ${beam.endX} ${beam.endY})`}
          />
        </g>
      })}
    </svg>
  </div>
}

export default Tok
