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
