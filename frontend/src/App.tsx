import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db, getMeta, saveItem, adjustQuantity, type LocalItem } from './db'
import { normalise } from './lib/normalise'
import { sync } from './lib/sync'
import { strings, categoryLabels } from './strings'
import { CATEGORIES, type CategorySlug } from './lib/categories'
import { Enrol } from './components/Enrol'
import { ItemForm, type ItemFormValues } from './components/ItemForm'
import { ItemList } from './components/ItemList'

type Filter = 'all' | 'shopping' | CategorySlug

const EMPTY_ITEMS: LocalItem[] = []

function useSyncOnConnectivity(enabled: boolean) {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    async function run() {
      setSyncing(true)
      setError(null)
      try {
        await sync()
      } catch {
        if (!cancelled) setError(strings.syncError)
      } finally {
        if (!cancelled) setSyncing(false)
      }
    }

    run()
    window.addEventListener('online', run)
    return () => {
      cancelled = true
      window.removeEventListener('online', run)
    }
  }, [enabled])

  return { syncing, error }
}

function App() {
  const firstName = useLiveQuery(() => getMeta<string>('firstName'))
  const enrolled = firstName !== undefined && firstName !== null

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<LocalItem | 'new' | null>(null)

  const { syncing } = useSyncOnConnectivity(enrolled)

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

  if (!enrolled) {
    return <Enrol onEnrolled={() => {}} />
  }

  async function handleAdjust(id: string, delta: number) {
    await adjustQuantity(id, delta, firstName!)
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
    )
    setEditing(null)
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
        {syncing && <span className="text-xs text-slate-500">{strings.syncing}</span>}
        {!navigator.onLine && (
          <span className="text-xs text-slate-500">{strings.syncOffline}</span>
        )}
      </header>

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
        <div className="fixed inset-0 flex items-end justify-center bg-black/40">
          <ItemForm
            initial={editing === 'new' ? undefined : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
    </div>
  )
}

export default App
