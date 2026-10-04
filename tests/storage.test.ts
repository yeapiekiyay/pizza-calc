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
