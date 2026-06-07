import type {Model} from '#src/lib/models/index.ts'
import type {TokenSpan} from '#src/lib/tokenSpans.ts'
import type {ModelId} from 'token-vocabs'

import {autoUpdate, flip, offset, shift, useClick, useDismiss, useFloating, useHover, useInteractions} from '@floating-ui/react'
import {useCallback, useState} from 'react'

import modelsMap from '#src/lib/models/index.ts'
import {getVisibleModelIds} from '#src/lib/state.ts'
import textDecoder from '#src/lib/textDecoder.ts'

type Props = {
  focusedModel: Model | null
  input: Uint8Array | string
  onClickSpan?: (span: TokenSpan) => void
  onHoverSpan?: (span: TokenSpan | null) => void
  spans: Array<TokenSpan>
}

export default function TokenizedText({spans, input, focusedModel, onHoverSpan, onClickSpan}: Props) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
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
  const hoverContext = useFloating({
    open: tooltipOpen,
    onOpenChange: setTooltipOpen,
    placement: 'top',
    middleware: [offset(8), flip(), shift({padding: 8})],
    whileElementsMounted: autoUpdate,
  })
  const hover = useHover(hoverContext.context, {
    delay: {
      open: 0,
      close: 100,
    },
  })
  const dismiss = useDismiss(context)
  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss])
  // Compute supported models when a span is clicked
  const computeSupported = useCallback(async (span: TokenSpan) => {
    const decoder = new globalThis.TextDecoder('utf-8', {fatal: false})
    const tokenStr = typeof input === 'string' ? input.slice(span.byteStart, span.byteEnd) : decoder.decode(input.slice(span.byteStart, span.byteEnd))
    if (!tokenStr) {
      setSupportedModels([])
      return
    }
    const testInput = input instanceof Uint8Array ? input.slice(span.byteStart, span.byteEnd) : tokenStr
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
  }, [input])
  const handleSpanClick = useCallback((span: TokenSpan, event: React.MouseEvent) => {
    setClickedSpan(span)
    setTooltipOpen(true)
    refs.setReference(event.currentTarget)
    onClickSpan?.(span)
    void computeSupported(span)
  }, [refs, onClickSpan, computeSupported])
  const handleMouseEnter = useCallback((span: TokenSpan) => {
    setHoveredId(span.id)
    onHoverSpan?.(span)
  }, [onHoverSpan])
  const handleMouseLeave = useCallback(() => {
    setHoveredId(null)
    onHoverSpan?.(null)
  }, [onHoverSpan])
  // Plain text when no focused model or no spans
  if (!focusedModel || spans.length === 0) {
    const displayText = input instanceof Uint8Array ? textDecoder.decode(input) : input
    return (
      <div className="tokenized-plain">
        {displayText || <span className="tok-empty">Start typing…</span>}
      </div>
    )
  }
  return (
    <div className="tokenized-text">
      {spans.map((span, i) => {
        const isOdd = i % 2 === 0
        const isHovered = hoveredId === span.id
        const isClicked = clickedSpan?.index === i
        return (
          <span
            key={i}
            className={`token ${isOdd ? 'token-odd' : 'token-even'} ${isHovered ? 'token-hovered' : ''} ${isClicked ? 'token-clicked' : ''} ${span.isNonRepresentable ? 'token-hex' : ''}`}
            onMouseEnter={() => handleMouseEnter(span)}
            onMouseLeave={handleMouseLeave}
            onClick={e => handleSpanClick(span, e)}
            {...(isClicked ? getReferenceProps() : {})}
            data-token-id={span.id}
            data-token-index={span.index}
          >
            {span.isNonRepresentable && span.hexDisplay ? span.hexDisplay.split(' ').map((hexByte, hi) => <span key={hi} className="hex-byte">{hexByte}</span>) : getSpanText(input, span) || '\u2423'}
          </span>
        )
      })}

      {tooltipOpen && clickedSpan
        && <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="token-tooltip"
          {...getFloatingProps()}
        >
          <div className="tooltip-row">
            <span className="tooltip-label">Token</span>
            <span className="tooltip-value token-preview">
              {clickedSpan.isNonRepresentable && clickedSpan.hexDisplay ? clickedSpan.hexDisplay : clickedSpan.text || '(empty)'}
            </span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Index</span>
            <span className="tooltip-value">{clickedSpan.index}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Token ID</span>
            <span className="tooltip-value mono">{clickedSpan.id}</span>
          </div>
          {supportedModels.length > 0
            && <div className="tooltip-section">
              <div className="tooltip-label">Supported models</div>
              <div className="supported-models">
                {supportedModels.map(id => {
                  const m = modelsMap.get(id)
                  if (!m) {
                    return null
                  }
                  return (
                    <span key={id} className="supported-icon" title={m.name}>
                      <img src={m.icon} alt={m.name} width={16} height={16} />
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

function getSpanText(input: Uint8Array | string, span: TokenSpan): string {
  if (span.isNonRepresentable && span.hexDisplay) {
    return span.hexDisplay
  }
  // For text, return the actual text slice
  if (typeof input === 'string') {
    return input.slice(span.byteStart, span.byteEnd) || '\u2423' // visible space
  }
  // Binary input - return text or hex
  if (span.isNonRepresentable && span.hexDisplay) {
    return span.hexDisplay
  }
  return span.text || '\u2423'
}
