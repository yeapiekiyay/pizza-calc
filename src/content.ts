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
