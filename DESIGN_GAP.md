# Design gap report: design-handoff vs. existing app

Step 1 of `design-handoff/DESIGN-MERGE.md`. Audit only: no code changed.

Sources compared: `design-handoff/SPEC.md` §6–8, the six `design/*.dc.html` files,
and the current client (`frontend/src`: `App.tsx`, `components/*`, `strings.ts`,
`index.css`, `db.ts`, `lib/sync.ts`, `hooks/*`), plus `backend/models.py`.

---

## 0. Decisions

Places where the design contradicts a decision recorded in `CLAUDE.md` or the
data/sync layer, which DESIGN-MERGE says the existing code owns.

| # | Topic | Decision |
|---|---|---|
| D1 | Design has a « Supprimer » button on the Modifier sheet + soft delete (`deletedAt`) | ✅ **Decided: leave it out**, confirmed again after the sheet redesign. No delete, as in CLAUDE.md; zeros stay the shopping list. « Enregistrer » takes the full width. |
| D2 | Design assumes whole numbers, ±1 steps | ✅ **Decided: keep decimals.** ±1 steppers unchanged; on the edit/add sheets the counter number is typeable (`inputmode="decimal"`) so 1,5 can be entered. |
| D3 | Design has a password-only login, no names | ✅ **Decided: keep Prénom** as a second field in the Connexion card (it fills `updated_by`, which the server requires). |
| D4 | Category label « Autres » vs « Autre » | ✅ **Decided: label becomes « Autres »**, slug stays `other` (no server change). |
| D5 | « Nouvel article »: no category preselected, button disabled until name and category are set | ✅ **Decided: follow the design.** `DEFAULT_CATEGORY` stays as the data fallback in `db.ts`. |
| D6 | Font: Geist from Google Fonts (would not load offline) | ✅ **Decided: system font stack, no download.** `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`, already Geist's fallback in SPEC §7. Renders as San Francisco on iPhone (very close to Geist) and Roboto on Android. |
| D7 | Aide « Un problème ? » contact card (name, Appeler / SMS, number) | ✅ **Decided: remove the contact card entirely.** No contact config needed. |
| D8 | Navigation | ✅ **Updated design received: slide-up sheets** for Modifier, Nouvel article, Synchronisation and Aide, over the Inventaire screen. Connexion and Inventaire stay full screens. The app already uses a bottom-sheet `Dialog` (focus trap, Escape to close, focus restored), so this is a restyle, not new navigation. |

---

## 1. Data the design needs that the app doesn't track

| Need | Used by | Today | Smallest addition |
|---|---|---|---|
| Per-article "not sent yet" flag | Pending icon on rows | ✅ `LocalItem.dirty === 1` | None |
| Count of unsent changes | Sync badge, offline banner, Sync card | Derivable, never counted | `useLiveQuery(() => db.items.where('dirty').equals(1).count())` |
| Time of the last successful sync | Header « Mis à jour aujourd'hui à 14:05 », Sync « Dernier envoi : samedi à 09:12 » | ❌ Only the `seq` cursor is stored | `setMeta('lastSyncedAt', new Date().toISOString())` at the end of a successful `sync()` in `lib/sync.ts` |
| What changed per pending article, e.g. « 2 → 0 paquets », « Nouvel article » | Sync screen list | ❌ No previous value kept | « Nouvel article » = dirty row with `seq === 0` (already true today). For "before → after": an optional, non-indexed, client-only field on `LocalItem` (e.g. `synced_quantity`), set when a clean row first becomes dirty. A server row overwriting it clears it, so no Dexie schema bump and no server change. |
| Duplicate check: same name in the same category | « Nouvel article » warning | ❌ (duplicates tolerated, avoided by search-first UI) | Query on `search_name` + `category`. Warning only, never blocks. Consistent with CLAUDE.md. |

Open copy questions the design doesn't cover:
- Header text before the **first** sync (no `lastSyncedAt` yet), and for dates other than today/yesterday.
- Sync list wording for edits that aren't quantity changes (rename, category, unit). Proposal: « Modifié · 14:05 ».

---

## 2. Cross-cutting

| Area | Design | App | Gap |
|---|---|---|---|
| Colours | Pink palette, SPEC §7 (14 tokens), plus two used in the files but not in the table: `#F3D0E2` (bottom bar line, Sync list outline) and `#E3C7D6` (sheet handle) | Orange `--color-accent*` in `index.css` plus many hard-coded hex values (`#fdf6ec`, `#e7cba9`, `#f1e2cc`, `#94836c`, `#7c4a1e`, `#e2b78e`, amber/slate utilities) | Replace with the design tokens in `@theme` (Tailwind v4 is already the theme system) |
| Font | Geist 400–800 | System `font-sans` | See D6 (proposed: explicit system stack, weights 400–800) |
| Radii / shadows | 12 / 16 / 20 / 28px; button and card shadows; sheet shadow `0 -10px 40px rgba(0,0,0,0.25)` | `rounded-md` / `rounded-lg`, no shadows | Add as tokens |
| Sheets | Backdrop `rgba(10,10,10,0.5)`; white panel, 28px top corners, padding 10/20/28px, 14px gaps; grab handle 40×5px `#E3C7D6`; header row with 24px/800 title and a round 44px ✕ button (`aria-label` « Fermer », tint fill, primary-dark icon) | `Dialog`: `bg-black/40` backdrop; the content draws its own panel (`rounded-t-xl border-t-4`) with no handle and no close button | Restyle `Dialog` into the one shared sheet (backdrop, panel, handle, title + ✕). Tapping the backdrop also closes it (it doesn't today). The handle is decorative (`aria-hidden`), so no drag-to-close. Not in the design: the sheet needs a max height with its content scrolling, since Modifier/Nouvel are taller than smaller phones and the keyboard covers half the screen. Optional: the phone's back button closes the sheet (`history.pushState`). |
| Page width | 390px phone frame, 20px side margins | `max-w-[640px] p-4` (16px) | Margins → 20px |
| `lang="fr"` | Required | ✅ `index.html` | — |
| Theme colour | Pink header | `theme-color` meta and manifest `#1e293b` | Align with `primary` (browser bar colour) |
| Category colours | None: categories are group headers and chips, not coloured badges | `lib/categoryColors.ts` (one colour per category) | No longer used once rows are grouped (see Inventaire) |
| Touch targets ≥ 44px | All controls | Steppers are 32px (`h-8 w-8`), tab buttons small | Fixed by the restyle |

**Shared components** (DESIGN-MERGE step 3) the restyle needs: primary button, filter
chip, − / + stepper (44px for rows, 48px for the sheets' quantity row), article row, « Épuisé »
tag, pending icon, offline banner, pink header, card, slide-up sheet (restyled `Dialog`), text input. Today only
`Dialog` exists as a reusable piece. Buttons and inputs are inline class strings
repeated across `App`, `ItemForm` and `Enrol`.

---

## 3. Screens

### Connexion (`Login.dc.html`), today `components/Enrol.tsx`

**Matches**
- Password field; error « Mot de passe incorrect. » shown inline under the form.
- Long-lived token, works offline after the first login.

**Differs**
- Plain centred form, titled « Bienvenue » / intro « Entrez votre prénom… ». The design has a pink header with a house icon, « Le Jadis », « Inventaire » and a tagline, plus a white card overlapping it.
- Button « Commencer » → « Entrer ».
- Label « Mot de passe » is the same text, but restyled (56px field).

**Missing**
- « Afficher » toggle on the password field.
- Help line « Pas de mot de passe ? Demandez-le… ».
- Reassurance line « Une fois connecté, l'application marche aussi sans réseau, au chalet. » with a check icon.

**In the app, not in the design** (keep, restyle, owner to confirm)
- **Prénom** field (D3).
- Errors « Trop de tentatives… » and « Impossible de vérifier le mot de passe hors ligne… ».
- Re-enrolment variant (« Mot de passe à ressaisir », shown in a dialog after a 401).

### Inventaire (`Main.dc.html`), today `App.tsx` + `components/ItemList.tsx`

**Matches**
- Search is accent- and case-insensitive (`search_name`).
- Single-choice filter: Tout / zeros / each category.
- Alphabetical sort with `localeCompare(…, 'fr')`.
- − / + steppers on each row change the count instantly; − is disabled at 0.
- Tapping the name area opens the edit form.

**Differs**
- **Header:** a plain « Inventaire » title with a small status text. The design has a pink header with « Le Jadis », a large title, « Mis à jour … », a « ? » button and a sync button with a badge.
- **Filters:** underlined tabs (`role="tab"`). The design uses pill chips with `aria-pressed`: pink when selected, outlined otherwise, 40px tall.
- **Zero filter label:** « Liste de courses » → « Épuisés · N » (with count).
- **Category label:** « Autre » → « Autres » (D4).
- **Search placeholder:** « Rechercher un article… » → no ellipsis. Add the search icon.
- **List:** one flat list. The design groups by category in fixed order, hides empty groups, uses the header « Alimentation · 4 », and puts each group in a white card with dividers.
- **Row:**
  - **Today:** amber card for zeros, category badge, unit under the stepper, quantity in plain weight.
  - **Design:** unit under the name, « Épuisé » tag (blue `#1D4ED8`, white text) when 0, quantity 22px/800 in blue when 0, row min-height 68px, steppers 44px (− outlined, + filled pink).
- **Stepper labels:** « Retirer 1 à Café » / « Ajouter 1 à Café » → « Café : moins un » / « Café : plus un ».
- **Add button:** small « Ajouter » next to search → full-width 58px « Ajouter un article » button fixed at the bottom.
- **Status:**
  - **Today:** « Hors ligne » / « Synchronisation… » / « Échec… » text in the header.
  - **Design:** a black offline banner, plus the sync button's icon, badge and `aria-label` (« Synchronisation : hors ligne, 3 changements en attente »).

**Missing**
- Pending icon next to the names of unsent articles (data exists: `dirty`).
- Offline banner « Pas de réseau, tout marche quand même » / « N changements sont gardés… ».
- « Mis à jour … » line (needs `lastSyncedAt`).
- « ? » → Aide and sync button → Synchronisation.
- Badge with the unsent count.
- Category grouping with counts.
- « Épuisé » tag.

**In the app, not in the design** (keep, restyle, owner to confirm)
- « Modifié le 14/09/2026 par Jules » line on every row. Proposal: move it to the Modifier l'article screen so rows stay at the design's height.
- Category badge on rows. Redundant once rows are grouped, so I'd drop it rather than keep it.
- « Une nouvelle version est disponible » / « Recharger » banner (PWA update).
- « Synchronisation suspendue : mot de passe à ressaisir » / « Ressaisir » banner (401).
- « Échec de la synchronisation » state (online but sync failed).
- Empty states: « Aucun article. Ajoutez-en un. », « Aucun résultat. », « Rien à racheter. », « Aucun article dans cette catégorie. ». With grouping, an empty category filter just shows nothing, so these texts are still needed.
- Decimal display (« 1,5 ») via `formatQuantity` (D2).

### Modifier l'article (`Item.dc.html`), today `components/ItemForm.tsx` in a bottom sheet

**Matches**
- Fields Nom / Catégorie / Quantité / Unité.
- « Enregistrer ».
- Save only writes changed fields (`saveItem` with `base`).

**Differs**
- **Layout:** already a bottom sheet; restyle to the shared sheet (D8, §2), title « Modifier l'article », ✕ to close.
- **Category:** `<select>` → six toggle buttons in a 3×2 grid, `aria-pressed`, 44px.
- **Quantity:**
  - **Today:** number input labelled « Quantité ».
  - **Design:** a light-pink (`tint`) row, radius 16px: « Quantité au chalet » with the unit underneath (or « sans unité ») on the left; on the right, 48px −/+ buttons (− white with outline, + pink) around a 30px/800 number. Labels « Moins un » / « Plus un ». The number becomes typeable for decimals (D2).
- **Unit label:** « Unité (optionnel) » → « Unité (facultatif) », with « (facultatif) » in muted weight.
- **Buttons:** right-aligned « Annuler » / « Enregistrer » → a single full-width 58px « Enregistrer » (the design pairs it with « Supprimer », which is left out, D1). « Annuler » is replaced by the ✕.

**Not building**
- « Supprimer » button (D1: left out).

**In the app, not in the design**
- Decimal quantity entry (D2).
- Escape-to-close and the focus trap: kept, since sheets stay (D8).

### Nouvel article (`Add.dc.html`), today the same `ItemForm`

**Matches**
- Title « Nouvel article ».
- Quantity starts at 1.
- Name required.

**Differs**
- Same sheet and quantity row as Modifier (D8), title « Nouvel article », ✕ to close. « Ajouter à l'inventaire » is full width with the note under it.
- **Placeholders:** « Ex. : café, piles, éponges » and « Ex. : kg, bouteilles, paquets ».
- **Button:** « Enregistrer » → « Ajouter à l'inventaire ».
- **Disabled state:** the button is disabled until both name and category are set; today only `required` on the name is used (D5).
- **Category:** no default selected (D5).

**Missing**
- Note « Gardé sur ce téléphone, puis envoyé aux autres dès qu'il y a du réseau. ».
- Duplicate warning (same name, same category). Copy not given in the design. Proposal: « « Café » existe déjà dans Alimentation. ».

### Synchronisation (`Sync.dc.html`): **does not exist** (slide-up sheet, D8)

Everything is missing. Behaviour that already exists underneath:
- `syncNow()` from `useSync` (for « Réessayer »).
- `online`, `syncing` and `error` states.

To build:
- Shared sheet, title « Synchronisation », ✕ to close.
- Pink status card (radius 20px, padding 18px, no shadow) with five states. The design draws only the first; SPEC names the next two; the last two exist in the app but have no design.
  - **Offline:** « En attente de réseau » + « N changements sont gardés sur ce téléphone. Rien n'est perdu : ils partiront dès que vous aurez du réseau. »
  - **Syncing:** « Envoi en cours… ».
  - **All done:** « Tout est à jour ».
  - **Failed:** not designed. Reuse the card with « Échec de la synchronisation ».
  - **Unauthorized:** not designed. Reuse the card with the re-enter-password action.
- « Dernier envoi : … » (needs `lastSyncedAt`).
- « Réessayer » button (48px, white on pink).
- « Pas encore envoyé » list, heading with the pending icon: name + change + time (needs the data from §1). Outlined list (`#F3D0E2`), no shadow.
- Link « Comment ça marche ? » below the list → opens the Aide sheet (replaces the Sync sheet).

### Aide (`Help.dc.html`): **does not exist** (slide-up sheet, D8)

Everything is missing. Static content in the shared sheet, title « Aide », ✕ to close:
- « Comment les changements sont envoyés » with three numbered steps (28px pink circles). Step 3: « L'icône du nuage disparaît des articles et la date « Mis à jour » change. » (no inline icon any more).
- The two-people note.
- The « Ne supprimez pas l'application… » warning, plain text, no icon.

The contact card (D7) is already gone from the updated design.

Note: step 3 says the « Mis à jour » date changes. That depends on `lastSyncedAt` (§1).

---

## 4. Summary of what exists in the app but not in the design

To keep (restyled) unless you say otherwise:
1. Prénom at enrolment, and `updated_by` (D3).
2. « Modifié le … par … » metadata (proposed: move to the Modifier sheet, under the title).
3. Decimal quantities (D2).
4. Re-enrolment flow after a 401, its banner and the « Ressaisir » action.
5. Sync failure state.
6. Login errors: too many attempts, offline at enrolment.
7. PWA « nouvelle version » banner.
8. Empty-state messages.

To drop:

9. Category badges on rows, replaced by grouping.
10. `lib/categoryColors.ts`.

---

## 5. Proposed order once approved

Following DESIGN-MERGE steps 2–5:

1. Tokens + font (D6).
2. Shared components.
3. Screens, one commit each: Inventaire → Modifier → Nouvel → Connexion → Synchronisation → Aide.

The data additions from §1 (`lastSyncedAt`, unsent count, `synced_quantity`) go in with the first screen that needs them. Each screen is checked at 390 × 844 against its design file. Existing Vitest tests (`App.test.tsx`, `components.test.tsx`) are updated where copy or roles change (tabs → `aria-pressed` chips, stepper labels).
