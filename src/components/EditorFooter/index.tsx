import type {FunctionComponent} from 'react'

import {FaArrowUpRightFromSquare} from 'react-icons/fa6'

import Icon from '#component/Icon'
import ThemeToggle from '#component/ThemeToggle'

import css from './style.module.sass'

type Props = {
  onToggleMonaco: () => void
  shareUrl: string
  useMonaco: boolean
}

const EditorFooter: FunctionComponent<Props> = ({onToggleMonaco, shareUrl, useMonaco}) => {
  return <div className={css.container}>
    <div className={css.info}>
      <Icon />
      <div className={css.titleContainer}>
        <span className={css.title}>Tok·Show</span>
      </div>
    </div>
    <div className={css.footerRight}>
      <ThemeToggle />
      <button className={css.miniBtn} onClick={onToggleMonaco}>
        {useMonaco ? 'Monaco' : 'textarea'}
      </button>
      <a className={css.shareLink} href={shareUrl} target="_blank" rel="noopener noreferrer"
        title="Duplicate or share this session (right-click to copy link)">
        <FaArrowUpRightFromSquare />
      </a>
    </div>
  </div>
}

export default EditorFooter
