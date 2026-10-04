# Pizza Dough Calculator — Requirements Spec

## 1. Purpose

A single-page, client-side tool. The user picks pizza size, number of pizzas,
crust thickness and regular vs. gluten-free dough. The tool shows exact
ingredient weights in grams, baker's percentages, the weight of each dough ball,
a contextual tip, and dough-making instructions. No signup, no server calls.
Every input change recalculates immediately.

## 2. Inputs

| Input | Control | Range / options | Step | Default |
|---|---|---|---|---|
| Pizza size (diameter, inches) | Slider | 10–20 | 1 | 16 |
| Number of pizzas | Slider | 1–10 | 1 | 6 |
| Thickness | 3-way button group (single select) | Thin, Regular, Thick | — | Regular |
| Gluten free | Toggle | off / on | — | off |

- Input group is headed "Your pizza settings".
- Size slider shows the current value as `16"`; tick labels at 10", 15", 20".
- Quantity slider shows the current value; tick labels at 1, 5, 10.
- Gluten-free toggle is labelled "Gluten free" with subtext "GF flour + adjusted hydration".
- Inputs are independent: changing one never resets another (e.g. toggling
  gluten free keeps the selected thickness).

## 3. Calculation

### 3.1 Constants

| Name | Value | Meaning |
|---|---|---|
| Reference size | 16 in | Size the base flour is defined at |
| Reference quantity | 6 pizzas | Quantity the base flour is defined at |
| Reference thickness | 2.11 | Thickness value of "Regular" |
| Base flour, regular | `1509.797685 × (480 / 425)` = 1705.1833 g | Flour for 6 × 16" regular pizzas (284.1972 g per pizza) |
| Base flour, gluten free | `333 × 6` = 1998 g | Flour for 6 × 16" regular-thickness GF pizzas (333 g per pizza) |
| Dough factor, regular | 1.702 | Sum of baker's percentages (1 + 0.62 + 0.004 + 0.025 + 0.02 + 0.033) |
| Dough factor, gluten free | 1.882 | Sum of baker's percentages (1 + 0.80 + 0.004 + 0.025 + 0.02 + 0.033) |

### 3.2 Thickness values

| Option | Value | Multiplier vs. Regular (`value / 2.11`) |
|---|---|---|
| Thin | 1.8 | 0.8531 (−14.7%) |
| Regular | 2.11 | 1.0000 |
| Thick | 2.75 | 1.3033 (+30.3%) |

### 3.3 Flour formula

```
flour = baseFlour × (size / 16)² × (quantity / 6) × (thickness / 2.11)
```

- Size scales by area (square of diameter).
- Quantity scales linearly.
- Thickness scales linearly.
- `baseFlour` is 1705.1833 g (regular) or 1998 g (gluten free). Gluten-free uses
  17.17% more flour than regular for the same size, quantity and thickness.

Equivalent per-pizza form:

```
flourPerPizza = P × (size / 16)² × (thickness / 2.11)
P = 284.1972 g (regular) | 333 g (gluten free)
```

### 3.4 Ingredient ratios (baker's percentages, flour = 100%)

| Ingredient | Regular dough | Gluten-free dough | Note shown under name |
|---|---|---|---|
| Flour | 100% — "Bread flour" | 100% — "GF flour" | Regular: "12–14% protein"; GF: "Caputo GF recommended" |
| Water | 62% | 80% | "Cold, under 60°F" |
| Yeast | 0.4% | 0.4% | "Active dry" |
| Salt | 2.5% | 2.5% | — |
| Sugar | 2% | 2% | — |
| Olive oil | 3.3% | 3.3% | — |

Only the flour type, the base flour amount and the water percentage differ
between regular and gluten free. Thickness, size and quantity change the flour
amount only; the percentages never change.

```
water  = flour × 0.62   (regular)   | flour × 0.80 (gluten free)
yeast  = flour × 0.004
salt   = flour × 0.025
sugar  = flour × 0.02
oil    = flour × 0.033
```

### 3.5 Dough ball weight

```
doughBall = flour × (1 + water% + 0.004 + 0.025 + 0.02 + 0.033) / quantity
          = flour × 1.702 / quantity     (regular)
          = flour × 1.882 / quantity     (gluten free)
```

Grams per ball; one ball per pizza. Ball weight is the true total dough weight
divided by quantity, so it depends on size, thickness and dough type, not on
quantity.

### 3.6 Rounding

- All ingredient amounts are computed from the unrounded flour value, then rounded.
- Flour, water, salt, sugar, olive oil, dough ball: round to nearest whole gram (half rounds up).
- Yeast: one decimal place.
- Hydration: whole percent (62 or 80).

### 3.7 Reference values (acceptance tests)

Regular dough:

| Size | Qty | Thickness | Flour | Water | Yeast | Salt | Sugar | Oil | Ball |
|---|---|---|---|---|---|---|---|---|---|
| 16" | 6 | Regular | 1705 | 1057 | 6.8 | 43 | 34 | 56 | 484 |
| 16" | 1 | Regular | 284 | 176 | 1.1 | 7 | 6 | 9 | 484 |
| 12" | 1 | Regular | 160 | 99 | 0.6 | 4 | 3 | 5 | 272 |
| 12" | 4 | Thin | 545 | 338 | 2.2 | 14 | 11 | 18 | 232 |
| 10" | 1 | Thin | 95 | 59 | 0.4 | 2 | 2 | 3 | 161 |
| 20" | 10 | Thick | 5787 | 3588 | 23.1 | 145 | 116 | 191 | 985 |

Gluten-free dough:

| Size | Qty | Thickness | Flour | Water | Yeast | Salt | Sugar | Oil | Ball |
|---|---|---|---|---|---|---|---|---|---|
| 16" | 6 | Regular | 1998 | 1598 | 8.0 | 50 | 40 | 66 | 627 |
| 16" | 1 | Regular | 333 | 266 | 1.3 | 8 | 7 | 11 | 627 |
| 12" | 2 | Thick | 488 | 391 | 2.0 | 12 | 10 | 16 | 459 |

All values in grams.

## 4. Outputs

### 4.1 Summary stats (four cells)

| Label | Value | Unit text |
|---|---|---|
| Dough ball | ball weight | "grams each" |
| Total flour | flour | "grams" |
| Total water | water | "grams" |
| Hydration | 62 or 80 | "percent" |

### 4.2 Ingredient table

Columns: Ingredient, Amount (with `g` unit), Baker's %. Six rows in this order:
flour, water, yeast, salt, sugar, olive oil, with the names, notes and
percentages from section 3.4.

### 4.3 Summary pills

| Pill | Regular | Gluten free |
|---|---|---|
| Dough type (highlighted) | "Regular dough" | "Gluten-free" |
| Fermentation | "Cold ferment 2–4 days" | "Cold rest up to 48hrs" |
| Config | `{qty} ball(s) · {size}" · {thin\|regular\|thick}` | same |

"ball" is singular when quantity is 1.

## 5. Contextual tip

Show at most one tip. Evaluate in this order; first match wins. If none match,
hide the tip.

| Priority | Condition | Label | Text |
|---|---|---|---|
| 1 | Gluten free on | "GF tip" | "GF dough is stickier — oil your hands before shaping." |
| 2 | Size ≥ 18" | "Big pizza tip" | `{size}" is large — preheat for the full 45 min at max temp.` |
| 3 | Quantity ≥ 8 | "Batch tip" | `Making {qty} pizzas? Shape all balls at once — they keep 4 days in the fridge.` |
| 4 | Thickness = Thick | "Thick crust" | "Drop to 450°F and give it 10–12 min instead of 6–8." |
| 5 | Thickness = Thin | "Thin crust" | "Thin crust cooks fast — 4–5 minutes. Watch it closely." |

## 6. Dough making instructions

Collapsible section, collapsed by default, toggled by clicking its header. The
header shows a ▼ indicator that reflects the open/closed state. The open/closed
state is kept when the dough type changes.
Steps are numbered with two digits (01, 02, …). The step list and the header
title switch with the gluten-free toggle.

### 6.1 Regular dough — title "Dough making instructions"

1. Cool water to under 60°F
2. Mix water + active dry yeast
3. Add flour + olive oil, mix 2 min
4. Add sugar and salt on low
5. Mix 10 more minutes
6. Cover, rest 1–3 hours
7. Shape into balls, seal seam
8. Refrigerate 2–4 days (3 ideal)
9. Bring to room temp before using

### 6.2 Gluten-free dough — title "Gluten-free instructions"

1. Add cold water and yeast
2. Add GF flour + olive oil, mix 2 min
3. Add sugar and salt, mix 3–4 min
4. Refrigerate 15 min to firm up
5. Oil hands, shape into balls
6. Refrigerate up to 48 hours
7. Bring to room temp before using

### 6.3 Baking guidance implied by the tips

- Standard bake: 6–8 minutes at maximum oven temperature after a 45-minute preheat.
- Thick crust: 450°F for 10–12 minutes.
- Thin crust: 4–5 minutes.
- Regular dough balls keep 4 days refrigerated; gluten-free up to 48 hours.

## 7. Actions

### 7.1 Copy recipe

Button labelled "Copy recipe". Copies plain text to the clipboard, then shows
"✓ Copied!" on the button for 2 seconds before restoring the label. If the
clipboard API is unavailable, the button does nothing. Format:

```
PIZZA DOUGH RECIPE
{qty}x {size}" pizza · Dough ball: {ball}g

{Flour name}: {amount}g
Water: {amount}g
Yeast: {amount}g
Salt: {amount}g
Sugar: {amount}g
Olive oil: {amount}g

{app URL}
```

`{Flour name}` is "Bread flour" or "GF flour". Amounts use the same rounding as
the ingredient table (yeast to one decimal).

### 7.2 Print / save

Button labelled "Print / save". Opens a print-friendly view in a new window
(about 800 × 900) and triggers the browser print dialog. Contents, in order:
title "Pizza Dough Recipe", the app URL, the four summary stats, the ingredient
table, the three pills, then an "Instructions" heading with the full step list
for the current dough type. The steps are included even when the on-page
instruction section is collapsed.

## 8. Remembered settings

The tool remembers the user's last chosen settings on the same browser and
device and restores them on the next visit.

- Persisted values: pizza size, number of pizzas, thickness, gluten-free on/off.
  The instruction section's open/closed state is not persisted.
- Storage: browser `localStorage`, one key (`pizzaCalc.settings`) holding a JSON
  object, e.g. `{"v":1,"size":16,"quantity":6,"thickness":"regular","glutenFree":false}`.
  Thickness is stored by option name (`thin` / `regular` / `thick`), not by its
  numeric value. `v` is a schema version.
- Save on every input change, after recalculation.
- Restore on page load, before the first render, so the defaults never flash.
- Validate each restored value independently: size an integer 10–20, quantity an
  integer 1–10, thickness one of the three names, gluten free a boolean. Any
  missing or invalid value falls back to that input's default. Unparseable JSON
  or an unknown `v` falls back to all defaults.
- Storage failures (disabled, private mode, quota) are ignored silently; the
  tool works normally with defaults and nothing persisted.
- Settings never leave the browser. No cookies, no server calls.
- No expiry. Settings persist until the user clears site data.

## 9. Non-functional requirements

- All computation client-side; no network requests for calculation.
- Recalculate on every slider movement, thickness selection and toggle change.
- Initial render shows results for the saved settings (section 8), or for the
  defaults (16", 6 pizzas, Regular, not gluten free) when none are saved.
- Responsive layout; inputs stack on narrow screens.
- Units are grams and inches only; no unit conversion.

## 10. Design notes

Known trade-offs in the behaviour specified above. Decide per item whether to
keep or change.

1. **Tips are mutually exclusive.** A gluten-free, 20", thick pizza shows only
   the GF tip; the big-pizza and thick-crust advice is hidden.
2. **Small-batch precision.** Whole-gram rounding is coarse for small recipes
   (one 10" thin pizza: 2 g salt, 2 g sugar, 0.4 g yeast).
3. **Fermentation wording differs.** The batch tip says balls keep 4 days, which
   contradicts the gluten-free 48-hour limit; it is only unreachable because the
   GF tip takes priority.
