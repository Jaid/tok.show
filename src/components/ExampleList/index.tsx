import type {FunctionComponent} from 'react'

import {examples} from './examples.ts'

import css from './style.module.sass'

const getExampleHref = (text: string) => {
  const location = Reflect.get(globalThis, 'location') as Location | undefined
  const parameters = new URLSearchParams(location?.search)
  parameters.set('text', text)
  return `?${parameters}`
}
const ExampleList: FunctionComponent = () => {
  return <nav aria-label='Examples' className={css.container}>
    {examples.map(example => <a className={css.example} href={getExampleHref(example.text)} key={example.id}>
      <span className={css.title}>{example.title}</span>
      <span className={css.description}>{example.description}</span>
    </a>)}
  </nav>
}

export default ExampleList
