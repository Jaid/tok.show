import type {FunctionComponent} from 'react'

import {FaRegCopy} from 'react-icons/fa6'

import NumberDisplay from '#component/NumberDisplay'

import css from './style.module.sass'

type Props = {
  binaryByteCount?: number | null
  charCount: number
  isBinary?: boolean
  onCopy: () => void
  sizeInBytes: number
}

const EditorHeader: FunctionComponent<Props> = ({sizeInBytes, charCount, isBinary, binaryByteCount, onCopy}) => {
  return <div className={css.container}>
    <div className={css.tab}>input.txt</div>
    <span className={css.size}>
      {isBinary && binaryByteCount !== null && binaryByteCount !== undefined ? <NumberDisplay value={binaryByteCount} suffix="byte" suffixPlural /> : <><NumberDisplay value={sizeInBytes} suffix="byte" suffixPlural /> · <NumberDisplay value={charCount} suffix="char" suffixPlural /></>
      }
    </span>
    <button className={css.iconBtn} onClick={onCopy} title="Copy input"><FaRegCopy /></button>
  </div>
}

export default EditorHeader
