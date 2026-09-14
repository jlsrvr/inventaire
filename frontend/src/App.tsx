import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db, getMeta, saveItem, adjustQuantity, type LocalItem } from './db'
import { normalise } from './lib/normalise'
import { sync } from './lib/sync'
import { strings } from './strings'
import { Enrol } from './components/Enrol'
import { ItemForm, type ItemFormValues } from './components/ItemForm'
import { ItemList } from './components/ItemList'

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
  const [showShoppingList, setShowShoppingList] = useState(false)
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
    if (showShoppingList) filtered = filtered.filter((item) => item.quantity === 0)
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [items, search, showShoppingList])

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

  const tabBase = 'mr-5 -mb-0.5 border-b-2 px-1 pb-2 font-semibold'
  const tabInactive = 'border-transparent text-[#94836c]'
  const tabActive = 'border-accent text-accent-hover'

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

      <div className="mb-4 flex gap-1 border-b-2 border-[#f1e2cc]" role="tablist">
        <button
          role="tab"
          aria-selected={!showShoppingList}
          className={`${tabBase} ${!showShoppingList ? tabActive : tabInactive}`}
          onClick={() => setShowShoppingList(false)}
        >
          {strings.showAll}
        </button>
        <button
          role="tab"
          aria-selected={showShoppingList}
          className={`${tabBase} ${showShoppingList ? tabActive : tabInactive}`}
          onClick={() => setShowShoppingList(true)}
        >
          {strings.showShoppingList}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-center text-slate-500">
          {showShoppingList ? strings.shoppingListEmpty : strings.emptyList}
        </p>
      ) : (
        <ItemList items={visible} onAdjust={handleAdjust} onEdit={setEditing} />
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
