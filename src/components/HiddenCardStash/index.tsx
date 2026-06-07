import type {Model} from '#src/lib/models/index.ts'
import ModelCard from '#component/ModelCard'

type Props = {
  onUnhide: (modelId: string) => void
  models: Model[]
}

export default function HiddenCardStash({models, onUnhide}: Props) {
  if (models.length === 0) {
    return <div className="stash-empty">All models visible</div>
  }

  return (
    <div className="stash-list">
      {models.map(model => (
        <ModelCard
          key={model.id}
          model={model}
          count={null}
          onClick={() => onUnhide(model.id)}
        />
      ))}
      <style>{`
        .stash-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stash-empty {
          color: #555;
          font-size: 12px;
          padding: 6px 4px;
        }
      `}</style>
    </div>
  )
}
