import type {ComponentProps, FunctionComponent} from 'react'
import type {IconType} from 'react-icons'

import clsx from 'clsx'

import css from './style.module.sass'

type Props = ComponentProps<'button'> & {
  icon?: IconType | number | string
  square?: 'auto' | boolean
}

const IconButton: FunctionComponent<Props> = ({className, children: extraChildren, square = 'auto', icon, type = 'button', ...props}) => {
  const getChild = () => {
    if (typeof icon === 'string') {
      return {
        child: icon,
        extraClassName: css.glyph,
      }
    }
    if (typeof icon === 'number') {
      const glyph = String.fromCodePoint(icon)
      return {
        child: glyph,
        extraClassName: css.glyph,
      }
    }
    if (typeof icon === 'function') {
      const Icon = icon
      return {
        child: <Icon aria-hidden='true' />,
        extraClassName: css.icon,
      }
    }
    if (extraChildren === null || extraChildren === undefined) {
      return {
        child: props.title ?? 'button',
        extraClassName: css.text,
      }
    }
    return {
      extraClassName: undefined,
    }
  }
  const {child, extraClassName} = getChild()
  const getShapeClass = () => {
    if (square === true) {
      return css.square
    }
    if (square === 'auto') {
      if (extraClassName === css.glyph || extraClassName === css.icon) {
        return css.square
      }
    }
  }
  return <button type={type} className={clsx(css.button, className, extraClassName, getShapeClass())} {...props}>{child}{extraChildren}</button>
}

export default IconButton
