# Pizza Dough Calculator — Design

Date: 2026-10-04
Source requirements: `REQUIREMENTS.md` (sections referenced as §n).

## 1. Goal

Build the calculator described in `REQUIREMENTS.md` as a standalone static
site: a single page, fully client-side, that turns four inputs (size, quantity,
thickness, gluten free) into ingredient weights, baker's percentages, dough ball
weight, tips and instructions, with copy, print and remembered settings.

Success criteria:

- Every row of the §3.7 reference tables is reproduced exactly.
- All behaviour in §1–9 is implemented as written. `REQUIREMENTS.md` already
  includes the decisions recorded in section 3 of this document.
- The built site is plain static files that work from any URL path.

## 2. Decisions

| Topic | Decision |
|---|---|
| Hosting | Standalone static site, GitHub Pages via GitHub Actions |
| Stack | Vanilla TypeScript (strict) + Vite, Vitest for tests, no UI framework |
| Architecture | Pure logic modules + one render function that patches static markup |
| Visual style | "Warm pizzeria": cream background, tomato-red accent, serif headings, light theme only |
| §10.1 exclusive tips | Resolved: show every matching tip |
| §10.2 small-batch rounding | Kept as specified (whole grams, yeast one decimal) |
| §10.3 batch tip wording | Resolved: wording depends on dough type |
| Tip and instruction wording | Reworded for clarity; `REQUIREMENTS.md` §5 and §6 hold the exact text |

## 3. Decisions folded into REQUIREMENTS.md

These were settled during design and written back into `REQUIREMENTS.md`, which
is the single source of truth for all user-facing text.

### 3.1 Show all matching tips

The original §5 showed at most one tip, first match wins. §5 now shows every
tip whose condition matches, in order: gluten free, big pizza, big batch, thick,
thin. Thick and thin are mutually exclusive, so at most four tips show at once.
When no condition matches, the tip container is hidden.

### 3.2 Dough-aware batch tip

The batch tip (quantity ≥ 8) has one text per dough type: 4 days for regular
dough, up to 48 hours for gluten free.

### 3.3 Reworded tips and instructions

Every tip, tip label and instruction step was reworded for clarity and
consistency: full sentences, "minutes" spelled out, no cooking facts or numbers
changed. Tip labels are "Gluten free", "Big pizza", "Big batch", "Thick crust"
and "Thin crust".

`content.ts` and `tips.ts` copy their strings verbatim from `REQUIREMENTS.md`
§5 and §6. This document does not repeat them.

## 4. Architecture

### 4.1 Files

```
index.html            static markup for every section, with empty value slots
src/
  types.ts            Settings, Recipe, Tip, Thickness
  calc.ts             calculate(settings) -> Recipe
  tips.ts             tipsFor(settings) -> Tip[]
  content.ts          ingredient names and notes, step lists, pill text, titles
  storage.ts          loadSettings(storage?) / saveSettings(settings, storage?)
  format.ts           copyText(...) / printHtml(...)
  render.ts           render(view): patches the DOM
  main.ts             wiring: state, events, copy and print actions
  config.ts           APP_URL
  style.css
tests/
  calc.test.ts  tips.test.ts  storage.test.ts  format.test.ts
  content.test.ts  app.test.ts
```

### 4.2 Types

```ts
type Thickness = 'thin' | 'regular' | 'thick';

interface Settings {
  size: number;        // integer 10–20
  quantity: number;    // integer 1–10
  thickness: Thickness;
  glutenFree: boolean;
}

interface Recipe {
  flour: number;       // whole grams
  water: number;       // whole grams
  yeast: number;       // one decimal
  salt: number;        // whole grams
  sugar: number;       // whole grams
  oil: number;         // whole grams
  doughBall: number;   // whole grams per ball
  hydration: number;   // 62 or 80
}

interface Tip { label: string; text: string }
```

Defaults: `{ size: 16, quantity: 6, thickness: 'regular', glutenFree: false }`.

### 4.3 Module rules

- `calc.ts` owns every constant from §3.1 and §3.2. The regular base flour is
  written as the expression `1509.797685 * (480 / 425)`, not a rounded literal.
- `calc`, `tips`, `content`, `format` and the validation in `storage` are pure:
  no DOM access and no globals. `storage` functions take an optional `Storage`
  argument (default `window.localStorage`) so tests can pass a fake.
- `render.ts` is the only module that writes to the output DOM. It looks up
  element references once and sets `textContent`. It never assigns dynamic data
  through `innerHTML`. The tip list and step list are rebuilt with
  `createElement`.
- The instruction section's open/closed state and the "✓ Copied!" timer live in
  `main.ts`, outside the render path, so recalculation never disturbs them.
- `config.ts` exports `APP_URL`: `import.meta.env.VITE_APP_URL` when set,
  otherwise `location.origin + location.pathname`.

### 4.4 Data flow

```
load:   loadSettings() -> set input controls -> calculate -> render
input:  event -> settings = { ...settings, [field]: value } -> calculate -> render -> saveSettings
copy:   copyText(...) -> navigator.clipboard.writeText -> button label swap for 2 s
print:  printHtml(...) -> window.open (800 x 900) -> document.write -> print()
```

The script is a module loaded at the end of `<body>`. Output slots are empty in
the HTML, and settings are restored before the first render, so defaults never
flash (§8).

## 5. Behaviour

### 5.1 Calculation (§3)

```
flour     = base × (size / 16)² × (quantity / 6) × (thicknessValue / 2.11)
water     = flour × 0.62 (regular) | flour × 0.80 (gluten free)
yeast     = flour × 0.004
salt      = flour × 0.025
sugar     = flour × 0.02
oil       = flour × 0.033
doughBall = flour × 1.702 / quantity (regular) | flour × 1.882 / quantity (gluten free)
```

`base` is 1705.1833 g (regular) or 1998 g (gluten free). Thickness values are
thin 1.8, regular 2.11, thick 2.75.

Every amount is derived from the unrounded flour value and rounded last. Whole
grams use `Math.round` (values are positive, so halves round up). Yeast is
`Math.round(x * 10) / 10` and is displayed with one decimal place always, so
8 g shows as `8.0`.

### 5.2 Outputs (§4)

- Four summary stats: dough ball, total flour, total water, hydration, with the
  unit text from §4.1.
- Ingredient table: six rows in §4.2 order with names, notes and percentages
  from §3.4. Flour name and note, and the water percentage, switch with the
  gluten-free toggle.
- Three pills per §4.3. "ball" is singular when quantity is 1.

### 5.3 Tips

As §5. `tipsFor` returns an ordered array;
the UI renders them as a stacked list, each with its own label, and hides the
container when the array is empty.

### 5.4 Instructions (§6)

Collapsible, collapsed by default, toggled by its header. The title and step
list switch with the gluten-free toggle; the open/closed state does not change
when they switch. The state is not persisted.

### 5.5 Copy recipe (§7.1)

Plain text in exactly the §7.1 format, using the same rounding as the table.
Tips are not included. On success the button reads "✓ Copied!" for 2 seconds,
then restores its label.

### 5.6 Print / save (§7.2)

Opens a new window of about 800 × 900 and triggers the print dialog. Contents in
order: title "Pizza Dough Recipe", app URL, four summary stats, ingredient
table, three pills, "Instructions" heading, full step list for the current dough
type (regardless of whether the on-page section is open). Tips are not included.
The print document carries its own minimal inline CSS: black on white, no theme
colours, no web fonts.

## 6. UI and visual design

### 6.1 Layout

- Desktop (≥ 760 px): two-column CSS grid. Left column holds "Your pizza
  settings" and is sticky. Right column holds, top to bottom: summary stats,
  pills, ingredient table, tips, instructions, action buttons.
- Narrow screens: one column in the order header, settings, stats, pills, table,
  tips, instructions, actions.
- Summary stats are four cells in a row on desktop and a 2 × 2 grid on narrow
  screens.
- Maximum content width about 1040 px. No horizontal scroll at 320 px.

### 6.2 Controls

- Size and quantity: native `<input type="range">` with styled track and thumb,
  an `<output>` showing the current value (`16"` for size), and tick labels
  (10", 15", 20" and 1, 5, 10).
- Thickness: a radio group styled as three segmented buttons. Native radios
  provide single selection and arrow-key navigation.
- Gluten free: `<input type="checkbox" role="switch">` styled as a toggle, with
  the label and subtext from §2.
- Instructions: a `<button aria-expanded>` header with a ▼ indicator that
  rotates when open, and a panel containing an `<ol>` whose numbers use the
  `decimal-leading-zero` counter style (01, 02, …).
- The results region is not an ARIA live region; announcing every slider step
  would be noise.

### 6.3 Theme

| Token | Value | Use |
|---|---|---|
| Background | `#FBF5E9` | Page |
| Surface | `#FFFDF8` | Cards, with a thin warm border |
| Text | `#2B1D14` | Body |
| Muted | `#7A6A5C` | Notes, unit text, subtext |
| Accent | `#C8321F` | Slider fill, selected thickness, highlighted pill, primary button |
| Secondary | `#3F6B3A` | Tip labels |

- Headings use Fraunces, self-hosted through `@fontsource/fraunces` so the page
  makes no third-party requests. Body text and numbers use the system sans-serif
  stack with `font-variant-numeric: tabular-nums` so digits do not jitter while
  a slider is dragged.
- Light theme only.
- Text and accent colours meet WCAG AA contrast against their backgrounds.
- Every control has a visible focus ring. `prefers-reduced-motion` disables the
  ▼ rotation transition.

## 7. Storage (§8)

- Key `pizzaCalc.settings`; value is JSON such as
  `{"v":1,"size":16,"quantity":6,"thickness":"regular","glutenFree":false}`.
- `loadSettings`: read, parse, require `v === 1`, then validate each field
  independently. Size must be an integer 10–20, quantity an integer 1–10,
  thickness one of `thin` / `regular` / `thick`, glutenFree a boolean. An
  invalid or missing field falls back to that field's default. Unparseable JSON,
  a non-object value or an unknown `v` falls back to all defaults.
- `saveSettings`: called after render on every input change.
- Both are wrapped in `try/catch` and swallow failures (storage disabled,
  private mode, quota). The tool then runs with defaults and persists nothing.

## 8. Error handling

- Copy: if `navigator.clipboard?.writeText` is missing, the button does
  nothing. A rejected write is caught and the label does not change.
- Print: if `window.open` returns `null` (popup blocked), nothing happens and
  nothing throws.
- Calculation cannot fail: its inputs come from bounded controls or validated
  storage.
- There is no global error UI.

## 9. Testing

Vitest. Pure modules are tested directly; the DOM wiring gets one jsdom test.

- `calc.test.ts`: all nine §3.7 rows, table-driven, every column. Dough ball
  weight is unchanged when only quantity changes.
- `tips.test.ts`: each tip alone; no match returns `[]`; gluten free + 20" +
  quantity 8 + thick returns four tips in order; batch wording for each dough
  type; thresholds at size 17 / 18 and quantity 7 / 8.
- `storage.test.ts`: round trip; each field invalid on its own; unparseable
  JSON; unknown `v`; storage that throws on read and on write.
- `format.test.ts`: copy text matches exactly for regular and gluten free;
  print HTML contains the step list for the current dough type.
- `content.test.ts`: pill text for each dough type, with singular "ball" at
  quantity 1; step lists and titles switch with dough type.
- `app.test.ts` (jsdom): loading with saved settings sets controls and outputs;
  changing an input updates outputs and writes storage; toggling gluten free
  with the instructions open leaves them open.

No end-to-end browser suite. Before the work is called done, check by hand in a
browser: layout at 320 px and at desktop width, copy, and print.

## 10. Tooling and deployment

- Scripts: `dev`, `build`, `test`, `typecheck`. TypeScript strict mode. No
  linter beyond `tsc`.
- Vite `base: './'` so the build works at any path. Output is `dist/`.
- `VITE_APP_URL` is optional; see 4.3.
- GitHub Actions workflow: on push to the default branch, run tests and
  typecheck, build, and deploy `dist/` to GitHub Pages.

## 11. Out of scope

- Unit conversion, dark theme, finer rounding for small batches.
- Tips in the copy text or print view.
- Persisting the instruction section's open/closed state.
- Analytics, cookies, any server component.
