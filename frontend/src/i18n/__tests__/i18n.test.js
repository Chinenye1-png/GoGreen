import { describe, it, expect, vi, beforeAll } from 'vitest';

// The i18n module runs i18n.init() on import and touches localStorage/document.
// jsdom provides document; stub localStorage defensively in case it is missing.
beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    });
  }
});

import { getLocaleDirection, LOCALE_DIRECTIONS } from '../index';

describe('getLocaleDirection', () => {
  it('returns ltr for known LTR locales', () => {
    expect(getLocaleDirection('en')).toBe('ltr');
    expect(getLocaleDirection('sw')).toBe('ltr');
  });

  it('returns rtl for the RTL locale', () => {
    expect(getLocaleDirection('ar')).toBe('rtl');
  });

  it('defaults to ltr for unknown locales', () => {
    expect(getLocaleDirection('xx')).toBe('ltr');
  });
});

describe('LOCALE_DIRECTIONS', () => {
  it('contains the expected locale entries', () => {
    expect(LOCALE_DIRECTIONS).toMatchObject({
      en: 'ltr',
      sw: 'ltr',
      ar: 'rtl',
    });
  });
});
