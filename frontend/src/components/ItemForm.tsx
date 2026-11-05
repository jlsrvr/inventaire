import { useState } from 'react'
import { strings, categoryLabels } from '../strings'
import { CATEGORIES, DEFAULT_CATEGORY } from '../lib/categories'
import type { LocalItem } from '../db'

export const ITEM_FORM_TITLE_ID = 'item-form-title'

export interface ItemFormValues {
  name: string
  category: string
  quantity: number
  unit: string
}

const fieldClasses =
  'rounded-md border border-outline bg-surface p-2 text-text focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-1'

export function ItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: LocalItem
  onSave: (values: ItemFormValues) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? DEFAULT_CATEGORY)
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1)
  const [unit, setUnit] = useState(initial?.unit ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name, category, quantity, unit })
  }

  return (
    <form
      className="flex w-full max-w-[480px] flex-col gap-3 rounded-t-xl border-t-4 border-primary bg-surface p-4"
      onSubmit={handleSubmit}
    >
      <h2 id={ITEM_FORM_TITLE_ID} className="m-0 text-primary-dark">
        {initial ? strings.formEditTitle : strings.formAddTitle}
      </h2>
      <label className="flex flex-col gap-1 text-sm text-text-muted">
        {strings.name}
        <input
          className={fieldClasses}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-muted">
        {strings.category}
        <select
          className={fieldClasses}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((slug) => (
            <option key={slug} value={slug}>
              {categoryLabels[slug]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-muted">
        {strings.quantity}
        <input
          className={fieldClasses}
          type="number"
          min={0}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-muted">
        {strings.unit}
        <input className={fieldClasses} value={unit} onChange={(e) => setUnit(e.target.value)} />
      </label>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-outline bg-surface px-3 py-2 text-primary-dark"
          onClick={onCancel}
        >
          {strings.cancel}
        </button>
        <button
          type="submit"
          className="rounded-md border border-primary bg-primary px-3 py-2 font-semibold text-on-primary hover:border-primary-dark hover:bg-primary-dark"
        >
          {strings.save}
        </button>
      </div>
    </form>
  )
}
