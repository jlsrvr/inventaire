import { useId, useState } from 'react'
import { strings, categoryLabels } from '../strings'
import { CATEGORIES, DEFAULT_CATEGORY } from '../lib/categories'
import { formatRelativeMoment } from '../lib/formatDate'
import { roundQuantity, type LocalItem } from '../db'
import { parseQuantity, toEditableQuantity } from '../lib/formatQuantity'
import { Sheet } from './ui/Sheet'
import { Chip } from './ui/Chip'
import { Stepper } from './ui/Stepper'
import { TextField } from './ui/TextField'
import { PrimaryButton } from './ui/PrimaryButton'

export interface ItemFormValues {
  name: string
  category: string
  quantity: number
  unit: string
}

/** Modifier l'article / Nouvel article, as a slide-up sheet. */
export function ItemForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: LocalItem
  onSave: (values: ItemFormValues) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? DEFAULT_CATEGORY)
  const [quantityText, setQuantityText] = useState(toEditableQuantity(initial?.quantity ?? 1))
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const qtyLabelId = useId()

  const quantity = parseQuantity(quantityText)
  const canSave = name.trim() !== '' && quantity !== null

  function step(delta: number) {
    setQuantityText(toEditableQuantity(roundQuantity((quantity ?? 0) + delta)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    onSave({ name, category, quantity: quantity!, unit })
  }

  return (
    <Sheet title={initial ? strings.formEditTitle : strings.formAddTitle} onClose={onClose}>
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
        {initial && (
          <p className="m-0 -mt-1.5 text-sm font-medium text-text-muted">
            {strings.lastEdited(formatRelativeMoment(initial.updated_at), initial.updated_by)}
          </p>
        )}

        <TextField label={strings.name} value={name} onChange={(e) => setName(e.target.value)} required />

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-1.5 p-0 text-[15px] font-bold">{strings.category}</legend>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((slug) => (
              <Chip key={slug} size="category" pressed={category === slug} onClick={() => setCategory(slug)}>
                {categoryLabels[slug]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div
          role="group"
          aria-labelledby={qtyLabelId}
          className="flex items-center justify-between gap-3 rounded-card bg-tint py-2.5 pr-2.5 pl-4"
        >
          <div className="flex flex-col gap-0.5">
            <span id={qtyLabelId} className="text-[15px] font-bold">
              {strings.quantity}
            </span>
            <span className="text-sm font-medium text-text-muted">{unit.trim() || strings.noUnit}</span>
          </div>
          <Stepper
            size="sheet"
            value={
              <input
                aria-labelledby={qtyLabelId}
                inputMode="decimal"
                className="w-16 rounded-control bg-transparent text-center outline-none focus:bg-surface aria-invalid:text-error"
                aria-invalid={quantity === null}
                value={quantityText}
                onChange={(e) => setQuantityText(e.target.value)}
              />
            }
            onDecrease={() => step(-1)}
            onIncrease={() => step(1)}
            decreaseLabel={strings.stepDown}
            increaseLabel={strings.stepUp}
            decreaseDisabled={quantity === null || quantity <= 0}
          />
        </div>

        <TextField
          label={strings.unit}
          hint={strings.optional}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />

        <PrimaryButton type="submit" className="mt-0.5" disabled={!canSave}>
          {strings.save}
        </PrimaryButton>
      </form>
    </Sheet>
  )
}
