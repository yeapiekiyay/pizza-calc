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

describe('first paint', () => {
  it('marks the document ready only after the saved settings are rendered', () => {
    document.documentElement.classList.remove('ready');
    document.body.innerHTML = body;
    expect(document.documentElement.classList.contains('ready')).toBe(false);
    initApp();
    expect(document.documentElement.classList.contains('ready')).toBe(true);
    expect(text('#stat-ball')).toBe('484');
  });
});
