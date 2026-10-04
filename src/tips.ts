import type { Settings, Tip } from './types';

export function tipsFor(settings: Settings): Tip[] {
  const tips: Tip[] = [];

  if (settings.glutenFree) {
    tips.push({
      label: 'Gluten free',
      text: 'Gluten-free dough is sticky. Oil your hands before shaping.',
    });
  }
  if (settings.size >= 18) {
    tips.push({
      label: 'Big pizza',
      text: `A ${settings.size}" pizza needs a fully hot oven. Preheat at max temperature for 45 minutes.`,
    });
  }
  if (settings.quantity >= 8) {
    const keeps = settings.glutenFree ? 'up to 48 hours' : '4 days';
    tips.push({
      label: 'Big batch',
      text: `Shape all ${settings.quantity} balls at once. They keep ${keeps} in the fridge.`,
    });
  }
  if (settings.thickness === 'thick') {
    tips.push({
      label: 'Thick crust',
      text: 'Bake at 450°F for 10–12 minutes instead of the usual 6–8.',
    });
  }
  if (settings.thickness === 'thin') {
    tips.push({
      label: 'Thin crust',
      text: 'Thin crust bakes in 4–5 minutes. Watch it closely.',
    });
  }

  return tips;
}
