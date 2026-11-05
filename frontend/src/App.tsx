import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db, getMeta, saveItem, adjustQuantity, type LocalItem } from './db'
import { normalise } from './lib/normalise'
import { formatRelativeMoment } from './lib/formatDate'
import { LAST_SYNCED_AT } from './lib/sync'
import { strings, categoryLabels } from './strings'
import { CATEGORIES, DEFAULT_CATEGORY, type CategorySlug } from './lib/categories'
import { Enrol } from './components/Enrol'
import { ItemForm, type ItemFormValues } from './components/ItemForm'
import { Card } from './components/ui/Card'
import { Chip } from './components/ui/Chip'
import { ItemRow } from './components/ui/ItemRow'
import { OfflineBanner } from './components/ui/OfflineBanner'
import { HeaderTitle, PinkHeader } from './components/ui/PinkHeader'
import { PrimaryButton } from './components/ui/PrimaryButton'
import { PlusIcon, SearchIcon } from './components/ui/icons'
import { useOnline } from './hooks/useOnline'
import { useSync } from './hooks/useSync'

type Filter = 'all' | 'empty' | CategorySlug

const EMPTY_ITEMS: LocalItem[] = []

/** Items whose category isn't a known slug are shown with « Autres ». */
function groupOf(item: LocalItem): CategorySlug {
  return (CATEGORIES as readonly string[]).includes(item.category)
    ? (item.category as CategorySlug)
    : DEFAULT_CATEGORY
}

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
  const pendingCount = useLiveQuery(() => db.items.where('dirty').equals(1).count(), [], 0) ?? 0
  const lastSyncedAt = useLiveQuery(() => getMeta<string>(LAST_SYNCED_AT))

  const emptyCount = useMemo(() => items.filter((item) => item.quantity === 0).length, [items])

  const groups = useMemo(() => {
    const term = normalise(search.trim())
    const visible = items
      .filter((item) => item.search_name.includes(term))
      .filter((item) =>
        filter === 'all' ? true : filter === 'empty' ? item.quantity === 0 : groupOf(item) === filter,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    return CATEGORIES.map((slug) => ({
      slug,
      items: visible.filter((item) => groupOf(item) === slug),
    })).filter((group) => group.items.length > 0)
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

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: strings.showAll },
    { key: 'empty', label: strings.showEmpty(emptyCount) },
    ...CATEGORIES.map((slug) => ({ key: slug, label: categoryLabels[slug] })),
  ]

  const emptyMessage = search.trim()
    ? strings.noResults
    : filter === 'empty'
      ? strings.shoppingListEmpty
      : filter === 'all'
        ? strings.emptyList
        : strings.categoryEmpty

  const showNotices = !online || syncError === 'unauthorized' || needRefresh

  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col">
      <PinkHeader>
        <HeaderTitle
          title={strings.appName}
          subtitle={
            <>
              <span className="text-sm font-medium text-on-primary-muted">
                {lastSyncedAt
                  ? strings.lastSynced(formatRelativeMoment(lastSyncedAt))
                  : strings.neverSynced}
              </span>
              <span role="status" className="text-sm font-medium text-on-primary-muted empty:hidden">
                {online && syncing ? strings.syncing : online && syncError === 'failed' ? strings.syncError : ''}
              </span>
            </>
          }
        />
      </PinkHeader>

      {showNotices && (
        <div className="relative mx-5 -mt-[22px] flex flex-col gap-2">
          {!online && <OfflineBanner pendingCount={pendingCount} />}
          {syncError === 'unauthorized' && (
            <Card className="flex-row items-center justify-between gap-3 px-3.5 py-3">
              <span className="text-[15px] font-semibold text-primary-dark">{strings.syncUnauthorized}</span>
              <button
                className="h-11 shrink-0 rounded-control bg-primary px-4 font-bold text-on-primary"
                onClick={() => setReenrolling(true)}
              >
                {strings.reenrolAction}
              </button>
            </Card>
          )}
          {needRefresh && (
            <Card className="flex-row items-center justify-between gap-3 px-3.5 py-3">
              <span className="text-[15px] font-semibold">{strings.updateAvailable}</span>
              <button
                className="h-11 shrink-0 rounded-control bg-primary px-4 font-bold text-on-primary"
                onClick={() => updateServiceWorker(true)}
              >
                {strings.reload}
              </button>
            </Card>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-4 pb-2">
        <label className="mx-5 flex h-[52px] items-center gap-2.5 rounded-control bg-surface px-3.5 inset-ring inset-ring-outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-primary">
          <SearchIcon size={20} className="shrink-0" />
          <span className="sr-only">{strings.searchLabel}</span>
          <input
            type="search"
            className="min-w-0 flex-1 bg-transparent text-base font-medium text-text outline-none"
            placeholder={strings.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div role="group" aria-label={strings.filterLabel} className="flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => (
            <Chip key={chip.key} pressed={filter === chip.key} onClick={() => setFilter(chip.key)}>
              {chip.label}
            </Chip>
          ))}
        </div>
      </div>

      <main className="flex flex-1 flex-col gap-4 px-5 pt-1 pb-4">
        {groups.length === 0 ? (
          <p className="mt-8 text-center text-text-muted">{emptyMessage}</p>
        ) : (
          groups.map((group) => (
            <section key={group.slug} className="flex flex-col gap-2" aria-labelledby={`group-${group.slug}`}>
              <h2 id={`group-${group.slug}`} className="m-0 text-[17px] font-extrabold">
                {categoryLabels[group.slug]}{' '}
                <span className="font-medium text-text-muted">· {group.items.length}</span>
              </h2>
              <Card>
                <ul className="m-0 list-none p-0">
                  {group.items.map((item) => (
                    <ItemRow key={item.id} item={item} onAdjust={handleAdjust} onEdit={setEditing} />
                  ))}
                </ul>
              </Card>
            </section>
          ))
        )}
      </main>

      <div className="sticky bottom-0 border-t border-divider-strong bg-background px-5 pt-3.5 pb-[calc(28px+env(safe-area-inset-bottom))]">
        <PrimaryButton onClick={() => setEditing('new')}>
          <PlusIcon size={22} />
          {strings.addItem}
        </PrimaryButton>
      </div>

      {editing && (
        <ItemForm
          initial={editing === 'new' ? undefined : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {reenrolling && (
        <Enrol
          reenrol
          initialFirstName={firstName!}
          onClose={() => setReenrolling(false)}
          onEnrolled={() => {
            setReenrolling(false)
            syncNow()
          }}
        />
      )}
    </div>
  )
}

export default App
