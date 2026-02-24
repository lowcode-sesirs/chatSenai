import { afterEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

const setupBrowserMocks = ({ embedded = false } = {}) => {
  const sessionStorage = new MemoryStorage();
  const localStorage = new MemoryStorage();

  const win = {
    __MOODLE_USER__: null,
    __SENAI_API_BASE_URL__: null,
    __API_BASE_URL__: null,
    location: { search: '' },
    sessionStorage,
    localStorage,
  };

  win.parent = embedded ? {} : win;
  win.top = embedded ? {} : win;

  Object.defineProperty(globalThis, 'window', {
    value: win,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorage,
    configurable: true,
    writable: true,
  });

  return { win, sessionStorage, localStorage };
};

describe('chatService.getMoodleUserId', () => {
  afterEach(() => {
    vi.resetModules();
    delete globalThis.window;
    delete globalThis.sessionStorage;
    delete globalThis.localStorage;
  });

  it('ignora localStorage.moodle_user quando executa em iframe', async () => {
    const { localStorage } = setupBrowserMocks({ embedded: true });
    localStorage.setItem(
      'moodle_user',
      JSON.stringify({ userEmail: 'usuario-antigo@exemplo.com', userId: '999' })
    );

    const mod = await import('./chatService.js');
    const result = mod.getMoodleUserId();

    expect(result).not.toBe('usuario-antigo@exemplo.com');
  });

  it('usa localStorage.moodle_user fora do iframe como fallback', async () => {
    const { localStorage } = setupBrowserMocks({ embedded: false });
    localStorage.setItem(
      'moodle_user',
      JSON.stringify({ userEmail: 'usuario@exemplo.com', userId: '123' })
    );

    const mod = await import('./chatService.js');
    const result = mod.getMoodleUserId();

    expect(result).toBe('usuario@exemplo.com');
  });
});

