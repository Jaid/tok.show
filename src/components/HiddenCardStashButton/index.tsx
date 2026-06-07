import type {Model} from '#src/lib/models/index.ts'

import {useDroppable} from '@dnd-kit/react'
import {flip, offset, shift, useClick, useDismiss, useFloating, useInteractions} from '@floating-ui/react'
import clsx from 'clsx'
import {forwardRef, useImperativeHandle, useRef, useState} from 'react'

import HiddenCardStash from '#component/HiddenCardStash'

import css from './style.module.sass'

export type HiddenCardStashButtonHandle = {
  getBoundingClientRect: () => DOMRect | null
}

type Props = {
  hiddenModels: Array<Model>
  onHide: (modelId: string) => void
  onUnhide: (modelId: string) => void
}

const HiddenCardStashButton = forwardRef<HiddenCardStashButtonHandle, Props>(({hiddenModels, onUnhide}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const {ref: droppableRef, isDropTarget} = useDroppable({
    id: 'stash-zone',
  })
  const buttonRef = useRef<HTMLButtonElement>(null)
  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => buttonRef.current?.getBoundingClientRect() ?? null,
  }))
  const {refs, floatingStyles, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top-end',
    middleware: [offset(8), flip(), shift()],
  })
  const click = useClick(context)
  const dismiss = useDismiss(context)
  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss])
  const setRefs = (el: HTMLButtonElement | null) => {
    buttonRef.current = el
    refs.setReference(el)
    droppableRef(el)
  }
  const count = hiddenModels.length
  return (
    <>
      <button
        ref={setRefs}
        className={clsx(css.button, isDropTarget && css.dropTarget)}
        {...getReferenceProps()}
        aria-label={count > 0 ? `${count} more models hidden` : 'Hidden models'}
      >
        {count > 0 ? `${count} more` : '⋯'}
      </button>
      {isOpen
          && <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={css.popover}
            {...getFloatingProps()}
          >
            <HiddenCardStash models={hiddenModels} onUnhide={id => {
              onUnhide(id)
              setIsOpen(false)
            }} />
          </div>
      }
    </>
  )
})

export default HiddenCardStashButton
