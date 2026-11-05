import { strings, categoryLabels } from '../strings'
import { chipClassesFor } from '../lib/categoryColors'
import { formatUpdatedAt } from '../lib/formatDate'
import { formatQuantity } from '../lib/formatQuantity'
import type { LocalItem } from '../db'

export function ItemList({
  items,
  onAdjust,
  onEdit,
  showCategory = true,
}: {
  items: LocalItem[]
  onAdjust: (id: string, delta: number) => void
  onEdit: (item: LocalItem) => void
  showCategory?: boolean
}) {
  if (items.length === 0) {
    return <p className="mt-8 text-center text-text-muted">{strings.noResults}</p>
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li
          key={item.id}
          className={
            item.quantity === 0
              ? 'flex items-center justify-between gap-2 rounded-lg border border-[#fde68a] border-l-4 border-l-amber-500 bg-amber-100 px-3 py-2'
              : 'flex items-center justify-between gap-2 rounded-lg border border-divider border-l-4 border-l-tint bg-surface px-3 py-2'
          }
        >
          <button
            className="flex min-w-0 flex-1 flex-col gap-1 border-none bg-transparent p-0 text-left"
            onClick={() => onEdit(item)}
          >
            <span className="font-semibold">{item.name}</span>
            {showCategory && (
              <span
                className={`inline-block w-fit rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${chipClassesFor(item.category)}`}
              >
                {categoryLabels[item.category as keyof typeof categoryLabels] ??
                  item.category}
              </span>
            )}
            <span className="text-[0.7rem] text-text-muted">
              {strings.updatedOn} {formatUpdatedAt(item.updated_at)} {strings.updatedBy}{' '}
              {item.updated_by}
            </span>
          </button>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={strings.decrease(item.name)}
                className="h-8 w-8 rounded-full border border-tint bg-tint p-0 text-lg font-bold text-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => onAdjust(item.id, -1)}
                disabled={item.quantity === 0}
              >
                −
              </button>
              <span className="min-w-6 text-center font-semibold tabular-nums">
                {formatQuantity(item.quantity)}
              </span>
              <button
                type="button"
                aria-label={strings.increase(item.name)}
                className="h-8 w-8 rounded-full border border-tint bg-tint p-0 text-lg font-bold text-primary-dark"
                onClick={() => onAdjust(item.id, 1)}
              >
                +
              </button>
            </div>
            {item.unit && (
              <span className="text-xs font-semibold capitalize">{item.unit}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
