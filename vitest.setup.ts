import { vi } from 'vitest';
import * as React from 'react';
import { act } from 'react';

// React 19 compatibility polyfill for @testing-library/react
if (React && !(React as any).act) {
  (React as any).act = act;
}

// Mock window.alert to prevent test execution blocks
window.alert = vi.fn();
globalThis.alert = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});