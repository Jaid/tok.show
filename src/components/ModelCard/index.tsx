import type {Model} from '#src/lib/models/index.ts'
import clsx from 'clsx'
import PulsatingNumber from '#component/PulsatingNumber'

type Props = {
  count: number | null
  error?: string | null
  isFocused?: boolean
  isLoading?: boolean
  model: Model
  onClick?: () => void
}

export default function ModelCard({model, count, isFocused, isLoading, error, onClick}: Props) {
  return (
    <div
      className={clsx('model-card', isFocused && 'focused', isLoading && 'loading')}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      title={error ?? undefined}
    >
      <div className="model-card-icon">
        <img src={model.icon} alt="" width={20} height={20} loading="lazy" />
      </div>
      <div className="model-card-text">
        <div className="model-card-name">{model.name}</div>
        {model.subname && <div className="model-card-subname">{model.subname}</div>}
      </div>
      <div className="model-card-count">
        {isLoading ? (
          <span className="count-loading">…</span>
        ) : error ? (
          <span className="count-error">⚠</span>
        ) : count !== null ? (
          <PulsatingNumber value={count} />
        ) : (
          <span className="count-na">–</span>
        )}
      </div>
      <style>{`
        .model-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #111;
          border: 1px solid #222;
          border-radius: 6px;
          cursor: pointer;
          user-select: none;
          min-width: 120px;
          transition: border-color 0.1s, background 0.1s;
        }
        .model-card:hover {
          border-color: #444;
          background: #1a1a1a;
        }
        .model-card.focused {
          border-color: #fff;
          background: #1f1f1f;
        }
        .model-card-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .model-card-icon img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .model-card-text {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .model-card-name {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .model-card-subname {
          font-size: 10px;
          color: #555;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .model-card-count {
          font-family: code, monospace;
          font-size: 14px;
          font-weight: 500;
          min-width: 2em;
          text-align: right;
        }
        .count-loading {
          animation: blink 1s step-end infinite;
        }
        .count-error {
          color: #e44;
        }
        .count-na {
          color: #444;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
