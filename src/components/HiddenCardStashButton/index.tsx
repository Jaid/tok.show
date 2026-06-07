import type {Model} from '#src/lib/models/index.ts'
import {useFloating, useClick, useDismiss, useInteractions, offset, flip, shift} from '@floating-ui/react'
import {useState, forwardRef, useImperativeHandle, useRef} from 'react'
import HiddenCardStash from '#component/HiddenCardStash'

export type HiddenCardStashButtonHandle = {
  getBoundingClientRect: () => DOMRect | null
}

type Props = {
  onHide: (modelId: string) => void
  onUnhide: (modelId: string) => void
  hiddenModels: Model[]
}

const HiddenCardStashButton = forwardRef<HiddenCardStashButtonHandle, Props>(
  ({hiddenModels, onUnhide, onHide}, ref) => {
    const [isOpen, setIsOpen] = useState(false)
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
    }

    const count = hiddenModels.length

    return (
      <>
        <button
          ref={setRefs}
          className="stash-button"
          {...getReferenceProps()}
          aria-label={count > 0 ? `${count} more models hidden` : 'Hidden models'}
        >
          {count > 0 ? `${count} more` : '⋯'}
        </button>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="stash-popover"
            {...getFloatingProps()}
          >
            <HiddenCardStash models={hiddenModels} onUnhide={id => {
              onUnhide(id)
              setIsOpen(false)
            }} />
          </div>
        )}
        <style>{`
          .stash-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 12px;
            background: #1a1a1a;
            border: 1px dashed #444;
            border-radius: 6px;
            color: #888;
            font-size: 12px;
            cursor: pointer;
            user-select: none;
            transition: all 0.1s;
          }
          .stash-button:hover {
            background: #222;
            border-color: #666;
            color: #aaa;
          }
          .stash-popover {
            background: #111;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 8px;
            min-width: 180px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            z-index: 100;
          }
        `}</style>
      </>
    )
  },
)

export default HiddenCardStashButton
