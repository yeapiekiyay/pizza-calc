import { describe, expect, it } from 'vitest';
import { calculate } from '../src/calc';
import { amountText, copyText, printHtml } from '../src/format';
import type { Settings } from '../src/types';

const regular: Settings = { size: 16, quantity: 6, thickness: 'regular', glutenFree: false };
const glutenFree: Settings = { ...regular, glutenFree: true };
const url = 'https://example.test/pizza/';

describe('amountText', () => {
  it('shows yeast with one decimal place, including a trailing zero', () => {
    expect(amountText('yeast', calculate(glutenFree))).toBe('8.0');
    expect(amountText('yeast', calculate(regular))).toBe('6.8');
  });

  it('shows other ingredients as whole grams', () => {
    expect(amountText('flour', calculate(regular))).toBe('1705');
    expect(amountText('oil', calculate(regular))).toBe('56');
  });
});

describe('copyText', () => {
  it('regular dough', () => {
    expect(copyText(calculate(regular), regular, url)).toBe(
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
        'https://example.test/pizza/',
      ].join('\n'),
    );
  });

  it('gluten-free dough', () => {
    expect(copyText(calculate(glutenFree), glutenFree, url)).toBe(
      [
        'PIZZA DOUGH RECIPE',
        '6x 16" pizza · Dough ball: 627g',
        '',
        'GF flour: 1998g',
        'Water: 1598g',
        'Yeast: 8.0g',
        'Salt: 50g',
        'Sugar: 40g',
        'Olive oil: 66g',
        '',
        'https://example.test/pizza/',
      ].join('\n'),
    );
  });
});

describe('printHtml', () => {
  it('contains every section in the specified order', () => {
    const html = printHtml(calculate(regular), regular, url);
    const positions = [
      '<h1>Pizza Dough Recipe</h1>',
      'https://example.test/pizza/',
      'Dough ball',
      'Total flour',
      'Total water',
      'Hydration',
      'Bread flour',
      'Olive oil',
      'Regular dough',
      'Cold ferment 2–4 days',
      '6 balls · 16&quot; · regular',
      '<h2>Instructions</h2>',
      'Chill the water to below 60°F.',
      'Bring to room temperature before using.',
    ].map((text) => html.indexOf(text));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('lists all nine regular steps', () => {
    const html = printHtml(calculate(regular), regular, url);
    expect(html.match(/<li class="step">/g)).toHaveLength(9);
  });

  it('uses the gluten-free steps and names for gluten-free dough', () => {
    const html = printHtml(calculate(glutenFree), glutenFree, url);
    expect(html.match(/<li class="step">/g)).toHaveLength(7);
    expect(html).toContain('Stir the yeast into the cold water.');
    expect(html).toContain('GF flour');
    expect(html).toContain('8.0 g');
    expect(html).not.toContain('Chill the water to below 60°F.');
  });

  it('does not include tips', () => {
    const html = printHtml(calculate(glutenFree), glutenFree, url);
    expect(html).not.toContain('Oil your hands before shaping.');
  });

  it('escapes the app URL', () => {
    const html = printHtml(calculate(regular), regular, 'https://example.test/?a=1&b=<script>');
    expect(html).toContain('https://example.test/?a=1&amp;b=&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('is a complete document that loads nothing external', () => {
    const html = printHtml(calculate(regular), regular, url);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).not.toMatch(/<link|<script|@import|url\(/);
  });
});
