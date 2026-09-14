import { strings, categoryLabels } from '../strings'
import type { LocalItem } from '../db'

export function ItemList({
  items,
  onAdjust,
  onEdit,
}: {
  items: LocalItem[]
  onAdjust: (id: string, delta: number) => void
  onEdit: (item: LocalItem) => void
}) {
  if (items.length === 0) {
    return <p className="empty">{strings.noResults}</p>
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.id} className={item.quantity === 0 ? 'zero' : undefined}>
          <button className="item-main" onClick={() => onEdit(item)}>
            <span className="item-name">{item.name}</span>
            <span className="item-meta">
              {categoryLabels[item.category as keyof typeof categoryLabels] ??
                item.category}
              {item.unit ? ` · ${item.unit}` : ''}
            </span>
          </button>
          <div className="item-stepper">
            <button
              type="button"
              aria-label="-1"
              onClick={() => onAdjust(item.id, -1)}
              disabled={item.quantity === 0}
            >
              −
            </button>
            <span className="item-quantity">{item.quantity}</span>
            <button type="button" aria-label="+1" onClick={() => onAdjust(item.id, 1)}>
              +
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
