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
