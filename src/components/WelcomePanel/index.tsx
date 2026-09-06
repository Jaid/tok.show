import type {FunctionComponent} from 'react'

import {useId} from 'react'


import AppTitle from '#component/AppTitle'
import ExampleList from '#component/ExampleList'
import Tok from '#component/Tok'

import Cog from './cog.svg?react'
import css from './style.module.sass'

const WelcomePanel: FunctionComponent = () => {
  const patternId = useId()
  return <div className={css.container}>
    {[0, 1].map(layer => <svg key={layer} className={css.cogs} aria-hidden='true'>
      <defs>
        <pattern id={`${patternId}-${layer}`} width='160' height='160' x={layer * 80} y={layer * 80} patternUnits='userSpaceOnUse'>
          <g transform='translate(80 80)'>
            <g className={css.cog}>
              <Cog x={-80} y={-80} width={160} height={160} />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width='100%' height='100%' fill={`url(#${patternId}-${layer})`} />
    </svg>)}
    <div className={css.tokRow}>
      <Tok />
    </div>
    <div className={css.documentation}>
      <div className={css.titleRow}>
        <AppTitle />
      </div>
      <div className={css.descriptionRow}>
        <picture className={css.pointing} aria-hidden='true'>
          <source srcSet='/pointing.jxl' type='image/jxl' />
          <img src='/pointing.webp' alt='' />
        </picture>
        <div className={css.descriptionText}>
          The left side of this page is a text editor. Write, paste or drop the content you want to tokenize.<br/><br/>Or start with one of the examples:
        </div>
      </div>
      <div className={css.examplesRow}>
        <ExampleList />
      </div>
    </div>
  </div>
}

export default WelcomePanel
