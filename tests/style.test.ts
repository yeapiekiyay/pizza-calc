import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/style.css', 'utf8');

describe('style.css', () => {
  it('keeps the layout hidden until the app marks the document ready', () => {
    expect(css).toMatch(/html:not\(\.ready\) \.layout \{\s*visibility: hidden;\s*\}/);
  });

  it('makes the settings card sticky only when the viewport is tall enough to show all of it', () => {
    const sticky = css.indexOf('position: sticky');
    const query = css.lastIndexOf('@media', sticky);
    expect(css.slice(query, sticky)).toMatch(/^@media \(min-width: 760px\) and \(min-height: 560px\)/);
  });
});
