import { strings, categoryLabels } from '../strings'
import { chipClassesFor } from '../lib/categoryColors'
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
    return <p className="mt-8 text-center text-slate-500">{strings.noResults}</p>
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li
          key={item.id}
          className={
            item.quantity === 0
              ? 'flex items-center justify-between gap-2 rounded-lg border border-[#fde68a] border-l-4 border-l-amber-500 bg-amber-100 px-3 py-2'
              : 'flex items-center justify-between gap-2 rounded-lg border border-[#f1e2cc] border-l-4 border-l-accent-soft bg-white px-3 py-2'
          }
        >
          <button
            className="flex min-w-0 flex-1 flex-col gap-1 border-none bg-transparent p-0 text-left"
            onClick={() => onEdit(item)}
          >
            <span className="font-semibold">{item.name}</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${chipClassesFor(item.category)}`}
              >
                {categoryLabels[item.category as keyof typeof categoryLabels] ??
                  item.category}
              </span>
              {item.unit ? <span className="text-slate-400">{item.unit}</span> : null}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="-1"
              className="h-8 w-8 rounded-full border border-accent-soft bg-accent-soft p-0 text-lg font-bold text-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => onAdjust(item.id, -1)}
              disabled={item.quantity === 0}
            >
              −
            </button>
            <span className="min-w-6 text-center font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="+1"
              className="h-8 w-8 rounded-full border border-accent-soft bg-accent-soft p-0 text-lg font-bold text-accent-hover"
              onClick={() => onAdjust(item.id, 1)}
            >
              +
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
