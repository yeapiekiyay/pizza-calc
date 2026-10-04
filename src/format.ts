import { ingredientRows, instructions, pills, summaryStats } from './content';
import type { IngredientKey } from './content';
import type { Recipe, Settings } from './types';

export function amountText(key: IngredientKey, recipe: Recipe): string {
  return key === 'yeast' ? recipe.yeast.toFixed(1) : String(recipe[key]);
}

export function copyText(recipe: Recipe, settings: Settings, appUrl: string): string {
  const ingredients = ingredientRows(settings.glutenFree).map(
    (row) => `${row.name}: ${amountText(row.key, recipe)}g`,
  );
  return [
    'PIZZA DOUGH RECIPE',
    `${settings.quantity}x ${settings.size}" pizza · Dough ball: ${recipe.doughBall}g`,
    '',
    ...ingredients,
    '',
    appUrl,
  ].join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PRINT_CSS = `
  body { font-family: Georgia, 'Times New Roman', serif; color: #000; background: #fff; margin: 32px; line-height: 1.4; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 24px 0 8px; }
  .url { margin: 0 0 20px; font-size: 12px; color: #444; }
  .stats { display: flex; gap: 24px; margin: 0 0 20px; }
  .stats dt { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .stats dd { margin: 0; font-size: 22px; font-weight: bold; }
  .stats dd span { font-size: 11px; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #999; }
  small { color: #444; margin-left: 6px; }
  .pills { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .pills li { border: 1px solid #000; border-radius: 999px; padding: 2px 10px; font-size: 12px; }
  ol { list-style: decimal-leading-zero; padding-left: 32px; margin: 0; }
  .step { margin: 4px 0; }
`;

export function printHtml(recipe: Recipe, settings: Settings, appUrl: string): string {
  const stats = summaryStats(recipe)
    .map(
      (stat) =>
        `<div><dt>${escapeHtml(stat.label)}</dt><dd>${escapeHtml(stat.value)} <span>${escapeHtml(stat.unit)}</span></dd></div>`,
    )
    .join('');

  const rows = ingredientRows(settings.glutenFree)
    .map((row) => {
      const note = row.note ? `<small>${escapeHtml(row.note)}</small>` : '';
      return `<tr><td>${escapeHtml(row.name)}${note}</td><td>${escapeHtml(amountText(row.key, recipe))} g</td><td>${escapeHtml(row.percent)}</td></tr>`;
    })
    .join('');

  const pill = pills(settings);
  const pillItems = [pill.doughType, pill.fermentation, pill.config]
    .map((text) => `<li>${escapeHtml(text)}</li>`)
    .join('');

  const steps = instructions(settings.glutenFree)
    .steps.map((step) => `<li class="step">${escapeHtml(step)}</li>`)
    .join('');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Pizza Dough Recipe</title>',
    `<style>${PRINT_CSS}</style>`,
    '</head>',
    '<body>',
    '<h1>Pizza Dough Recipe</h1>',
    `<p class="url">${escapeHtml(appUrl)}</p>`,
    `<dl class="stats">${stats}</dl>`,
    '<table>',
    '<thead><tr><th>Ingredient</th><th>Amount</th><th>Baker&#39;s %</th></tr></thead>',
    `<tbody>${rows}</tbody>`,
    '</table>',
    `<ul class="pills">${pillItems}</ul>`,
    '<h2>Instructions</h2>',
    `<ol>${steps}</ol>`,
    '</body>',
    '</html>',
  ].join('\n');
}
