import type {FunctionComponent} from 'react'

import {FaArrowUpRightFromSquare} from 'react-icons/fa6'

import Icon from '#component/Icon'
import ThemeToggle from '#component/ThemeToggle'

import css from './style.module.sass'

type Props = {
  shareUrl: string
}

const EditorFooter: FunctionComponent<Props> = ({shareUrl}) => {
  return <div className={css.container}>
    <div className={css.info}>
      <Icon />
      <div className={css.titleContainer}>
        <div className={css.title}>Tok Show</div>
        <div className={css.flavorTitle}>Offline Tokenization Playground</div>
      </div>
    </div>
    <div className={css.footerRight}>
      <ThemeToggle />
      <a className={css.shareLink} href={shareUrl} target="_blank" rel="noopener noreferrer"
        title="Duplicate or share this session (right-click to copy link)">
        <FaArrowUpRightFromSquare />
      </a>
    </div>
  </div>
}

export default EditorFooter
