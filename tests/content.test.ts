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
