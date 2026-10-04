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
