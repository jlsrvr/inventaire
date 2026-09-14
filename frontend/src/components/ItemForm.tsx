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
    <form className="item-form" onSubmit={handleSubmit}>
      <h2>{initial ? strings.formEditTitle : strings.formAddTitle}</h2>
      <label>
        {strings.name}
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      </label>
      <label>
        {strings.category}
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((slug) => (
            <option key={slug} value={slug}>
              {categoryLabels[slug]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {strings.quantity}
        <input
          type="number"
          min={0}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
        />
      </label>
      <label>
        {strings.unit}
        <input value={unit} onChange={(e) => setUnit(e.target.value)} />
      </label>
      <div className="item-form-actions">
        <button type="button" onClick={onCancel}>
          {strings.cancel}
        </button>
        <button type="submit">{strings.save}</button>
      </div>
    </form>
  )
}
