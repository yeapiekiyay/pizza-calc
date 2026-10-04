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
