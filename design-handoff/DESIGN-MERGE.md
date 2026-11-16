# Applying the new design to the existing app

The app already exists in this repository. This folder brings a finished design for it. Your job is to make the existing app match the design **without rebuilding what already works**.

## Source of truth

| Topic | Source of truth |
|---|---|
| Layout, colours, type, spacing, radii, shadows | **Design** (`design/*.dc.html`, SPEC.md §7) |
| All text the user reads (French copy) | **Design** |
| What is on each screen and how it behaves (steppers in the list, filter chips, pending icon, offline banner, help page…) | **Design** (SPEC.md §6) |
| Accessibility (contrast, 44px targets, labels) | **Design** (SPEC.md §8) |
| Data storage, sync engine, auth, API, build tooling | **Existing code** |

When the design needs something the code doesn't provide yet (e.g. a count of unsent changes, the last sync time, a per-article "not sent yet" flag), add the smallest thing that supplies it. Don't rewrite the data or sync layer.

When the existing app has something the design doesn't show (an extra field, screen or setting), **keep it**, restyle it with the design tokens, and list it in the gap report so the owner can decide.

## How to read the design files

`design/*.dc.html` use a canvas-specific format: `<x-dc>` wrapper, `<sc-for>` loops, `<sc-if>` conditions, `{{…}}` placeholders filled by the `renderVals()` script at the bottom, and a `support.js` runtime that is not included. They won't render on their own. Read them as markup: inline styles give exact sizes and colours, the text is the final copy, and the script shows the sample data and per-state styles. Phone frame: 390 × 844.

## Steps

1. **Audit first, change nothing.** Read SPEC.md §6–8 and every design file, then the existing app. Write `DESIGN_GAP.md` with one section per screen (Connexion, Inventaire, Modifier l'article, Nouvel article, Synchronisation, Aide): what already matches, what differs, what's missing, and what exists in the app but not in the design. Also list any data the design needs that the app doesn't track. Stop and wait for review.
2. **Tokens.** Put the colours, font (Geist), radii and shadows from SPEC.md §7 in one theme file (CSS variables or the stack's theme system). Replace hard-coded colours and fonts across the app with the tokens.
3. **Shared components.** Primary button, filter chip, − / + stepper, article row, « Épuisé » tag, pending icon, offline banner, pink header, card. Build or restyle each once and reuse it.
4. **Screens, one at a time**, in this order: Inventaire, Modifier l'article, Nouvel article, Connexion, Synchronisation, Aide. One commit per screen.
5. **Check each screen** at 390 × 844 against its design file: spacing, sizes, colours, copy, states (offline / online, empty / non-empty, pending / sent), touch targets and screen-reader labels.

Work on a new git branch. Don't change behaviour the design doesn't ask for.
