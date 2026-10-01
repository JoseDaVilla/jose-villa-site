import { describe, expect, it } from 'vitest';
import { withBase } from '../src/lib/paths';

describe('withBase', () => {
  it('keeps root-relative paths at the domain root', () => {
    expect(withBase('/favicon.svg', '/')).toBe('/favicon.svg');
    expect(withBase('', '/')).toBe('/');
  });

  it('prefixes a sub-path base with or without a trailing slash', () => {
    expect(withBase('/favicon.svg', '/jose-villa-site')).toBe('/jose-villa-site/favicon.svg');
    expect(withBase('og/default.png', '/jose-villa-site/')).toBe('/jose-villa-site/og/default.png');
    expect(withBase('', '/jose-villa-site')).toBe('/jose-villa-site/');
  });
});
