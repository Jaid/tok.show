import type {Model} from '#src/lib/models/index.ts'
import type {TokenSpan} from '#src/lib/tokenSpans.ts'
import type {FunctionComponent} from 'react'
import type {ModelId} from 'token-vocabs'

import {autoUpdate, flip, offset, shift, useClick, useDismiss, useFloating, useInteractions} from '@floating-ui/react'
import clsx from 'clsx'
import {Fragment, useLayoutEffect, useRef, useState} from 'react'

import modelsMap from '#src/lib/models/index.ts'
import {getVisibleModelIds} from '#src/lib/state.ts'
import textDecoder from '#src/lib/textDecoder.ts'

import css from './style.module.sass'

type Props = {
  focusedModel: Model | null
  input: Uint8Array | string
  onClickSpan?: (span: TokenSpan) => void
  onHoverSpan?: (span: TokenSpan | null) => void
  spans: Array<TokenSpan>
}

const TokenizedText: FunctionComponent<Props> = ({spans, input, focusedModel, onHoverSpan, onClickSpan}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const hoveredIdRef = useRef<number | null>(null)
  const [clickedSpan, setClickedSpan] = useState<TokenSpan | null>(null)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [supportedModels, setSupportedModels] = useState<Array<string>>([])
  const {refs, floatingStyles, context} = useFloating({
    open: tooltipOpen,
    onOpenChange: open => {
      setTooltipOpen(open)
      if (!open) {
        setClickedSpan(null)
      }
    },
    placement: 'top',
    middleware: [offset(8), flip(), shift({padding: 8})],
    whileElementsMounted: autoUpdate,
  })
  const click = useClick(context)
  const dismiss = useDismiss(context)
  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss])
  // Compute supported models when a span is clicked
  const computeSupported = async (span: TokenSpan) => {
    const testInput = input instanceof Uint8Array ? input.slice(span.byteStart, span.byteEnd) : span.text
    if (testInput.length === 0) {
      setSupportedModels([])
      return
    }
    const supported: Array<string> = []
    const visibleSet = new Set(getVisibleModelIds())
    // Check all models concurrently, loading hidden ones temporarily
    const checks = [...modelsMap.entries()].map(async ([id, model]) => {
      const wasLoaded = model.loaded
      try {
        await model.load()
        const result = model.tokenize(testInput)
        if (result.tokens.length === 1) {
          supported.push(id)
        }
      } catch {
        // Model can't tokenize this input
      } finally {
        // Free models that weren't loaded before and aren't visible
        if (!wasLoaded && !visibleSet.has(id as ModelId)) {
          model.unload()
        }
      }
    })
    await Promise.all(checks)
    setSupportedModels(supported)
  }
  const handleSpanClick = (span: TokenSpan, event: React.MouseEvent) => {
    setClickedSpan(span)
    setTooltipOpen(true)
    refs.setReference(event.currentTarget)
    onClickSpan?.(span)
    void computeSupported(span)
  }
  const setHoveredTokenId = (id: number | null) => {
    const oldId = hoveredIdRef.current
    if (oldId === id) {
      return
    }
    const container = containerRef.current
    if (container && oldId !== null) {
      for (const token of container.querySelectorAll<HTMLElement>(`[data-token-id="${CSS.escape(String(oldId))}"]`)) {
        token.classList.remove(css.tokenHovered)
      }
    }
    hoveredIdRef.current = id
    if (container && id !== null) {
      for (const token of container.querySelectorAll<HTMLElement>(`[data-token-id="${CSS.escape(String(id))}"]`)) {
        token.classList.add(css.tokenHovered)
      }
    }
  }
  useLayoutEffect(() => {
    const id = hoveredIdRef.current
    const container = containerRef.current
    if (!container || id === null) {
      return
    }
    for (const token of container.querySelectorAll<HTMLElement>(`[data-token-id="${CSS.escape(String(id))}"]`)) {
      token.classList.add(css.tokenHovered)
    }
  })
  const handleMouseEnter = (span: TokenSpan) => {
    setHoveredTokenId(span.id)
    onHoverSpan?.(span)
  }
  const handleMouseLeave = () => {
    setHoveredTokenId(null)
    onHoverSpan?.(null)
  }
  // Plain text when no focused model or no spans
  if (!focusedModel || spans.length === 0) {
    const displayText = input instanceof Uint8Array ? textDecoder.decode(input) : input
    return (
      <div className={css.plain}>
        {displayText || <span className={css.empty}>Start typing…</span>}
      </div>
    )
  }
  return (
    <div ref={containerRef} className={css.container}>
      {spans.map((span, i) => {
        const isOdd = i % 2 === 0
        const isClicked = clickedSpan?.index === i
        const lineBreaksCount = getArtificialLineBreaks(span)
        const lineBreaks = Array.from({length: lineBreaksCount}, (_, i) => <br key={i} />)
        return (
          <Fragment key={i}>
            <span
              className={clsx(css.token, !isOdd && css.tokenEven, isClicked && css.tokenClicked, span.isNonRepresentable && css.tokenHex)}
              onMouseEnter={() => handleMouseEnter(span)}
              onMouseLeave={handleMouseLeave}
              onClick={e => handleSpanClick(span, e)}
              {...(isClicked ? getReferenceProps() : {})}
              data-token-id={span.id}
              data-token-index={span.index}
            >
              {span.isNonRepresentable && span.hexDisplay ? span.hexDisplay.split(' ').map((hexByte, hi) => <span key={hi} className={css.hexByte}>{hexByte}</span>) : getSpanText(span)}
            </span>
            {lineBreaks}
          </Fragment>
        )
      })}

      {tooltipOpen && clickedSpan
        && <div
          ref={refs.setFloating}
          style={floatingStyles}
          className={css.tooltip}
          {...getFloatingProps()}
        >
          <div className={css.tooltipRow}>
            <span className={css.tooltipLabel}>Token</span>
            <span className={clsx(css.tooltipValue, css.tooltipPreview)}>
              {clickedSpan.isNonRepresentable && clickedSpan.hexDisplay ? clickedSpan.hexDisplay : clickedSpan.text || '(empty)'}
            </span>
          </div>
          <div className={css.tooltipRow}>
            <span className={css.tooltipLabel}>Index</span>
            <span className={css.tooltipValue}>{clickedSpan.index}</span>
          </div>
          <div className={css.tooltipRow}>
            <span className={css.tooltipLabel}>Token ID</span>
            <span className={clsx(css.tooltipValue, css.tooltipMono)}>{clickedSpan.id}</span>
          </div>
          {supportedModels.length > 0
            && <div className={css.tooltipSection}>
              <div className={css.tooltipLabel}>Supported models</div>
              <div className={css.supportedModels}>
                {supportedModels.map(id => {
                  const m = modelsMap.get(id)
                  if (!m) {
                    return null
                  }
                  return (
                    <span key={id} className={css.supportedIcon} title={m.name} role="img" aria-label={m.name}>
                      {m.getIcon()}
                    </span>
                  )
                })}
              </div>
            </div>
          }
        </div>
      }
    </div>
  )
}

export default TokenizedText

function getSpanText(span: TokenSpan): string {
  if (span.isNonRepresentable && span.hexDisplay) {
    return span.hexDisplay
  }
  return span.text || '\u2423'
}
function getArtificialLineBreaks(span: TokenSpan) {
  if (!span.isNonRepresentable || !span.hexDisplay) {
    return 0
  }
  if (span.text === '\n') {
    return 1
  }
  if (/^(?:\n+)$/.test(span.text)) {
    return span.text.length
  }
  if (span.text === '\r\n') {
    return 1
  }
  if (/^(?:\r\n)+$/.test(span.text)) {
    return span.text.length / 2
  }
  return 0
}
