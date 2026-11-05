# Le Jadis — Inventaire du chalet

Build spec for a small offline-first mobile web app. Hand this file and the `design/` folder to Claude Code.

## 1. What it is

An inventory of the supplies (food, drinks, cleaning products, tools…) kept at **Le Jadis**, an off-grid chalet with no reliable network.

- People do the count **at the chalet, offline**, on their phones.
- When they get a network again, their changes **sync to everyone else's phone**.
- Main goal: before going up to the chalet, anyone can check what is there and **know what to buy**.
- Users are **not necessarily tech-savvy**: big buttons, plain words, nothing to configure.
- The interface is **French only**.

## 2. Platform (proposed, confirm before building)

The access model ("anyone with the link and the password") points to a **Progressive Web App**:

- Opened from a link, installable on the home screen, no app store.
- A service worker caches the whole app so it opens with no network.
- Data lives on the phone (IndexedDB) and syncs with a small backend when online.

Pick the simplest stack that does this well; nothing in the design depends on a framework.

## 3. Access

- One shared password for the whole chalet. No accounts, no user names, no emails.
- Login screen: password field + "Entrer". Wrong password → inline error under the field: « Mot de passe incorrect. ».
- After one successful login, the phone stays logged in indefinitely (long-lived token stored locally), so the app **works offline** without asking again.
- The server checks the token on every sync request. Changing the shared password on the server should invalidate old tokens.

## 4. Data model

```
Article
  id          string (UUID, generated on the phone)
  nom         string, required, trimmed, 1–60 chars
  categorie   enum: alimentation | boissons | entretien | hygiene | outils | autres
  quantite    integer ≥ 0
  unite       string | null, optional (free text: "kg", "bouteilles", "paquets"…)
  updatedAt   timestamp of the last change
  deletedAt   timestamp | null  (soft delete, so deletions sync)
```

Category labels and display order: Alimentation, Boissons, Entretien, Hygiène, Outils, Autres.

An article is **« Épuisé »** when `quantite === 0`. There is no minimum stock level.

Assumption to confirm: quantities are whole numbers, changed in steps of 1.

## 5. Offline and sync

- Every change (create, edit, quantity +/−, delete) is written to IndexedDB immediately and added to an outbox. Nothing is ever lost by closing the app.
- Sync runs when the app opens, when the network comes back, and when the user taps « Réessayer ». It sends the outbox, then pulls everyone else's changes.
- An article with changes still in the outbox shows the **pending icon** (pink circle, white cloud with an up-arrow) next to its name.
- The header shows « Mis à jour aujourd'hui à 14:05 »: the time of the last successful sync.
- **Conflicts** (two phones changed the same article) are resolved automatically; the user is never asked. Proposed rule: the most recent change (`updatedAt`) wins for the whole article; a delete is kept unless a later edit exists. Confirm with the owner.
- The sync button in the header shows a badge with the number of changes waiting.

## 6. Screens

Reference files are in `design/` (see §9). Phone frame: 390 × 844.

### Connexion (`Login.dc.html`)
Pink header with a house icon, « Le Jadis », title « Inventaire », line « Ce qu'il y a au chalet, pour savoir quoi acheter avant de monter. ». White card overlapping the header: « Mot de passe » field with an « Afficher » toggle, « Entrer » button, help line « Pas de mot de passe ? Demandez-le à la personne qui vous a envoyé le lien. ». Below: « Une fois connecté, l'application marche aussi sans réseau, au chalet. »

### Inventaire (`Main.dc.html`), the home screen
- Pink header: « Le Jadis », « Inventaire », « Mis à jour … ». Right side: « ? » button → Aide, sync button with badge → Synchronisation.
- Offline banner (only when offline), black: « Pas de réseau, tout marche quand même » / « N changements sont gardés sur ce téléphone. Ils partiront dès que vous aurez du réseau. »
- Search field « Rechercher un article » (filters by name, accent- and case-insensitive).
- Horizontal filter chips, single choice: « Tout » (default), « Épuisés · N », then the six categories. Selected chip = pink fill, white text; others = white with outline.
- List grouped by category (fixed order, empty groups hidden), header « Alimentation · 4 ». Articles sorted alphabetically (assumption).
- Each row: name (+ pending icon), unit underneath, « Épuisé » tag when 0, and on the right a **− / quantity / +** stepper. Tapping − or + changes the count instantly (this is the main counting action). − is disabled at 0. Quantity 0 shows in blue.
- Tapping the name/unit area opens Modifier l'article.
- Bottom: big « Ajouter un article » button → Nouvel article.

### Modifier l'article (`Item.dc.html`)
Back link « Inventaire ». Title « Modifier l'article ». Fields: « Nom », « Catégorie » (six big toggle buttons, 3 per row), « Quantité au chalet » (big pink counter with −/+), « Unité (facultatif) ». Buttons: « Enregistrer », « Supprimer l'article » (ask to confirm: « Supprimer « Café » de l'inventaire ? » with « Supprimer » / « Annuler »).

### Nouvel article (`Add.dc.html`)
Same form, empty. « Annuler » instead of the back link, title « Nouvel article », quantity starts at 1, placeholders « Ex. : café, piles, éponges » and « Ex. : kg, bouteilles, paquets ». Name and category are required: the button stays disabled until both are set. Button « Ajouter à l'inventaire », note « Gardé sur ce téléphone, puis envoyé aux autres dès qu'il y a du réseau. ». Warn if an article with the same name already exists in that category.

### Synchronisation (`Sync.dc.html`)
Back link. Title « Synchronisation ». Pink status card. Offline state: « En attente de réseau », « N changements sont gardés sur ce téléphone. Rien n'est perdu : ils seront envoyés aux autres dès que vous aurez du réseau. », « Dernier envoi : … », button « Réessayer ». Also needed (not drawn): a syncing state (« Envoi en cours… ») and an all-done state (« Tout est à jour »). Link « Comment ça marche ? Qui contacter ? » → Aide. List « Pas encore envoyé » (with the pending icon): article name + what changed + time, e.g. « 2 → 0 paquets · 14:05 », « Nouvel article · 13:40 ».

### Aide (`Help.dc.html`)
Three numbered steps explaining sync (« Au chalet, sans réseau », « De retour avec du réseau », « C'est envoyé »), a note that the app handles two people counting the same article, a contact card (« Contactez [Prénom Nom] », « Appeler » → `tel:`, « SMS » → `sms:`, number shown), and the warning « Ne supprimez pas l'application avant d'avoir du réseau : les changements pas encore envoyés seraient perdus. ».

Contact name and number are placeholders: make them configurable (env/config), not hard-coded.

## 7. Design tokens

Font: **Geist** (Google Fonts), weights 400–800, fallback `system-ui, -apple-system, 'Segoe UI', sans-serif`.

| Token | Value | Use |
|---|---|---|
| primary | `#BE185D` | Headers, main buttons, + buttons, selected chips, pending icon |
| primary-dark | `#9D174D` | « ? » button, delete text, text on light pink |
| on-primary | `#FFFFFF` | Text on primary |
| on-primary-muted | `#FFE4F1` | Secondary text on primary |
| tint | `#FCE7F3` | Light pink fills |
| background | `#FDF2F8` | Page background |
| surface | `#FFFFFF` | Cards, inputs |
| text | `#0A0A0A` | Body text; also the offline banner background and the dark + button |
| text-muted | `#4B5563` | Units, hints, dates |
| on-dark-muted | `#B5B5B5` | Secondary text in the black banner |
| outline | `#B0688C` | Input and chip borders (≥3:1 contrast, keep it) |
| divider | `#F8EDF3` | Lines between rows |
| empty | `#1D4ED8` | « Épuisé » tag (white text), zero quantities |
| synced | `#16A34A` | Optional success state |

Radii: rows/inputs/buttons 12px, cards 16px, big blocks 20px, headers 28px bottom corners, steppers and icon badges fully round. Primary button: 58px tall, radius 16px, shadow `0 10px 24px rgba(190,24,93,0.4)`. Cards: shadow `0 10px 30px rgba(190,24,93,0.14)`. Spacing: 20px side margins.

## 8. Accessibility (already checked on the design)

- WCAG AA contrast on every text/background pair (white on primary 6.0:1, muted pink on primary 5.1:1, outline 4.0:1).
- Touch targets ≥ 44px; body text ≥ 15px.
- Icon-only buttons need labels: « Aide », « Synchronisation : … », « Café : plus un » / « Café : moins un ». The pending icon reads « Pas encore envoyé ».
- Never rely on colour alone: « Épuisé » is always written.
- `lang="fr"` on the document.

## 9. The design files

`design/*.dc.html` are the mockups from the design canvas (live version: https://claude.ai/artifact/Cp8Ggv6AWCX7QDe9MyBwbZ). They are written in a canvas-specific format (`<x-dc>`, `<sc-for>`, `{{…}}` placeholders, a `support.js` runtime) and **will not render on their own**. Use them as the exact reference for layout, sizes, colours and French copy; rebuild the UI in the chosen stack. The sample articles inside them are placeholder data.

## 10. Out of scope / open questions

- Shopping list (« À acheter ») view: not requested yet.
- Barcode scanning, photos, minimum stock levels, history per article: not requested.
- Confirm: conflict rule (§5), whole-number quantities (§4), article sort order (§6).
