import { useState } from 'react'
import { strings, categoryLabels } from '../strings'
import { CATEGORIES, DEFAULT_CATEGORY } from '../lib/categories'
import type { LocalItem } from '../db'

export interface ItemFormValues {
  name: string
  category: string
  quantity: number
  unit: string
}

const fieldClasses =
  'rounded-md border border-[#e7cba9] bg-white p-2 text-slate-900 focus:outline focus:outline-2 focus:outline-accent focus:outline-offset-1'

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
      className="flex w-full max-w-[480px] flex-col gap-3 rounded-t-xl border-t-4 border-accent bg-white p-4"
      onSubmit={handleSubmit}
    >
      <h2 className="m-0 text-accent-hover">
        {initial ? strings.formEditTitle : strings.formAddTitle}
      </h2>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        {strings.name}
        <input
          className={fieldClasses}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
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
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        {strings.quantity}
        <input
          className={fieldClasses}
          type="number"
          min={0}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        {strings.unit}
        <input className={fieldClasses} value={unit} onChange={(e) => setUnit(e.target.value)} />
      </label>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-[#e7cba9] bg-white px-3 py-2 text-[#7c4a1e]"
          onClick={onCancel}
        >
          {strings.cancel}
        </button>
        <button
          type="submit"
          className="rounded-md border border-accent bg-accent px-3 py-2 font-semibold text-white hover:border-accent-hover hover:bg-accent-hover"
        >
          {strings.save}
        </button>
      </div>
    </form>
  )
}
