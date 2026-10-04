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
