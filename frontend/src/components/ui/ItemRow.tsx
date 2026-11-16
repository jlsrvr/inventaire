import { strings } from '../../strings'
import { formatQuantity } from '../../lib/formatQuantity'
import type { LocalItem } from '../../db'
import { Stepper } from './Stepper'
import { EmptyTag, PendingIcon } from './marks'

/** One article in the inventory list: name + marks, unit, and the − / + stepper. */
export function ItemRow({
  item,
  onAdjust,
  onEdit,
}: {
  item: LocalItem
  onAdjust: (id: string, delta: number) => void
  onEdit: (item: LocalItem) => void
}) {
  const empty = item.quantity === 0
  return (
    <li className="flex min-h-[68px] items-center gap-2.5 border-b border-divider py-2 pr-3 pl-4 last:border-b-0">
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col gap-1 text-left"
        onClick={() => onEdit(item)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-base font-bold">{item.name}</span>
          {item.dirty === 1 && <PendingIcon />}
        </span>
        {(item.unit || empty) && (
          <span className="flex items-center gap-1.5">
            {item.unit && <span className="text-sm font-medium text-text-muted">{item.unit}</span>}
            {empty && <EmptyTag />}
          </span>
        )}
      </button>
      <Stepper
        value={formatQuantity(item.quantity)}
        valueClassName={empty ? 'text-empty' : 'text-text'}
        onDecrease={() => onAdjust(item.id, -1)}
        onIncrease={() => onAdjust(item.id, 1)}
        decreaseLabel={strings.minusOne(item.name)}
        increaseLabel={strings.plusOne(item.name)}
        decreaseDisabled={empty}
      />
    </li>
  )
}
