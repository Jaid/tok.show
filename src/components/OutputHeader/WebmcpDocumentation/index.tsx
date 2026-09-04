import type {FunctionComponent} from 'react'
import {stringify} from 'yaml'

import {webmcpToolDocumentation} from '#src/lib/webmcp/documentation.ts'

import css from './style.module.sass'

const Schema: FunctionComponent<{children: object}> = ({children}) => <pre className={css.schema}>{stringify(children, {lineWidth: 0})}</pre>
const WebmcpDocumentation: FunctionComponent = () => {
  const groups = ['GUI', 'headless'] as const
  return <div className={css.container}>
    <header className={css.intro}>
      <h2>WebMCP tools</h2>
      <p>TokShow automatically registers these tools with the browser’s model context. They are grouped into GUI tools (that read or change this tab’s DOM state) and headless tools (that operate in the background and don’t interfere with human users).</p>
    </header>
    {groups.map(group => <section className={css.group} key={group}>
      <div className={css.groupHeading}>
        <h3>{group}</h3>
        <span>{webmcpToolDocumentation.filter(tool => tool.group === group).length} tools</span>
      </div>
      {webmcpToolDocumentation.filter(tool => tool.group === group).map(tool => <article className={css.tool} key={tool.name}>
        <div className={css.toolHeading}>
          <div>
            <code className={css.toolName}>{tool.name}</code>
            {tool.title && <span className={css.toolTitle}>{tool.title}</span>}
          </div>
          <div className={css.badges}>
            {tool.annotations?.readOnlyHint && <span>read-only</span>}
            {tool.annotations?.untrustedContentHint && <span>untrusted content</span>}
          </div>
        </div>
        <p className={css.description}>{tool.description}</p>
        <div className={css.schemas}>
          <div className={css.schemaColumn}>
            <h4>Input schema</h4>
            <Schema>{tool.inputSchema}</Schema>
          </div>
          <div className={css.schemaColumn}>
            <h4>Output schema</h4>
            <Schema>{tool.outputSchema}</Schema>
          </div>
        </div>
      </article>)}
    </section>)}
  </div>
}

export default WebmcpDocumentation
