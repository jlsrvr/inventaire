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
import './App.css'

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

  return (
    <div className="app">
      <header>
        <h1>{strings.appName}</h1>
        {syncing && <span className="sync-status">{strings.syncing}</span>}
        {!navigator.onLine && <span className="sync-status">{strings.syncOffline}</span>}
      </header>

      {needRefresh && (
        <div className="update-banner">
          <span>{strings.updateAvailable}</span>
          <button onClick={() => updateServiceWorker(true)}>{strings.reload}</button>
        </div>
      )}

      <div className="toolbar">
        <input
          className="search"
          placeholder={strings.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className={showShoppingList ? 'active' : undefined}
          onClick={() => setShowShoppingList((v) => !v)}
        >
          {showShoppingList ? strings.showAll : strings.showShoppingList}
        </button>
        <button onClick={() => setEditing('new')}>{strings.addItem}</button>
      </div>

      {visible.length === 0 ? (
        <p className="empty">
          {showShoppingList ? strings.shoppingListEmpty : strings.emptyList}
        </p>
      ) : (
        <ItemList items={visible} onAdjust={handleAdjust} onEdit={setEditing} />
      )}

      {editing && (
        <div className="modal">
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
