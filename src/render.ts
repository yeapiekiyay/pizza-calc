import { ingredientRows, instructions, pills, summaryStats } from './content';
import { amountText } from './format';
import type { Recipe, Settings, Tip } from './types';

export interface View {
  settings: Settings;
  recipe: Recipe;
  tips: Tip[];
}

function byId(doc: Document, id: string): HTMLElement {
  const element = doc.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element;
}

function within(parent: Element, selector: string): HTMLElement {
  const element = parent.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing element ${selector}`);
  return element;
}

export function createRenderer(doc: Document): (view: View) => void {
  const sizeValue = byId(doc, 'size-value');
  const quantityValue = byId(doc, 'quantity-value');
  const pillType = byId(doc, 'pill-type');
  const pillFerment = byId(doc, 'pill-ferment');
  const pillConfig = byId(doc, 'pill-config');
  const tipList = byId(doc, 'tips');
  const instructionsTitle = byId(doc, 'instructions-title');
  const instructionsSteps = byId(doc, 'instructions-steps');

  return ({ settings, recipe, tips }) => {
    sizeValue.textContent = `${settings.size}"`;
    quantityValue.textContent = String(settings.quantity);

    for (const stat of summaryStats(recipe)) {
      byId(doc, `stat-${stat.key}`).textContent = stat.value;
    }

    const pill = pills(settings);
    pillType.textContent = pill.doughType;
    pillFerment.textContent = pill.fermentation;
    pillConfig.textContent = pill.config;

    for (const row of ingredientRows(settings.glutenFree)) {
      const tr = within(doc.body, `[data-ingredient="${row.key}"]`);
      within(tr, '.ing-name').textContent = row.name;
      within(tr, '.ing-note').textContent = row.note;
      within(tr, '.ing-amount').textContent = amountText(row.key, recipe);
      within(tr, '.ing-percent').textContent = row.percent;
    }

    tipList.replaceChildren(
      ...tips.map((tip) => {
        const item = doc.createElement('li');
        item.className = 'tip';
        const label = doc.createElement('span');
        label.className = 'tip-label';
        label.textContent = tip.label;
        const body = doc.createElement('span');
        body.className = 'tip-text';
        body.textContent = tip.text;
        item.append(label, body);
        return item;
      }),
    );
    tipList.hidden = tips.length === 0;

    const guide = instructions(settings.glutenFree);
    instructionsTitle.textContent = guide.title;
    instructionsSteps.replaceChildren(
      ...guide.steps.map((step) => {
        const item = doc.createElement('li');
        item.textContent = step;
        return item;
      }),
    );
  };
}
