import type {Model} from '#src/lib/models/index.ts'
import type {FunctionComponent} from 'react'

import {useDroppable} from '@dnd-kit/react'
import {flip, offset, shift, useClick, useDismiss, useFloating, useInteractions} from '@floating-ui/react'
import clsx from 'clsx'
import {useState} from 'react'

import HiddenCardStash from '#component/HiddenCardStash'

import css from './style.module.sass'

type Props = {
  hiddenModels: Array<Model>
  onUnhide: (modelId: string) => void
}

const HiddenCardStashButton: FunctionComponent<Props> = ({hiddenModels, onUnhide}) => {
  const [isOpen, setIsOpen] = useState(false)
  const {ref: droppableRef, isDropTarget} = useDroppable({
    id: 'stash-zone',
  })
  const {refs, floatingStyles, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top-end',
    middleware: [offset(8), flip(), shift()],
  })
  const click = useClick(context)
  const dismiss = useDismiss(context)
  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss])
  const setRefs = (element: HTMLButtonElement | null) => {
    refs.setReference(element)
    droppableRef(element)
  }
  return (
    <>
      <button
        className={clsx(css.element, isDropTarget && css.dropTarget)}
        type='button'
        ref={setRefs}
        {...getReferenceProps()}
      >
        {`+ ${hiddenModels.length}`}
      </button>
      {isOpen
          && <div
            className={css.popover}
            style={floatingStyles}
            ref={element => refs.setFloating(element)}
            {...getFloatingProps()}
          >
            <HiddenCardStash
              models={hiddenModels} onUnhide={id => {
                onUnhide(id)
                setIsOpen(false)
              }}
            />
          </div>
      }
    </>
  )
}

export default HiddenCardStashButton
