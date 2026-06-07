import {FaArrowUpRightFromSquare} from 'react-icons/fa6'

import css from './style.module.sass'

type Props = {
  byteLength: number
  charLength: number
  isBinary: boolean
  onToggleMonaco: () => void
  shareUrl: string
  useMonaco: boolean
}

export default function Footer({byteLength, charLength, isBinary, onToggleMonaco, shareUrl, useMonaco}: Props) {
  return (
    <div className={css.footer}>
      <div className={css.footerInfo}>
        <span className={css.footerIcon}>📝</span>
        <span className={css.footerTitle}>Tok·Show</span>
        <span className={css.footerSize}>
          {isBinary ? `${byteLength.toLocaleString('en-US')} bytes` : `${byteLength.toLocaleString('en-US')} bytes · ${charLength.toLocaleString('en-US')} chars`}
        </span>
      </div>
      <div className={css.footerRight}>
        <button className={css.miniBtn} onClick={onToggleMonaco}>
          {useMonaco ? 'Monaco' : 'textarea'}
        </button>
        <a className={css.shareLink} href={shareUrl} target="_blank" rel="noopener noreferrer"
          title="Duplicate or share this session (right-click to copy link)">
          <FaArrowUpRightFromSquare />
        </a>
      </div>
    </div>
  )
}
