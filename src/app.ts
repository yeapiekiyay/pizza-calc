import { calculate } from './calc';
import { APP_URL } from './config';
import { copyText, printHtml } from './format';
import { createRenderer } from './render';
import type { View } from './render';
import { loadSettings, saveSettings } from './storage';
import { tipsFor } from './tips';
import { THICKNESSES } from './types';
import type { Settings, Thickness } from './types';

const COPY_LABEL = 'Copy recipe';
const COPIED_LABEL = '✓ Copied!';
const COPIED_MS = 2000;

function byId<T extends HTMLElement>(doc: Document, id: string): T {
  const element = doc.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

export function initApp(doc: Document = document): void {
  const sizeInput = byId<HTMLInputElement>(doc, 'size');
  const quantityInput = byId<HTMLInputElement>(doc, 'quantity');
  const glutenFreeInput = byId<HTMLInputElement>(doc, 'gluten-free');
  const thicknessInputs = Array.from(doc.querySelectorAll<HTMLInputElement>('input[name="thickness"]'));
  const instructionsToggle = byId<HTMLButtonElement>(doc, 'instructions-toggle');
  const instructionsPanel = byId(doc, 'instructions-panel');
  const copyButton = byId<HTMLButtonElement>(doc, 'copy-button');
  const printButton = byId<HTMLButtonElement>(doc, 'print-button');

  const render = createRenderer(doc);
  let settings: Settings = loadSettings();

  const view = (): View => ({
    settings,
    recipe: calculate(settings),
    tips: tipsFor(settings),
  });

  const update = (patch: Partial<Settings>): void => {
    settings = { ...settings, ...patch };
    render(view());
    saveSettings(settings);
  };

  sizeInput.value = String(settings.size);
  quantityInput.value = String(settings.quantity);
  glutenFreeInput.checked = settings.glutenFree;
  for (const input of thicknessInputs) {
    input.checked = input.value === settings.thickness;
  }
  render(view());

  sizeInput.addEventListener('input', () => update({ size: Number(sizeInput.value) }));
  quantityInput.addEventListener('input', () => update({ quantity: Number(quantityInput.value) }));
  glutenFreeInput.addEventListener('change', () => update({ glutenFree: glutenFreeInput.checked }));
  for (const input of thicknessInputs) {
    input.addEventListener('change', () => {
      const value = input.value as Thickness;
      if (input.checked && THICKNESSES.includes(value)) update({ thickness: value });
    });
  }

  instructionsToggle.addEventListener('click', () => {
    const open = instructionsToggle.getAttribute('aria-expanded') !== 'true';
    instructionsToggle.setAttribute('aria-expanded', String(open));
    instructionsPanel.hidden = !open;
  });

  let copiedTimer: ReturnType<typeof setTimeout> | undefined;
  copyButton.addEventListener('click', () => {
    const clipboard: Clipboard | undefined = navigator.clipboard;
    if (!clipboard?.writeText) return;
    clipboard.writeText(copyText(calculate(settings), settings, APP_URL)).then(
      () => {
        copyButton.textContent = COPIED_LABEL;
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => {
          copyButton.textContent = COPY_LABEL;
        }, COPIED_MS);
      },
      () => {
        // Write refused (permissions, lost focus): leave the button as it is.
      },
    );
  });

  printButton.addEventListener('click', () => {
    const popup = window.open('', '_blank', 'width=800,height=900');
    if (!popup) return;
    popup.document.write(printHtml(calculate(settings), settings, APP_URL));
    popup.document.close();
    popup.focus();
    popup.print();
  });
}
