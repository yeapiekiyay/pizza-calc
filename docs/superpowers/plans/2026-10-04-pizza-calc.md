# Pizza Dough Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page, client-side pizza dough calculator described in `REQUIREMENTS.md` and deploy it as a static site.

**Architecture:** Pure TypeScript modules (`calc`, `tips`, `content`, `storage`, `format`) hold all logic and text and are unit-tested without a DOM. `index.html` holds static markup with empty value slots; `render.ts` patches those slots; `app.ts` wires inputs, state, copy and print. `main.ts` only calls `initApp()`.

**Tech Stack:** TypeScript (strict), Vite, Vitest, jsdom (one DOM test file), `@fontsource/fraunces`. No UI framework. Node 24 / npm 11 are installed locally.

**Spec:** `docs/superpowers/specs/2026-10-04-pizza-calc-design.md`. All user-facing text comes from `REQUIREMENTS.md` (sections cited as §n). Read both before starting.

**One deviation from the spec's file list:** the wiring lives in `src/app.ts` (exports `initApp`) and `src/main.ts` is a two-line entry that calls it. This lets the DOM test call `initApp()` after it has built the document, instead of relying on import side effects.

## Global Constraints

- Work on branch `pizza-calc-design`. Commit after every task.
- No network requests at runtime. No cookies. No third-party font or script hosts.
- Units are grams and inches only.
- All user-facing strings are copied verbatim from `REQUIREMENTS.md` §2, §3.4, §4, §5, §6, §7. Do not paraphrase them. They use typographic characters: en dash `–` in ranges, `·` in pills and copy text, `°` in temperatures, `✓` on the copied button, `▼` on the instructions header.
- Rounding (§3.6): every amount is derived from the unrounded flour value, then rounded. Whole grams with `Math.round`; yeast to one decimal, always displayed with one decimal (`8.0`).
- `render.ts` is the only module that writes to the output DOM, and it never assigns dynamic data through `innerHTML`.
- `calc`, `tips`, `content`, `format` must not touch `document`, `window`, `navigator` or `localStorage`.
- Storage key is `pizzaCalc.settings`; stored shape is `{"v":1,"size":16,"quantity":6,"thickness":"regular","glutenFree":false}`.
- Light theme only. Theme colours: background `#FBF5E9`, surface `#FFFDF8`, text `#2B1D14`, muted `#7A6A5C`, accent `#C8321F`, secondary `#3F6B3A`.
- Vite `base: './'`.
- TypeScript strict mode; `npm run typecheck` must pass at the end of every task.

## Review Focus

Conditions the spec implies but does not spell out as acceptance rows. Each has a test in the task named.

1. Stored settings with the right keys but wrong shapes: numeric strings (`"16"`), non-integers (`16.5`), JSON `null`, a JSON array. Expected: the bad field (or everything, for `null`/array) falls back to defaults; no throw. — Task 4.
2. Storage that works on load but throws on write mid-session (quota). Expected: the outputs still update on every input change. — Task 6.
3. Clicking "Copy recipe" twice within 2 seconds. Expected: the label stays "✓ Copied!" for a full 2 seconds after the second click, then restores once; the first timer must not restore it early. — Task 6.
4. Clipboard write rejected (permission denied). Expected: no unhandled rejection, label unchanged. — Task 6.
5. Popup blocked on "Print / save" (`window.open` returns `null`). Expected: nothing happens, nothing throws. — Task 6.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore` | Tooling |
| `src/types.ts` | `Thickness`, `Settings`, `Recipe`, `Tip`, `DEFAULT_SETTINGS`, `THICKNESSES` |
| `src/calc.ts` | `calculate(settings)`; owns every §3 constant |
| `src/tips.ts` | `tipsFor(settings)`; §5 |
| `src/content.ts` | Ingredient rows, instructions, pills, summary stats; §3.4, §4, §6 |
| `src/storage.ts` | `parseSettings`, `loadSettings`, `saveSettings`; §8 |
| `src/format.ts` | `amountText`, `copyText`, `printHtml`; §7 |
| `src/config.ts` | `APP_URL` |
| `src/render.ts` | `createRenderer(doc)` returns `render(view)` |
| `src/app.ts` | `initApp()`: state, events, copy, print |
| `src/main.ts` | Entry: calls `initApp()` |
| `src/style.css` | Theme and layout |
| `index.html` | Static markup |
| `tests/*.test.ts` | One test file per logic module, plus `app.test.ts` (jsdom) |
| `.github/workflows/deploy.yml` | Test, build, deploy to GitHub Pages |

---

### Task 1: Project scaffold, types and calculation

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`
- Create: `src/types.ts`, `src/calc.ts`
- Test: `tests/calc.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `src/types.ts`: `type Thickness = 'thin' | 'regular' | 'thick'`; `interface Settings { size: number; quantity: number; thickness: Thickness; glutenFree: boolean }`; `interface Recipe { flour: number; water: number; yeast: number; salt: number; sugar: number; oil: number; doughBall: number; hydration: number }`; `interface Tip { label: string; text: string }`; `const DEFAULT_SETTINGS: Settings`; `const THICKNESSES: readonly Thickness[]`.
  - `src/calc.ts`: `calculate(settings: Settings): Recipe`.
  - npm scripts `dev`, `build`, `test`, `typecheck`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "pizza-calc",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install -D vite vitest typescript jsdom @types/node
npm install @fontsource/fraunces
```

Expected: both finish without errors; `package.json` gains `devDependencies` and `dependencies`; `package-lock.json` and `node_modules/` exist.

- [ ] **Step 3: Create `.gitignore`**

```
node_modules
dist
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Create `src/types.ts`**

```ts
export type Thickness = 'thin' | 'regular' | 'thick';

export interface Settings {
  size: number;
  quantity: number;
  thickness: Thickness;
  glutenFree: boolean;
}

export interface Recipe {
  flour: number;
  water: number;
  yeast: number;
  salt: number;
  sugar: number;
  oil: number;
  doughBall: number;
  hydration: number;
}

export interface Tip {
  label: string;
  text: string;
}

export const THICKNESSES: readonly Thickness[] = ['thin', 'regular', 'thick'];

export const DEFAULT_SETTINGS: Settings = {
  size: 16,
  quantity: 6,
  thickness: 'regular',
  glutenFree: false,
};
```

- [ ] **Step 7: Write the failing test `tests/calc.test.ts`**

The rows are §3.7 verbatim. Columns: size, quantity, thickness, glutenFree, then the expected `Recipe`.

```ts
import { describe, expect, it } from 'vitest';
import { calculate } from '../src/calc';
import type { Recipe, Thickness } from '../src/types';

type Row = [number, number, Thickness, boolean, Recipe];

const rows: Row[] = [
  [16, 6, 'regular', false, { flour: 1705, water: 1057, yeast: 6.8, salt: 43, sugar: 34, oil: 56, doughBall: 484, hydration: 62 }],
  [16, 1, 'regular', false, { flour: 284, water: 176, yeast: 1.1, salt: 7, sugar: 6, oil: 9, doughBall: 484, hydration: 62 }],
  [12, 1, 'regular', false, { flour: 160, water: 99, yeast: 0.6, salt: 4, sugar: 3, oil: 5, doughBall: 272, hydration: 62 }],
  [12, 4, 'thin', false, { flour: 545, water: 338, yeast: 2.2, salt: 14, sugar: 11, oil: 18, doughBall: 232, hydration: 62 }],
  [10, 1, 'thin', false, { flour: 95, water: 59, yeast: 0.4, salt: 2, sugar: 2, oil: 3, doughBall: 161, hydration: 62 }],
  [20, 10, 'thick', false, { flour: 5787, water: 3588, yeast: 23.1, salt: 145, sugar: 116, oil: 191, doughBall: 985, hydration: 62 }],
  [16, 6, 'regular', true, { flour: 1998, water: 1598, yeast: 8, salt: 50, sugar: 40, oil: 66, doughBall: 627, hydration: 80 }],
  [16, 1, 'regular', true, { flour: 333, water: 266, yeast: 1.3, salt: 8, sugar: 7, oil: 11, doughBall: 627, hydration: 80 }],
  [12, 2, 'thick', true, { flour: 488, water: 391, yeast: 2, salt: 12, sugar: 10, oil: 16, doughBall: 459, hydration: 80 }],
];

describe('calculate', () => {
  it.each(rows)('%i" x %i %s glutenFree=%s', (size, quantity, thickness, glutenFree, expected) => {
    expect(calculate({ size, quantity, thickness, glutenFree })).toEqual(expected);
  });

  it('gives the same dough ball weight for every quantity', () => {
    for (let quantity = 1; quantity <= 10; quantity++) {
      const recipe = calculate({ size: 14, quantity, thickness: 'thick', glutenFree: false });
      expect(recipe.doughBall).toBe(483);
    }
  });
});
```

(14" thick regular: `284.1972 × (14/16)² × (2.75/2.11) × 1.702 = 482.6`, rounds to 483.)

- [ ] **Step 8: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL. The error says `../src/calc` cannot be resolved.

- [ ] **Step 9: Create `src/calc.ts`**

```ts
import type { Recipe, Settings, Thickness } from './types';

const REFERENCE_SIZE = 16;
const REFERENCE_QUANTITY = 6;
const REFERENCE_THICKNESS = 2.11;

const BASE_FLOUR_REGULAR = 1509.797685 * (480 / 425);
const BASE_FLOUR_GLUTEN_FREE = 333 * 6;

const THICKNESS_VALUE: Record<Thickness, number> = {
  thin: 1.8,
  regular: 2.11,
  thick: 2.75,
};

const WATER_REGULAR = 0.62;
const WATER_GLUTEN_FREE = 0.8;
const YEAST = 0.004;
const SALT = 0.025;
const SUGAR = 0.02;
const OIL = 0.033;

export function calculate(settings: Settings): Recipe {
  const base = settings.glutenFree ? BASE_FLOUR_GLUTEN_FREE : BASE_FLOUR_REGULAR;
  const water = settings.glutenFree ? WATER_GLUTEN_FREE : WATER_REGULAR;

  const flour =
    base *
    (settings.size / REFERENCE_SIZE) ** 2 *
    (settings.quantity / REFERENCE_QUANTITY) *
    (THICKNESS_VALUE[settings.thickness] / REFERENCE_THICKNESS);

  const doughFactor = 1 + water + YEAST + SALT + SUGAR + OIL;

  return {
    flour: Math.round(flour),
    water: Math.round(flour * water),
    yeast: Math.round(flour * YEAST * 10) / 10,
    salt: Math.round(flour * SALT),
    sugar: Math.round(flour * SUGAR),
    oil: Math.round(flour * OIL),
    doughBall: Math.round((flour * doughFactor) / settings.quantity),
    hydration: Math.round(water * 100),
  };
}
```

- [ ] **Step 10: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: 10 tests pass; `tsc` prints nothing.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json .gitignore tsconfig.json vite.config.ts src/types.ts src/calc.ts tests/calc.test.ts
git commit -m "feat: scaffold project and add dough calculation"
```

---

### Task 2: Tips

**Files:**
- Create: `src/tips.ts`
- Test: `tests/tips.test.ts`

**Interfaces:**
- Consumes: `Settings`, `Tip` from `src/types.ts`.
- Produces: `tipsFor(settings: Settings): Tip[]`, ordered gluten free, big pizza, big batch, thick, thin. Empty array when nothing matches.

- [ ] **Step 1: Write the failing test `tests/tips.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { tipsFor } from '../src/tips';
import type { Settings } from '../src/types';

const base: Settings = { size: 16, quantity: 6, thickness: 'regular', glutenFree: false };

describe('tipsFor', () => {
  it('returns no tips for the default settings', () => {
    expect(tipsFor(base)).toEqual([]);
  });

  it('gluten free', () => {
    expect(tipsFor({ ...base, glutenFree: true })).toEqual([
      { label: 'Gluten free', text: 'Gluten-free dough is sticky. Oil your hands before shaping.' },
    ]);
  });

  it('big pizza starts at 18 inches and names the size', () => {
    expect(tipsFor({ ...base, size: 17 })).toEqual([]);
    expect(tipsFor({ ...base, size: 18 })).toEqual([
      { label: 'Big pizza', text: 'A 18" pizza needs a fully hot oven. Preheat at max temperature for 45 minutes.' },
    ]);
    expect(tipsFor({ ...base, size: 20 })[0].text).toContain('A 20" pizza');
  });

  it('big batch starts at 8 pizzas and says 4 days for regular dough', () => {
    expect(tipsFor({ ...base, quantity: 7 })).toEqual([]);
    expect(tipsFor({ ...base, quantity: 8 })).toEqual([
      { label: 'Big batch', text: 'Shape all 8 balls at once. They keep 4 days in the fridge.' },
    ]);
  });

  it('big batch says up to 48 hours for gluten-free dough', () => {
    const tips = tipsFor({ ...base, quantity: 10, glutenFree: true });
    expect(tips[1]).toEqual({
      label: 'Big batch',
      text: 'Shape all 10 balls at once. They keep up to 48 hours in the fridge.',
    });
  });

  it('thick crust', () => {
    expect(tipsFor({ ...base, thickness: 'thick' })).toEqual([
      { label: 'Thick crust', text: 'Bake at 450°F for 10–12 minutes instead of the usual 6–8.' },
    ]);
  });

  it('thin crust', () => {
    expect(tipsFor({ ...base, thickness: 'thin' })).toEqual([
      { label: 'Thin crust', text: 'Thin crust bakes in 4–5 minutes. Watch it closely.' },
    ]);
  });

  it('returns every matching tip in order', () => {
    const tips = tipsFor({ size: 20, quantity: 8, thickness: 'thick', glutenFree: true });
    expect(tips.map((tip) => tip.label)).toEqual(['Gluten free', 'Big pizza', 'Big batch', 'Thick crust']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/tips.test.ts`
Expected: FAIL. `../src/tips` cannot be resolved.

- [ ] **Step 3: Create `src/tips.ts`**

```ts
import type { Settings, Tip } from './types';

export function tipsFor(settings: Settings): Tip[] {
  const tips: Tip[] = [];

  if (settings.glutenFree) {
    tips.push({
      label: 'Gluten free',
      text: 'Gluten-free dough is sticky. Oil your hands before shaping.',
    });
  }
  if (settings.size >= 18) {
    tips.push({
      label: 'Big pizza',
      text: `A ${settings.size}" pizza needs a fully hot oven. Preheat at max temperature for 45 minutes.`,
    });
  }
  if (settings.quantity >= 8) {
    const keeps = settings.glutenFree ? 'up to 48 hours' : '4 days';
    tips.push({
      label: 'Big batch',
      text: `Shape all ${settings.quantity} balls at once. They keep ${keeps} in the fridge.`,
    });
  }
  if (settings.thickness === 'thick') {
    tips.push({
      label: 'Thick crust',
      text: 'Bake at 450°F for 10–12 minutes instead of the usual 6–8.',
    });
  }
  if (settings.thickness === 'thin') {
    tips.push({
      label: 'Thin crust',
      text: 'Thin crust bakes in 4–5 minutes. Watch it closely.',
    });
  }

  return tips;
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass; `tsc` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add src/tips.ts tests/tips.test.ts
git commit -m "feat: add contextual tips"
```

---

### Task 3: Content

**Files:**
- Create: `src/content.ts`
- Test: `tests/content.test.ts`

**Interfaces:**
- Consumes: `Recipe`, `Settings` from `src/types.ts`.
- Produces:
  - `type IngredientKey = 'flour' | 'water' | 'yeast' | 'salt' | 'sugar' | 'oil'` (each is also a key of `Recipe`)
  - `interface IngredientRow { key: IngredientKey; name: string; note: string; percent: string }`
  - `ingredientRows(glutenFree: boolean): IngredientRow[]` — six rows in §4.2 order; `note` is `''` when there is none
  - `interface Instructions { title: string; steps: string[] }`
  - `instructions(glutenFree: boolean): Instructions`
  - `interface Pills { doughType: string; fermentation: string; config: string }`
  - `pills(settings: Settings): Pills`
  - `type StatKey = 'ball' | 'flour' | 'water' | 'hydration'`
  - `interface Stat { key: StatKey; label: string; value: string; unit: string }`
  - `summaryStats(recipe: Recipe): Stat[]` — four stats in §4.1 order

- [ ] **Step 1: Write the failing test `tests/content.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { ingredientRows, instructions, pills, summaryStats } from '../src/content';
import type { Settings } from '../src/types';

const base: Settings = { size: 16, quantity: 6, thickness: 'regular', glutenFree: false };

describe('ingredientRows', () => {
  it('regular dough', () => {
    expect(ingredientRows(false)).toEqual([
      { key: 'flour', name: 'Bread flour', note: '12–14% protein', percent: '100%' },
      { key: 'water', name: 'Water', note: 'Cold, under 60°F', percent: '62%' },
      { key: 'yeast', name: 'Yeast', note: 'Active dry', percent: '0.4%' },
      { key: 'salt', name: 'Salt', note: '', percent: '2.5%' },
      { key: 'sugar', name: 'Sugar', note: '', percent: '2%' },
      { key: 'oil', name: 'Olive oil', note: '', percent: '3.3%' },
    ]);
  });

  it('gluten-free dough changes only the flour row and the water percentage', () => {
    const rows = ingredientRows(true);
    expect(rows[0]).toEqual({ key: 'flour', name: 'GF flour', note: 'Caputo GF recommended', percent: '100%' });
    expect(rows[1]).toEqual({ key: 'water', name: 'Water', note: 'Cold, under 60°F', percent: '80%' });
    expect(rows.slice(2)).toEqual(ingredientRows(false).slice(2));
  });
});

describe('instructions', () => {
  it('regular dough', () => {
    expect(instructions(false)).toEqual({
      title: 'Dough making instructions',
      steps: [
        'Chill the water to below 60°F.',
        'Stir the yeast into the water.',
        'Add the flour and olive oil. Mix for 2 minutes.',
        'Add the sugar and salt with the mixer on low.',
        'Mix for 10 more minutes.',
        'Cover and rest on the counter for 1–3 hours.',
        'Shape into balls and pinch the seams shut.',
        'Refrigerate for 2–4 days. 3 days is best.',
        'Bring to room temperature before using.',
      ],
    });
  });

  it('gluten-free dough', () => {
    expect(instructions(true)).toEqual({
      title: 'Gluten-free instructions',
      steps: [
        'Stir the yeast into the cold water.',
        'Add the GF flour and olive oil. Mix for 2 minutes.',
        'Add the sugar and salt. Mix for 3–4 minutes.',
        'Refrigerate for 15 minutes to firm up.',
        'Oil your hands and shape into balls.',
        'Refrigerate for up to 48 hours.',
        'Bring to room temperature before using.',
      ],
    });
  });
});

describe('pills', () => {
  it('regular dough', () => {
    expect(pills(base)).toEqual({
      doughType: 'Regular dough',
      fermentation: 'Cold ferment 2–4 days',
      config: '6 balls · 16" · regular',
    });
  });

  it('gluten-free dough', () => {
    expect(pills({ size: 12, quantity: 2, thickness: 'thick', glutenFree: true })).toEqual({
      doughType: 'Gluten-free',
      fermentation: 'Cold rest up to 48hrs',
      config: '2 balls · 12" · thick',
    });
  });

  it('uses singular "ball" for one pizza', () => {
    expect(pills({ ...base, quantity: 1, thickness: 'thin' }).config).toBe('1 ball · 16" · thin');
  });
});

describe('summaryStats', () => {
  it('returns the four stats in order with unit text', () => {
    const recipe = { flour: 1705, water: 1057, yeast: 6.8, salt: 43, sugar: 34, oil: 56, doughBall: 484, hydration: 62 };
    expect(summaryStats(recipe)).toEqual([
      { key: 'ball', label: 'Dough ball', value: '484', unit: 'grams each' },
      { key: 'flour', label: 'Total flour', value: '1705', unit: 'grams' },
      { key: 'water', label: 'Total water', value: '1057', unit: 'grams' },
      { key: 'hydration', label: 'Hydration', value: '62', unit: 'percent' },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/content.test.ts`
Expected: FAIL. `../src/content` cannot be resolved.

- [ ] **Step 3: Create `src/content.ts`**

```ts
import type { Recipe, Settings } from './types';

export type IngredientKey = 'flour' | 'water' | 'yeast' | 'salt' | 'sugar' | 'oil';

export interface IngredientRow {
  key: IngredientKey;
  name: string;
  note: string;
  percent: string;
}

export function ingredientRows(glutenFree: boolean): IngredientRow[] {
  return [
    glutenFree
      ? { key: 'flour', name: 'GF flour', note: 'Caputo GF recommended', percent: '100%' }
      : { key: 'flour', name: 'Bread flour', note: '12–14% protein', percent: '100%' },
    { key: 'water', name: 'Water', note: 'Cold, under 60°F', percent: glutenFree ? '80%' : '62%' },
    { key: 'yeast', name: 'Yeast', note: 'Active dry', percent: '0.4%' },
    { key: 'salt', name: 'Salt', note: '', percent: '2.5%' },
    { key: 'sugar', name: 'Sugar', note: '', percent: '2%' },
    { key: 'oil', name: 'Olive oil', note: '', percent: '3.3%' },
  ];
}

export interface Instructions {
  title: string;
  steps: string[];
}

const REGULAR_INSTRUCTIONS: Instructions = {
  title: 'Dough making instructions',
  steps: [
    'Chill the water to below 60°F.',
    'Stir the yeast into the water.',
    'Add the flour and olive oil. Mix for 2 minutes.',
    'Add the sugar and salt with the mixer on low.',
    'Mix for 10 more minutes.',
    'Cover and rest on the counter for 1–3 hours.',
    'Shape into balls and pinch the seams shut.',
    'Refrigerate for 2–4 days. 3 days is best.',
    'Bring to room temperature before using.',
  ],
};

const GLUTEN_FREE_INSTRUCTIONS: Instructions = {
  title: 'Gluten-free instructions',
  steps: [
    'Stir the yeast into the cold water.',
    'Add the GF flour and olive oil. Mix for 2 minutes.',
    'Add the sugar and salt. Mix for 3–4 minutes.',
    'Refrigerate for 15 minutes to firm up.',
    'Oil your hands and shape into balls.',
    'Refrigerate for up to 48 hours.',
    'Bring to room temperature before using.',
  ],
};

export function instructions(glutenFree: boolean): Instructions {
  return glutenFree ? GLUTEN_FREE_INSTRUCTIONS : REGULAR_INSTRUCTIONS;
}

export interface Pills {
  doughType: string;
  fermentation: string;
  config: string;
}

export function pills(settings: Settings): Pills {
  const balls = settings.quantity === 1 ? 'ball' : 'balls';
  return {
    doughType: settings.glutenFree ? 'Gluten-free' : 'Regular dough',
    fermentation: settings.glutenFree ? 'Cold rest up to 48hrs' : 'Cold ferment 2–4 days',
    config: `${settings.quantity} ${balls} · ${settings.size}" · ${settings.thickness}`,
  };
}

export type StatKey = 'ball' | 'flour' | 'water' | 'hydration';

export interface Stat {
  key: StatKey;
  label: string;
  value: string;
  unit: string;
}

export function summaryStats(recipe: Recipe): Stat[] {
  return [
    { key: 'ball', label: 'Dough ball', value: String(recipe.doughBall), unit: 'grams each' },
    { key: 'flour', label: 'Total flour', value: String(recipe.flour), unit: 'grams' },
    { key: 'water', label: 'Total water', value: String(recipe.water), unit: 'grams' },
    { key: 'hydration', label: 'Hydration', value: String(recipe.hydration), unit: 'percent' },
  ];
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass; `tsc` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add src/content.ts tests/content.test.ts
git commit -m "feat: add ingredient, instruction, pill and stat content"
```

---

### Task 4: Storage

**Files:**
- Create: `src/storage.ts`
- Test: `tests/storage.test.ts`

**Interfaces:**
- Consumes: `Settings`, `DEFAULT_SETTINGS`, `THICKNESSES` from `src/types.ts`.
- Produces:
  - `const STORAGE_KEY = 'pizzaCalc.settings'`
  - `parseSettings(raw: string | null): Settings` — pure; never throws
  - `loadSettings(storage?: Storage): Settings` — never throws; uses `window.localStorage` when `storage` is omitted
  - `saveSettings(settings: Settings, storage?: Storage): void` — never throws

These tests run in Vitest's default Node environment, where `window` does not exist. That is used on purpose to cover "storage unavailable".

- [ ] **Step 1: Write the failing test `tests/storage.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, loadSettings, parseSettings, saveSettings } from '../src/storage';
import { DEFAULT_SETTINGS } from '../src/types';
import type { Settings } from '../src/types';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

function throwingStorage(): Storage {
  const fail = () => {
    throw new Error('storage disabled');
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

const saved: Settings = { size: 12, quantity: 4, thickness: 'thin', glutenFree: true };
const stored = (value: unknown) => JSON.stringify(value);

describe('parseSettings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('restores a valid object', () => {
    expect(parseSettings(stored({ v: 1, ...saved }))).toEqual(saved);
  });

  it('returns defaults for unparseable JSON', () => {
    expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS);
  });

  it('returns defaults for an unknown or missing version', () => {
    expect(parseSettings(stored({ v: 2, ...saved }))).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(stored({ ...saved }))).toEqual(DEFAULT_SETTINGS);
  });

  it.each([['null', 'null'], ['an array', '[1,2,3]'], ['a number', '42'], ['a string', '"hi"']])(
    'returns defaults when the stored value is %s',
    (_name, raw) => {
      expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
    },
  );

  it.each([
    ['size too small', { size: 9 }, { size: 16 }],
    ['size too large', { size: 21 }, { size: 16 }],
    ['size not an integer', { size: 16.5 }, { size: 16 }],
    ['size as a string', { size: '12' }, { size: 16 }],
    ['quantity too small', { quantity: 0 }, { quantity: 6 }],
    ['quantity too large', { quantity: 11 }, { quantity: 6 }],
    ['quantity as a string', { quantity: '4' }, { quantity: 6 }],
    ['thickness unknown', { thickness: 'deep' }, { thickness: 'regular' }],
    ['thickness numeric', { thickness: 1.8 }, { thickness: 'regular' }],
    ['glutenFree as a string', { glutenFree: 'true' }, { glutenFree: false }],
  ])('falls back for one field only: %s', (_name, bad, fallback) => {
    expect(parseSettings(stored({ v: 1, ...saved, ...bad }))).toEqual({ ...saved, ...fallback });
  });

  it('falls back for a missing field only', () => {
    expect(parseSettings(stored({ v: 1, size: 12 }))).toEqual({ ...DEFAULT_SETTINGS, size: 12 });
  });

  it('returns a fresh object, not the shared defaults', () => {
    expect(parseSettings(null)).not.toBe(DEFAULT_SETTINGS);
  });
});

describe('loadSettings and saveSettings', () => {
  it('round-trips through storage', () => {
    const storage = fakeStorage();
    saveSettings(saved, storage);
    expect(loadSettings(storage)).toEqual(saved);
  });

  it('writes the documented shape under the documented key', () => {
    const storage = fakeStorage();
    saveSettings(DEFAULT_SETTINGS, storage);
    expect(storage.getItem(STORAGE_KEY)).toBe(
      '{"v":1,"size":16,"quantity":6,"thickness":"regular","glutenFree":false}',
    );
  });

  it('returns defaults when reading throws', () => {
    expect(loadSettings(throwingStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('ignores a write that throws', () => {
    expect(() => saveSettings(saved, throwingStorage())).not.toThrow();
  });

  it('survives localStorage being unavailable', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(saved)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/storage.test.ts`
Expected: FAIL. `../src/storage` cannot be resolved.

- [ ] **Step 3: Create `src/storage.ts`**

```ts
import { DEFAULT_SETTINGS, THICKNESSES } from './types';
import type { Settings, Thickness } from './types';

export const STORAGE_KEY = 'pizzaCalc.settings';

const VERSION = 1;

function isIntegerBetween(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isThickness(value: unknown): value is Thickness {
  return typeof value === 'string' && (THICKNESSES as readonly string[]).includes(value);
}

export function parseSettings(raw: string | null): Settings {
  if (raw === null) return { ...DEFAULT_SETTINGS };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ...DEFAULT_SETTINGS };
  }

  const stored = data as Record<string, unknown>;
  if (stored.v !== VERSION) return { ...DEFAULT_SETTINGS };

  return {
    size: isIntegerBetween(stored.size, 10, 20) ? stored.size : DEFAULT_SETTINGS.size,
    quantity: isIntegerBetween(stored.quantity, 1, 10) ? stored.quantity : DEFAULT_SETTINGS.quantity,
    thickness: isThickness(stored.thickness) ? stored.thickness : DEFAULT_SETTINGS.thickness,
    glutenFree: typeof stored.glutenFree === 'boolean' ? stored.glutenFree : DEFAULT_SETTINGS.glutenFree,
  };
}

export function loadSettings(storage?: Storage): Settings {
  try {
    return parseSettings((storage ?? window.localStorage).getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings, storage?: Storage): void {
  try {
    (storage ?? window.localStorage).setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: VERSION,
        size: settings.size,
        quantity: settings.quantity,
        thickness: settings.thickness,
        glutenFree: settings.glutenFree,
      }),
    );
  } catch {
    // Storage disabled, private mode or over quota: run without persistence.
  }
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass; `tsc` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add src/storage.ts tests/storage.test.ts
git commit -m "feat: add validated settings persistence"
```

---

### Task 5: Copy text and print HTML

**Files:**
- Create: `src/format.ts`, `src/config.ts`
- Test: `tests/format.test.ts`

**Interfaces:**
- Consumes:
  - `calculate(settings: Settings): Recipe` from `src/calc.ts`
  - `ingredientRows`, `instructions`, `pills`, `summaryStats`, `type IngredientKey` from `src/content.ts`
- Produces:
  - `amountText(key: IngredientKey, recipe: Recipe): string` — yeast with one decimal (`'8.0'`), others as whole numbers, no unit
  - `copyText(recipe: Recipe, settings: Settings, appUrl: string): string` — §7.1 format, no trailing newline
  - `printHtml(recipe: Recipe, settings: Settings, appUrl: string): string` — a complete HTML document, all dynamic text escaped
  - `src/config.ts`: `const APP_URL: string`

- [ ] **Step 1: Write the failing test `tests/format.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { calculate } from '../src/calc';
import { amountText, copyText, printHtml } from '../src/format';
import type { Settings } from '../src/types';

const regular: Settings = { size: 16, quantity: 6, thickness: 'regular', glutenFree: false };
const glutenFree: Settings = { ...regular, glutenFree: true };
const url = 'https://example.test/pizza/';

describe('amountText', () => {
  it('shows yeast with one decimal place, including a trailing zero', () => {
    expect(amountText('yeast', calculate(glutenFree))).toBe('8.0');
    expect(amountText('yeast', calculate(regular))).toBe('6.8');
  });

  it('shows other ingredients as whole grams', () => {
    expect(amountText('flour', calculate(regular))).toBe('1705');
    expect(amountText('oil', calculate(regular))).toBe('56');
  });
});

describe('copyText', () => {
  it('regular dough', () => {
    expect(copyText(calculate(regular), regular, url)).toBe(
      [
        'PIZZA DOUGH RECIPE',
        '6x 16" pizza · Dough ball: 484g',
        '',
        'Bread flour: 1705g',
        'Water: 1057g',
        'Yeast: 6.8g',
        'Salt: 43g',
        'Sugar: 34g',
        'Olive oil: 56g',
        '',
        'https://example.test/pizza/',
      ].join('\n'),
    );
  });

  it('gluten-free dough', () => {
    expect(copyText(calculate(glutenFree), glutenFree, url)).toBe(
      [
        'PIZZA DOUGH RECIPE',
        '6x 16" pizza · Dough ball: 627g',
        '',
        'GF flour: 1998g',
        'Water: 1598g',
        'Yeast: 8.0g',
        'Salt: 50g',
        'Sugar: 40g',
        'Olive oil: 66g',
        '',
        'https://example.test/pizza/',
      ].join('\n'),
    );
  });
});

describe('printHtml', () => {
  it('contains every section in the specified order', () => {
    const html = printHtml(calculate(regular), regular, url);
    const positions = [
      '<h1>Pizza Dough Recipe</h1>',
      'https://example.test/pizza/',
      'Dough ball',
      'Total flour',
      'Total water',
      'Hydration',
      'Bread flour',
      'Olive oil',
      'Regular dough',
      'Cold ferment 2–4 days',
      '6 balls · 16&quot; · regular',
      '<h2>Instructions</h2>',
      'Chill the water to below 60°F.',
      'Bring to room temperature before using.',
    ].map((text) => html.indexOf(text));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('lists all nine regular steps', () => {
    const html = printHtml(calculate(regular), regular, url);
    expect(html.match(/<li class="step">/g)).toHaveLength(9);
  });

  it('uses the gluten-free steps and names for gluten-free dough', () => {
    const html = printHtml(calculate(glutenFree), glutenFree, url);
    expect(html.match(/<li class="step">/g)).toHaveLength(7);
    expect(html).toContain('Stir the yeast into the cold water.');
    expect(html).toContain('GF flour');
    expect(html).toContain('8.0 g');
    expect(html).not.toContain('Chill the water to below 60°F.');
  });

  it('does not include tips', () => {
    const html = printHtml(calculate(glutenFree), glutenFree, url);
    expect(html).not.toContain('Oil your hands before shaping.');
  });

  it('escapes the app URL', () => {
    const html = printHtml(calculate(regular), regular, 'https://example.test/?a=1&b=<script>');
    expect(html).toContain('https://example.test/?a=1&amp;b=&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('is a complete document that loads nothing external', () => {
    const html = printHtml(calculate(regular), regular, url);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).not.toMatch(/<link|<script|@import|url\(/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/format.test.ts`
Expected: FAIL. `../src/format` cannot be resolved.

- [ ] **Step 3: Create `src/format.ts`**

```ts
import { ingredientRows, instructions, pills, summaryStats } from './content';
import type { IngredientKey } from './content';
import type { Recipe, Settings } from './types';

export function amountText(key: IngredientKey, recipe: Recipe): string {
  return key === 'yeast' ? recipe.yeast.toFixed(1) : String(recipe[key]);
}

export function copyText(recipe: Recipe, settings: Settings, appUrl: string): string {
  const ingredients = ingredientRows(settings.glutenFree).map(
    (row) => `${row.name}: ${amountText(row.key, recipe)}g`,
  );
  return [
    'PIZZA DOUGH RECIPE',
    `${settings.quantity}x ${settings.size}" pizza · Dough ball: ${recipe.doughBall}g`,
    '',
    ...ingredients,
    '',
    appUrl,
  ].join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PRINT_CSS = `
  body { font-family: Georgia, 'Times New Roman', serif; color: #000; background: #fff; margin: 32px; line-height: 1.4; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 24px 0 8px; }
  .url { margin: 0 0 20px; font-size: 12px; color: #444; }
  .stats { display: flex; gap: 24px; margin: 0 0 20px; }
  .stats dt { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .stats dd { margin: 0; font-size: 22px; font-weight: bold; }
  .stats dd span { font-size: 11px; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #999; }
  small { color: #444; margin-left: 6px; }
  .pills { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .pills li { border: 1px solid #000; border-radius: 999px; padding: 2px 10px; font-size: 12px; }
  ol { list-style: decimal-leading-zero; padding-left: 32px; margin: 0; }
  .step { margin: 4px 0; }
`;

export function printHtml(recipe: Recipe, settings: Settings, appUrl: string): string {
  const stats = summaryStats(recipe)
    .map(
      (stat) =>
        `<div><dt>${escapeHtml(stat.label)}</dt><dd>${escapeHtml(stat.value)} <span>${escapeHtml(stat.unit)}</span></dd></div>`,
    )
    .join('');

  const rows = ingredientRows(settings.glutenFree)
    .map((row) => {
      const note = row.note ? `<small>${escapeHtml(row.note)}</small>` : '';
      return `<tr><td>${escapeHtml(row.name)}${note}</td><td>${escapeHtml(amountText(row.key, recipe))} g</td><td>${escapeHtml(row.percent)}</td></tr>`;
    })
    .join('');

  const pill = pills(settings);
  const pillItems = [pill.doughType, pill.fermentation, pill.config]
    .map((text) => `<li>${escapeHtml(text)}</li>`)
    .join('');

  const steps = instructions(settings.glutenFree)
    .steps.map((step) => `<li class="step">${escapeHtml(step)}</li>`)
    .join('');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Pizza Dough Recipe</title>',
    `<style>${PRINT_CSS}</style>`,
    '</head>',
    '<body>',
    '<h1>Pizza Dough Recipe</h1>',
    `<p class="url">${escapeHtml(appUrl)}</p>`,
    `<dl class="stats">${stats}</dl>`,
    '<table>',
    '<thead><tr><th>Ingredient</th><th>Amount</th><th>Baker&#39;s %</th></tr></thead>',
    `<tbody>${rows}</tbody>`,
    '</table>',
    `<ul class="pills">${pillItems}</ul>`,
    '<h2>Instructions</h2>',
    `<ol>${steps}</ol>`,
    '</body>',
    '</html>',
  ].join('\n');
}
```

- [ ] **Step 4: Create `src/config.ts`**

```ts
export const APP_URL: string =
  import.meta.env.VITE_APP_URL || location.origin + location.pathname;
```

(`config.ts` reads `location`, so only `app.ts` imports it. `format.ts` takes the URL as an argument and stays pure.)

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass; `tsc` prints nothing.

- [ ] **Step 6: Commit**

```bash
git add src/format.ts src/config.ts tests/format.test.ts
git commit -m "feat: add copy text and print document formatting"
```

---

### Task 6: Page markup, rendering and wiring

**Files:**
- Create: `index.html`, `src/render.ts`, `src/app.ts`, `src/main.ts`
- Test: `tests/app.test.ts`

**Interfaces:**
- Consumes:
  - `calculate(settings: Settings): Recipe` — `src/calc.ts`
  - `tipsFor(settings: Settings): Tip[]` — `src/tips.ts`
  - `ingredientRows(glutenFree)`, `instructions(glutenFree)`, `pills(settings)`, `summaryStats(recipe)` — `src/content.ts`
  - `loadSettings(): Settings`, `saveSettings(settings): void`, `STORAGE_KEY` — `src/storage.ts`
  - `amountText(key, recipe)`, `copyText(recipe, settings, appUrl)`, `printHtml(recipe, settings, appUrl)` — `src/format.ts`
  - `APP_URL` — `src/config.ts`
  - `THICKNESSES`, types — `src/types.ts`
- Produces:
  - `src/render.ts`: `interface View { settings: Settings; recipe: Recipe; tips: Tip[] }`; `createRenderer(doc: Document): (view: View) => void`
  - `src/app.ts`: `initApp(doc?: Document): void`
  - `index.html` element ids and attributes that Task 7's CSS styles: `size`, `size-value`, `quantity`, `quantity-value`, radios `name="thickness"`, `gluten-free`, `stat-ball`, `stat-flour`, `stat-water`, `stat-hydration`, `pill-type`, `pill-ferment`, `pill-config`, rows `tr[data-ingredient]` with `.ing-name`, `.ing-note`, `.ing-amount`, `.ing-percent`, `tips`, `instructions-toggle`, `instructions-title`, `instructions-panel`, `instructions-steps`, `copy-button`, `print-button`.

- [ ] **Step 1: Create `index.html`**

Output slots are empty on purpose: the script fills them from saved settings before first paint, so defaults never flash. The `value` and `checked` attributes on inputs are overwritten by `initApp`.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pizza Dough Calculator</title>
    <meta name="description" content="Exact pizza dough ingredient weights in grams for any size, batch and crust thickness, regular or gluten free.">
    <link rel="stylesheet" href="/src/style.css">
  </head>
  <body>
    <main class="page">
      <header class="page-header">
        <h1>Pizza Dough Calculator</h1>
        <p class="lede">Exact ingredient weights for any size, batch and crust.</p>
      </header>

      <div class="layout">
        <section class="card settings" aria-labelledby="settings-heading">
          <h2 id="settings-heading">Your pizza settings</h2>

          <div class="field">
            <div class="field-head">
              <label for="size">Pizza size</label>
              <output id="size-value" for="size"></output>
            </div>
            <input type="range" id="size" min="10" max="20" step="1" value="16">
            <div class="ticks" aria-hidden="true">
              <span>10"</span><span>15"</span><span>20"</span>
            </div>
          </div>

          <div class="field">
            <div class="field-head">
              <label for="quantity">Number of pizzas</label>
              <output id="quantity-value" for="quantity"></output>
            </div>
            <input type="range" id="quantity" min="1" max="10" step="1" value="6">
            <div class="ticks" style="--mid: 44.44%" aria-hidden="true">
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>

          <fieldset class="field thickness">
            <legend>Thickness</legend>
            <div class="segmented">
              <label><input type="radio" name="thickness" value="thin"><span>Thin</span></label>
              <label><input type="radio" name="thickness" value="regular"><span>Regular</span></label>
              <label><input type="radio" name="thickness" value="thick"><span>Thick</span></label>
            </div>
          </fieldset>

          <label class="field switch-row" for="gluten-free">
            <span class="switch-text">
              <span class="switch-label">Gluten free</span>
              <span class="switch-sub">GF flour + adjusted hydration</span>
            </span>
            <input type="checkbox" role="switch" id="gluten-free">
            <span class="switch-track" aria-hidden="true"></span>
          </label>
        </section>

        <section class="results" aria-label="Recipe">
          <dl class="stats">
            <div class="card stat">
              <dt>Dough ball</dt>
              <dd><span class="stat-value" id="stat-ball"></span> <span class="stat-unit">grams each</span></dd>
            </div>
            <div class="card stat">
              <dt>Total flour</dt>
              <dd><span class="stat-value" id="stat-flour"></span> <span class="stat-unit">grams</span></dd>
            </div>
            <div class="card stat">
              <dt>Total water</dt>
              <dd><span class="stat-value" id="stat-water"></span> <span class="stat-unit">grams</span></dd>
            </div>
            <div class="card stat">
              <dt>Hydration</dt>
              <dd><span class="stat-value" id="stat-hydration"></span> <span class="stat-unit">percent</span></dd>
            </div>
          </dl>

          <ul class="pills" aria-label="Summary">
            <li class="pill pill-accent" id="pill-type"></li>
            <li class="pill" id="pill-ferment"></li>
            <li class="pill" id="pill-config"></li>
          </ul>

          <div class="card table-card">
            <table class="ingredients">
              <thead>
                <tr>
                  <th scope="col">Ingredient</th>
                  <th scope="col" class="num">Amount</th>
                  <th scope="col" class="num">Baker's %</th>
                </tr>
              </thead>
              <tbody>
                <tr data-ingredient="flour">
                  <th scope="row"><span class="ing-name"></span><span class="ing-note"></span></th>
                  <td class="num"><span class="ing-amount"></span> g</td>
                  <td class="num ing-percent"></td>
                </tr>
                <tr data-ingredient="water">
                  <th scope="row"><span class="ing-name"></span><span class="ing-note"></span></th>
                  <td class="num"><span class="ing-amount"></span> g</td>
                  <td class="num ing-percent"></td>
                </tr>
                <tr data-ingredient="yeast">
                  <th scope="row"><span class="ing-name"></span><span class="ing-note"></span></th>
                  <td class="num"><span class="ing-amount"></span> g</td>
                  <td class="num ing-percent"></td>
                </tr>
                <tr data-ingredient="salt">
                  <th scope="row"><span class="ing-name"></span><span class="ing-note"></span></th>
                  <td class="num"><span class="ing-amount"></span> g</td>
                  <td class="num ing-percent"></td>
                </tr>
                <tr data-ingredient="sugar">
                  <th scope="row"><span class="ing-name"></span><span class="ing-note"></span></th>
                  <td class="num"><span class="ing-amount"></span> g</td>
                  <td class="num ing-percent"></td>
                </tr>
                <tr data-ingredient="oil">
                  <th scope="row"><span class="ing-name"></span><span class="ing-note"></span></th>
                  <td class="num"><span class="ing-amount"></span> g</td>
                  <td class="num ing-percent"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul class="tips" id="tips" hidden></ul>

          <section class="card instructions">
            <h2>
              <button type="button" id="instructions-toggle" aria-expanded="false" aria-controls="instructions-panel">
                <span id="instructions-title"></span>
                <span class="chevron" aria-hidden="true">▼</span>
              </button>
            </h2>
            <div id="instructions-panel" hidden>
              <ol class="steps" id="instructions-steps"></ol>
            </div>
          </section>

          <div class="actions">
            <button type="button" class="btn btn-primary" id="copy-button">Copy recipe</button>
            <button type="button" class="btn" id="print-button">Print / save</button>
          </div>
        </section>
      </div>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Write the failing test `tests/app.test.ts`**

The first line switches this one file to jsdom. The test loads the real `index.html` body so markup and code are tested together.

```ts
// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../src/app';
import { APP_URL } from '../src/config';
import { STORAGE_KEY } from '../src/storage';

const html = readFileSync('index.html', 'utf8');
const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)![1];

function mount(): void {
  document.body.innerHTML = body;
  initApp();
}

function el<T extends HTMLElement = HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`No element matches ${selector}`);
  return found;
}

const text = (selector: string) => el(selector).textContent;

function setRange(id: string, value: number): void {
  const input = el<HTMLInputElement>(`#${id}`);
  input.value = String(value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function pickThickness(value: string): void {
  el<HTMLInputElement>(`input[name="thickness"][value="${value}"]`).click();
}

function stubClipboard(value: unknown): void {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

const tipLabels = () => [...document.querySelectorAll('#tips .tip-label')].map((node) => node.textContent);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  stubClipboard(undefined);
});

describe('first render', () => {
  it('shows the default recipe when nothing is saved', () => {
    mount();
    expect(el<HTMLInputElement>('#size').value).toBe('16');
    expect(el<HTMLInputElement>('#quantity').value).toBe('6');
    expect(el<HTMLInputElement>('input[name="thickness"]:checked').value).toBe('regular');
    expect(el<HTMLInputElement>('#gluten-free').checked).toBe(false);
    expect(text('#size-value')).toBe('16"');
    expect(text('#quantity-value')).toBe('6');
    expect(text('#stat-ball')).toBe('484');
    expect(text('#stat-flour')).toBe('1705');
    expect(text('#stat-water')).toBe('1057');
    expect(text('#stat-hydration')).toBe('62');
    expect(text('#pill-type')).toBe('Regular dough');
    expect(text('#pill-ferment')).toBe('Cold ferment 2–4 days');
    expect(text('#pill-config')).toBe('6 balls · 16" · regular');
    expect(el('#tips').hidden).toBe(true);
  });

  it('fills the ingredient table', () => {
    mount();
    expect(text('[data-ingredient="flour"] .ing-name')).toBe('Bread flour');
    expect(text('[data-ingredient="flour"] .ing-note')).toBe('12–14% protein');
    expect(text('[data-ingredient="flour"] .ing-amount')).toBe('1705');
    expect(text('[data-ingredient="flour"] .ing-percent')).toBe('100%');
    expect(text('[data-ingredient="water"] .ing-percent')).toBe('62%');
    expect(text('[data-ingredient="yeast"] .ing-amount')).toBe('6.8');
    expect(text('[data-ingredient="oil"] .ing-name')).toBe('Olive oil');
    expect(text('[data-ingredient="oil"] .ing-amount')).toBe('56');
  });

  it('restores saved settings into controls and outputs', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: 1, size: 12, quantity: 2, thickness: 'thick', glutenFree: true }),
    );
    mount();
    expect(el<HTMLInputElement>('#size').value).toBe('12');
    expect(el<HTMLInputElement>('#quantity').value).toBe('2');
    expect(el<HTMLInputElement>('input[name="thickness"]:checked').value).toBe('thick');
    expect(el<HTMLInputElement>('#gluten-free').checked).toBe(true);
    expect(text('#stat-flour')).toBe('488');
    expect(text('#stat-ball')).toBe('459');
    expect(text('#stat-hydration')).toBe('80');
    expect(text('[data-ingredient="flour"] .ing-name')).toBe('GF flour');
    expect(text('[data-ingredient="yeast"] .ing-amount')).toBe('2.0');
    expect(text('#pill-type')).toBe('Gluten-free');
    expect(el('#tips').hidden).toBe(false);
    expect(tipLabels()).toEqual(['Gluten free', 'Thick crust']);
  });
});

describe('input changes', () => {
  it('recalculates and saves on every change', () => {
    mount();
    setRange('size', 12);
    setRange('quantity', 4);
    pickThickness('thin');
    expect(text('#size-value')).toBe('12"');
    expect(text('#quantity-value')).toBe('4');
    expect(text('#stat-flour')).toBe('545');
    expect(text('#stat-ball')).toBe('232');
    expect(text('#pill-config')).toBe('4 balls · 12" · thin');
    expect(tipLabels()).toEqual(['Thin crust']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      v: 1,
      size: 12,
      quantity: 4,
      thickness: 'thin',
      glutenFree: false,
    });
  });

  it('keeps the other inputs when gluten free is toggled', () => {
    mount();
    setRange('size', 12);
    pickThickness('thick');
    el('#gluten-free').click();
    expect(el<HTMLInputElement>('input[name="thickness"]:checked').value).toBe('thick');
    expect(el<HTMLInputElement>('#size').value).toBe('12');
    expect(text('#stat-hydration')).toBe('80');
  });

  it('hides the tip area again when no tip applies', () => {
    mount();
    pickThickness('thin');
    expect(el('#tips').hidden).toBe(false);
    pickThickness('regular');
    expect(el('#tips').hidden).toBe(true);
    expect(el('#tips').children).toHaveLength(0);
  });

  it('shows the tip text beside its label', () => {
    mount();
    setRange('size', 18);
    expect(text('#tips .tip-text')).toBe(
      'A 18" pizza needs a fully hot oven. Preheat at max temperature for 45 minutes.',
    );
  });

  it('keeps updating when storage writes fail', () => {
    mount();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });
    setRange('size', 12);
    setRange('quantity', 1);
    expect(text('#stat-flour')).toBe('160');
  });
});

describe('instructions', () => {
  it('is collapsed by default with the regular title and steps', () => {
    mount();
    expect(el('#instructions-toggle').getAttribute('aria-expanded')).toBe('false');
    expect(el('#instructions-panel').hidden).toBe(true);
    expect(text('#instructions-title')).toBe('Dough making instructions');
    expect(el('#instructions-steps').children).toHaveLength(9);
    expect(el('#instructions-steps').firstElementChild?.textContent).toBe('Chill the water to below 60°F.');
  });

  it('toggles open and closed from the header', () => {
    mount();
    el('#instructions-toggle').click();
    expect(el('#instructions-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(el('#instructions-panel').hidden).toBe(false);
    el('#instructions-toggle').click();
    expect(el('#instructions-toggle').getAttribute('aria-expanded')).toBe('false');
    expect(el('#instructions-panel').hidden).toBe(true);
  });

  it('stays open and switches content when the dough type changes', () => {
    mount();
    el('#instructions-toggle').click();
    el('#gluten-free').click();
    expect(el('#instructions-panel').hidden).toBe(false);
    expect(text('#instructions-title')).toBe('Gluten-free instructions');
    expect(el('#instructions-steps').children).toHaveLength(7);
  });

  it('does not persist the open state', () => {
    mount();
    el('#instructions-toggle').click();
    setRange('size', 12);
    mount();
    expect(el('#instructions-panel').hidden).toBe(true);
  });
});

describe('copy recipe', () => {
  it('copies the recipe text and shows confirmation for 2 seconds', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    mount();

    el('#copy-button').click();
    await vi.advanceTimersByTimeAsync(0);

    expect(writeText).toHaveBeenCalledWith(
      [
        'PIZZA DOUGH RECIPE',
        '6x 16" pizza · Dough ball: 484g',
        '',
        'Bread flour: 1705g',
        'Water: 1057g',
        'Yeast: 6.8g',
        'Salt: 43g',
        'Sugar: 34g',
        'Olive oil: 56g',
        '',
        APP_URL,
      ].join('\n'),
    );
    expect(text('#copy-button')).toBe('✓ Copied!');

    await vi.advanceTimersByTimeAsync(1999);
    expect(text('#copy-button')).toBe('✓ Copied!');
    await vi.advanceTimersByTimeAsync(1);
    expect(text('#copy-button')).toBe('Copy recipe');
  });

  it('restarts the 2 seconds when clicked again', async () => {
    vi.useFakeTimers();
    stubClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    mount();

    el('#copy-button').click();
    await vi.advanceTimersByTimeAsync(1500);
    el('#copy-button').click();
    await vi.advanceTimersByTimeAsync(1500);
    expect(text('#copy-button')).toBe('✓ Copied!');
    await vi.advanceTimersByTimeAsync(500);
    expect(text('#copy-button')).toBe('Copy recipe');
  });

  it('does nothing when the clipboard API is unavailable', () => {
    stubClipboard(undefined);
    mount();
    expect(() => el('#copy-button').click()).not.toThrow();
    expect(text('#copy-button')).toBe('Copy recipe');
  });

  it('leaves the label alone when the write is rejected', async () => {
    vi.useFakeTimers();
    stubClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    mount();
    el('#copy-button').click();
    await vi.advanceTimersByTimeAsync(0);
    expect(text('#copy-button')).toBe('Copy recipe');
  });
});

describe('print / save', () => {
  it('opens a window, writes the recipe document and prints it', () => {
    const popup = {
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    };
    const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    mount();
    el('#gluten-free').click();

    el('#print-button').click();

    expect(open).toHaveBeenCalledWith('', '_blank', 'width=800,height=900');
    const written = popup.document.write.mock.calls[0][0] as string;
    expect(written).toContain('<h1>Pizza Dough Recipe</h1>');
    expect(written).toContain('GF flour');
    expect(written).toContain('Stir the yeast into the cold water.');
    expect(popup.document.close).toHaveBeenCalled();
    expect(popup.print).toHaveBeenCalled();
  });

  it('does nothing when the popup is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    mount();
    expect(() => el('#print-button').click()).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- tests/app.test.ts`
Expected: FAIL. `../src/app` cannot be resolved.

- [ ] **Step 4: Create `src/render.ts`**

```ts
import { ingredientRows, instructions, pills, summaryStats } from './content';
import { amountText } from './format';
import type { Recipe, Settings, Tip } from './types';

export interface View {
  settings: Settings;
  recipe: Recipe;
  tips: Tip[];
}

function byId(doc: Document, id: string): HTMLElement {
  const element = doc.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element;
}

function within(parent: Element, selector: string): HTMLElement {
  const element = parent.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing element ${selector}`);
  return element;
}

export function createRenderer(doc: Document): (view: View) => void {
  const sizeValue = byId(doc, 'size-value');
  const quantityValue = byId(doc, 'quantity-value');
  const pillType = byId(doc, 'pill-type');
  const pillFerment = byId(doc, 'pill-ferment');
  const pillConfig = byId(doc, 'pill-config');
  const tipList = byId(doc, 'tips');
  const instructionsTitle = byId(doc, 'instructions-title');
  const instructionsSteps = byId(doc, 'instructions-steps');

  return ({ settings, recipe, tips }) => {
    sizeValue.textContent = `${settings.size}"`;
    quantityValue.textContent = String(settings.quantity);

    for (const stat of summaryStats(recipe)) {
      byId(doc, `stat-${stat.key}`).textContent = stat.value;
    }

    const pill = pills(settings);
    pillType.textContent = pill.doughType;
    pillFerment.textContent = pill.fermentation;
    pillConfig.textContent = pill.config;

    for (const row of ingredientRows(settings.glutenFree)) {
      const tr = within(doc.body, `[data-ingredient="${row.key}"]`);
      within(tr, '.ing-name').textContent = row.name;
      within(tr, '.ing-note').textContent = row.note;
      within(tr, '.ing-amount').textContent = amountText(row.key, recipe);
      within(tr, '.ing-percent').textContent = row.percent;
    }

    tipList.replaceChildren(
      ...tips.map((tip) => {
        const item = doc.createElement('li');
        item.className = 'tip';
        const label = doc.createElement('span');
        label.className = 'tip-label';
        label.textContent = tip.label;
        const body = doc.createElement('span');
        body.className = 'tip-text';
        body.textContent = tip.text;
        item.append(label, body);
        return item;
      }),
    );
    tipList.hidden = tips.length === 0;

    const guide = instructions(settings.glutenFree);
    instructionsTitle.textContent = guide.title;
    instructionsSteps.replaceChildren(
      ...guide.steps.map((step) => {
        const item = doc.createElement('li');
        item.textContent = step;
        return item;
      }),
    );
  };
}
```

- [ ] **Step 5: Create `src/app.ts`**

```ts
import { calculate } from './calc';
import { APP_URL } from './config';
import { copyText, printHtml } from './format';
import { createRenderer } from './render';
import type { View } from './render';
import { loadSettings, saveSettings } from './storage';
import { tipsFor } from './tips';
import { THICKNESSES } from './types';
import type { Settings, Thickness } from './types';

const COPY_LABEL = 'Copy recipe';
const COPIED_LABEL = '✓ Copied!';
const COPIED_MS = 2000;

function byId<T extends HTMLElement>(doc: Document, id: string): T {
  const element = doc.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

export function initApp(doc: Document = document): void {
  const sizeInput = byId<HTMLInputElement>(doc, 'size');
  const quantityInput = byId<HTMLInputElement>(doc, 'quantity');
  const glutenFreeInput = byId<HTMLInputElement>(doc, 'gluten-free');
  const thicknessInputs = Array.from(doc.querySelectorAll<HTMLInputElement>('input[name="thickness"]'));
  const instructionsToggle = byId<HTMLButtonElement>(doc, 'instructions-toggle');
  const instructionsPanel = byId(doc, 'instructions-panel');
  const copyButton = byId<HTMLButtonElement>(doc, 'copy-button');
  const printButton = byId<HTMLButtonElement>(doc, 'print-button');

  const render = createRenderer(doc);
  let settings: Settings = loadSettings();

  const view = (): View => ({
    settings,
    recipe: calculate(settings),
    tips: tipsFor(settings),
  });

  const update = (patch: Partial<Settings>): void => {
    settings = { ...settings, ...patch };
    render(view());
    saveSettings(settings);
  };

  sizeInput.value = String(settings.size);
  quantityInput.value = String(settings.quantity);
  glutenFreeInput.checked = settings.glutenFree;
  for (const input of thicknessInputs) {
    input.checked = input.value === settings.thickness;
  }
  render(view());

  sizeInput.addEventListener('input', () => update({ size: Number(sizeInput.value) }));
  quantityInput.addEventListener('input', () => update({ quantity: Number(quantityInput.value) }));
  glutenFreeInput.addEventListener('change', () => update({ glutenFree: glutenFreeInput.checked }));
  for (const input of thicknessInputs) {
    input.addEventListener('change', () => {
      const value = input.value as Thickness;
      if (input.checked && THICKNESSES.includes(value)) update({ thickness: value });
    });
  }

  instructionsToggle.addEventListener('click', () => {
    const open = instructionsToggle.getAttribute('aria-expanded') !== 'true';
    instructionsToggle.setAttribute('aria-expanded', String(open));
    instructionsPanel.hidden = !open;
  });

  let copiedTimer: ReturnType<typeof setTimeout> | undefined;
  copyButton.addEventListener('click', () => {
    const clipboard: Clipboard | undefined = navigator.clipboard;
    if (!clipboard?.writeText) return;
    clipboard.writeText(copyText(calculate(settings), settings, APP_URL)).then(
      () => {
        copyButton.textContent = COPIED_LABEL;
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => {
          copyButton.textContent = COPY_LABEL;
        }, COPIED_MS);
      },
      () => {
        // Write refused (permissions, lost focus): leave the button as it is.
      },
    );
  });

  printButton.addEventListener('click', () => {
    const popup = window.open('', '_blank', 'width=800,height=900');
    if (!popup) return;
    popup.document.write(printHtml(calculate(settings), settings, APP_URL));
    popup.document.close();
    popup.focus();
    popup.print();
  });
}
```

- [ ] **Step 6: Create `src/main.ts`**

```ts
import { initApp } from './app';

initApp();
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass, including every test in `tests/app.test.ts`; `tsc` prints nothing.

If `app.test.ts` fails with `document is not defined`, the `// @vitest-environment jsdom` comment is not the first line of the file; move it there.

- [ ] **Step 8: Commit**

```bash
git add index.html src/render.ts src/app.ts src/main.ts tests/app.test.ts
git commit -m "feat: add page markup, rendering and input wiring"
```

---

### Task 7: Warm pizzeria styling

**Files:**
- Create: `src/style.css`

**Interfaces:**
- Consumes: the ids, classes and attributes in `index.html` from Task 6. Do not rename any of them; `tests/app.test.ts` and `src/render.ts` depend on them.
- Produces: the finished visual design. No JavaScript changes.

There is no unit test for CSS. This task is verified by a clean build and a manual check in a browser.

- [ ] **Step 1: Create `src/style.css`**

```css
@import '@fontsource/fraunces/600.css';

:root {
  --bg: #fbf5e9;
  --surface: #fffdf8;
  --border: #e8dcc6;
  --text: #2b1d14;
  --muted: #7a6a5c;
  --accent: #c8321f;
  --accent-contrast: #ffffff;
  --secondary: #3f6b3a;
  --radius: 14px;
  --display: 'Fraunces', Georgia, 'Times New Roman', serif;
  --body: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

[hidden] {
  display: none !important;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.45;
  font-variant-numeric: tabular-nums;
}

h1,
h2 {
  font-family: var(--display);
  font-weight: 600;
  margin: 0;
}

.page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: clamp(1.9rem, 6vw, 2.8rem);
  line-height: 1.1;
}

.lede {
  margin: 6px 0 0;
  color: var(--muted);
}

.layout {
  display: grid;
  gap: 20px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

/* Settings */

.settings {
  padding: 20px;
}

.settings h2 {
  font-size: 1.3rem;
  margin-bottom: 16px;
}

.field {
  display: block;
  margin: 0 0 22px;
  padding: 0;
  border: 0;
  min-width: 0;
}

.field:last-child {
  margin-bottom: 0;
}

.field-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.field label,
.field legend,
.switch-label {
  font-weight: 600;
}

.field legend {
  padding: 0;
  margin-bottom: 8px;
}

output {
  font-family: var(--display);
  font-size: 1.4rem;
  color: var(--accent);
}

input[type='range'] {
  width: 100%;
  margin: 0;
  height: 28px;
  accent-color: var(--accent);
  cursor: pointer;
}

.ticks {
  position: relative;
  height: 1.3em;
  font-size: 0.8rem;
  color: var(--muted);
}

.ticks span {
  position: absolute;
  top: 0;
}

.ticks span:nth-child(1) {
  left: 0;
}

.ticks span:nth-child(2) {
  left: var(--mid, 50%);
  transform: translateX(-50%);
}

.ticks span:nth-child(3) {
  right: 0;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  padding: 3px;
}

.segmented label {
  position: relative;
  font-weight: 400;
}

.segmented input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.segmented span {
  display: block;
  text-align: center;
  padding: 8px 4px;
  border-radius: 999px;
}

.segmented input:checked + span {
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
}

.segmented input:focus-visible + span {
  outline: 3px solid var(--text);
  outline-offset: 2px;
}

.switch-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
}

.switch-text {
  display: flex;
  flex-direction: column;
}

.switch-sub {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--muted);
}

.switch-row input {
  position: absolute;
  right: 0;
  width: 52px;
  height: 30px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.switch-track {
  flex: none;
  width: 52px;
  height: 30px;
  border-radius: 999px;
  background: #cdbfa8;
  position: relative;
  transition: background 0.15s;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s;
}

.switch-row input:checked + .switch-track {
  background: var(--accent);
}

.switch-row input:checked + .switch-track::after {
  transform: translateX(22px);
}

.switch-row input:focus-visible + .switch-track {
  outline: 3px solid var(--text);
  outline-offset: 2px;
}

/* Results */

.results {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 0;
}

.stat {
  padding: 14px 16px;
}

.stat dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.stat dd {
  margin: 2px 0 0;
}

.stat-value {
  display: block;
  font-family: var(--display);
  font-size: 2rem;
  line-height: 1.1;
}

.stat-unit {
  font-size: 0.8rem;
  color: var(--muted);
}

.pills {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.pill {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.85rem;
}

.pill-accent {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
}

.table-card {
  padding: 4px 16px;
}

.ingredients {
  width: 100%;
  border-collapse: collapse;
}

.ingredients th,
.ingredients td {
  padding: 10px 0;
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: baseline;
}

.ingredients tbody tr:last-child th,
.ingredients tbody tr:last-child td {
  border-bottom: 0;
}

.ingredients thead th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-weight: 600;
}

.ingredients tbody th {
  font-weight: 600;
}

.ingredients .num {
  text-align: right;
  white-space: nowrap;
  padding-left: 12px;
}

.ing-note {
  display: block;
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--muted);
}

.ing-amount {
  font-weight: 600;
}

.ing-percent {
  color: var(--muted);
}

.tips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.tip {
  background: #eef3e6;
  border: 1px solid #cfdcc0;
  border-radius: var(--radius);
  padding: 10px 14px;
}

.tip-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--secondary);
}

.instructions h2 {
  font-size: 1.15rem;
}

#instructions-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  border: 0;
  border-radius: var(--radius);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.chevron {
  font-family: var(--body);
  font-size: 0.8rem;
  color: var(--accent);
  transition: transform 0.15s;
}

#instructions-toggle[aria-expanded='true'] .chevron {
  transform: rotate(180deg);
}

.steps {
  list-style: decimal-leading-zero;
  margin: 0;
  padding: 0 16px 16px 48px;
}

.steps li {
  padding: 4px 0 4px 4px;
}

.steps li::marker {
  color: var(--accent);
  font-weight: 700;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn {
  flex: 1 1 140px;
  padding: 12px 16px;
  border: 1px solid var(--text);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-contrast);
}

button:focus-visible,
input[type='range']:focus-visible {
  outline: 3px solid var(--text);
  outline-offset: 2px;
}

@media (min-width: 760px) {
  .page {
    padding: 40px 24px 64px;
  }

  .layout {
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 28px;
    align-items: start;
  }

  .settings {
    position: sticky;
    top: 24px;
  }

  .stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chevron,
  .switch-track,
  .switch-track::after {
    transition: none;
  }
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `tsc` passes, Vite writes `dist/index.html`, one CSS file, one JS file and Fraunces `.woff2`/`.woff` files under `dist/assets/`. No warnings about unresolved imports.

- [ ] **Step 3: Confirm the build makes no third-party requests**

Run: `grep -rEo "https?://[^\"') ]+" dist/ | grep -v "www.w3.org" || echo "no external URLs"`
Expected: `no external URLs`.

- [ ] **Step 4: Manual check in a browser**

Run: `npm run dev` and open the printed local URL. Check each item:

1. Desktop width: two columns, settings on the left and sticky while scrolling; four stats in one row.
2. Narrow the window to 320 px: single column in the order header, settings, stats (2 × 2), pills, table, tips, instructions, buttons; no horizontal scrollbar.
3. Drag both sliders: numbers update on every step without the layout shifting.
4. Thickness: the selected segment is red; arrow keys move the selection; a focus ring is visible when tabbing.
5. Gluten free: the switch turns red, flour row reads "GF flour", hydration reads 80.
6. Set 20", 8 pizzas, Thick, gluten free on: four stacked tips with green labels.
7. Instructions: closed on load; click opens and the ▼ flips; steps are numbered 01, 02, …; toggling gluten free keeps it open.
8. Copy recipe: button reads "✓ Copied!" for 2 seconds; paste into a text editor and compare with §7.1.
9. Print / save: a new window opens with the print dialog; the page is black on white and includes the steps.
10. Reload: the settings you last chose are restored with no flash of defaults.

Fix anything that fails before committing. Stop the dev server afterwards.

- [ ] **Step 5: Run tests and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.

```bash
git add src/style.css
git commit -m "feat: add warm pizzeria theme and responsive layout"
```

---

### Task 8: GitHub Pages deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: npm scripts `test` and `build` from Task 1; build output in `dist/`.
- Produces: a workflow that tests, builds and deploys on every push to the default branch.

The repository has no git remote yet. This task adds the workflow and verifies the build locally; it does not create a remote or push. The repository's default branch is `master`; the workflow also lists `main` so a later rename needs no edit.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [master, main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the same commands the workflow runs**

Run: `npm ci && npm test && npm run build`
Expected: clean install, all tests pass, `dist/` is written.

- [ ] **Step 3: Verify the build works from a sub-path**

GitHub Pages serves project sites from `/<repo>/`. `base: './'` must make asset URLs relative.

Run: `grep -Eo '(src|href)="[^"]+"' dist/index.html`
Expected: every asset path starts with `./assets/`. None starts with `/`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: test, build and deploy to GitHub Pages"
```

- [ ] **Step 5: Report what the human must do**

Tell the human partner, without doing it yourself: create the GitHub repository and add it as a remote, push, then in the repository's Settings → Pages set Source to "GitHub Actions". The app URL in copy and print output is taken from the page's own address, so no `VITE_APP_URL` is needed unless they want a different canonical URL.

---

## Spec coverage

| Spec section | Task |
|---|---|
| §1 Goal, §2 Decisions | All |
| §3 Decisions folded into requirements (multi-tip, batch wording, rewording) | 2, 3 |
| §4 Architecture, types, module rules, data flow | 1–6 |
| §5.1 Calculation | 1 |
| §5.2 Outputs | 3, 6 |
| §5.3 Tips | 2, 6 |
| §5.4 Instructions | 3, 6 |
| §5.5 Copy recipe | 5, 6 |
| §5.6 Print / save | 5, 6 |
| §6 UI and visual design | 6 (markup), 7 (CSS) |
| §7 Storage | 4, 6 |
| §8 Error handling | 4, 6 |
| §9 Testing | 1–6; manual check in 7 |
| §10 Tooling and deployment | 1, 8 |
