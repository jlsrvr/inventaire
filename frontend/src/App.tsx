import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db, getMeta, saveItem, adjustQuantity, type LocalItem } from './db'
import { normalise } from './lib/normalise'
import { strings, categoryLabels } from './strings'
import { CATEGORIES, type CategorySlug } from './lib/categories'
import { Enrol, ENROL_TITLE_ID } from './components/Enrol'
import { ItemForm, ITEM_FORM_TITLE_ID, type ItemFormValues } from './components/ItemForm'
import { ItemList } from './components/ItemList'
import { Dialog } from './components/Dialog'
import { useOnline } from './hooks/useOnline'
import { useSync } from './hooks/useSync'

type Filter = 'all' | 'shopping' | CategorySlug

const EMPTY_ITEMS: LocalItem[] = []

function App() {
  // `undefined` while IndexedDB is still loading — distinct from "not enrolled",
  // so an enrolled user never sees the enrolment form flash on launch.
  const me = useLiveQuery(async () => ({
    firstName: (await getMeta<string>('firstName')) ?? null,
  }))
  const firstName = me?.firstName ?? null
  const enrolled = firstName !== null

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<LocalItem | 'new' | null>(null)
  const [reenrolling, setReenrolling] = useState(false)

  const online = useOnline()
  const { syncing, error: syncError, requestSync, syncNow } = useSync(enrolled)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const items = useLiveQuery(() => db.items.toArray(), [], EMPTY_ITEMS) ?? EMPTY_ITEMS

  const visible = useMemo(() => {
    const term = normalise(search.trim())
    let filtered = items.filter((item) => item.search_name.includes(term))
    if (filter === 'shopping') {
      filtered = filtered.filter((item) => item.quantity === 0)
    } else if (filter !== 'all') {
      filtered = filtered.filter((item) => item.category === filter)
    }
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [items, search, filter])

  if (me === undefined) return null
  if (!enrolled) {
    return <Enrol onEnrolled={() => {}} />
  }

  async function handleAdjust(id: string, delta: number) {
    await adjustQuantity(id, delta, firstName!)
    requestSync()
  }

  async function handleSave(values: ItemFormValues) {
    await saveItem(
      {
        id: editing !== 'new' ? editing?.id : undefined,
        name: values.name,
        category: values.category,
        quantity: values.quantity,
        unit: values.unit,
      },
      firstName!,
      editing !== 'new' && editing ? editing : undefined,
    )
    setEditing(null)
    requestSync()
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: strings.showAll },
    { key: 'shopping', label: strings.showShoppingList },
    ...CATEGORIES.map((slug) => ({ key: slug, label: categoryLabels[slug] })),
  ]

  const tabBase = 'shrink-0 mr-5 -mb-0.5 border-b-2 px-1 pb-2 font-semibold whitespace-nowrap'
  const tabInactive = 'border-transparent text-[#94836c]'
  const tabActive = 'border-accent text-accent-hover'

  const emptyMessage = search.trim()
    ? strings.noResults
    : filter === 'shopping'
      ? strings.shoppingListEmpty
      : filter === 'all'
        ? strings.emptyList
        : strings.categoryEmpty

  return (
    <div className="mx-auto max-w-[640px] p-4">
      <header className="mb-4 flex items-baseline gap-3">
        <h1 className="text-xl font-semibold text-accent-hover">{strings.appName}</h1>
        <span role="status" className="text-xs text-slate-500">
          {!online
            ? strings.syncOffline
            : syncing
              ? strings.syncing
              : syncError === 'failed'
                ? strings.syncError
                : ''}
        </span>
      </header>

      {syncError === 'unauthorized' && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg bg-amber-100 px-3 py-2 text-amber-900">
          <span>{strings.syncUnauthorized}</span>
          <button
            className="shrink-0 rounded-md bg-white px-3 py-1.5 font-semibold text-accent-hover"
            onClick={() => setReenrolling(true)}
          >
            {strings.reenrolAction}
          </button>
        </div>
      )}

      {needRefresh && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-accent px-3 py-2 text-white">
          <span>{strings.updateAvailable}</span>
          <button
            className="rounded-md bg-white px-3 py-1.5 font-semibold text-accent-hover"
            onClick={() => updateServiceWorker(true)}
          >
            {strings.reload}
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          aria-label={strings.searchLabel}
          className="min-w-[150px] flex-1 rounded-md border border-[#e7cba9] bg-white p-2 text-slate-900 focus:outline focus:outline-2 focus:outline-accent focus:outline-offset-1"
          placeholder={strings.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="rounded-md border border-accent bg-accent px-3 py-2 font-semibold text-white hover:border-accent-hover hover:bg-accent-hover"
          onClick={() => setEditing('new')}
        >
          {strings.addItem}
        </button>
      </div>

      <div
        className="mb-4 flex overflow-x-auto border-b-2 border-[#f1e2cc]"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            className={`${tabBase} ${filter === tab.key ? tabActive : tabInactive}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-slate-500">{emptyMessage}</p>
      ) : (
        <ItemList
          items={visible}
          onAdjust={handleAdjust}
          onEdit={setEditing}
          showCategory={filter === 'all' || filter === 'shopping'}
        />
      )}

      {editing && (
        <Dialog labelledBy={ITEM_FORM_TITLE_ID} onClose={() => setEditing(null)}>
          <ItemForm
            initial={editing === 'new' ? undefined : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Dialog>
      )}

      {reenrolling && (
        <Dialog labelledBy={ENROL_TITLE_ID} onClose={() => setReenrolling(false)}>
          <Enrol
            reenrol
            initialFirstName={firstName!}
            onEnrolled={() => {
              setReenrolling(false)
              syncNow()
            }}
          />
        </Dialog>
      )}
    </div>
  )
}

export default App
