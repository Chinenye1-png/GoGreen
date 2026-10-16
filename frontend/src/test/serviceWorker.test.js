import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import { describe, it, expect, beforeEach } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = resolve(__dirname, '../../public/sw.js');
const swSource = readFileSync(swPath, 'utf8');

// In-memory Cache Storage stub keyed by cache name.
function createCachesStub() {
  const stores = new Map();

  function makeCache(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async put(request, response) {
        store.set(typeof request === 'string' ? request : request.url, response);
      },
      async match(request) {
        const key = typeof request === 'string' ? request : request.url;
        return store.get(key);
      },
      async delete(request) {
        const key = typeof request === 'string' ? request : request.url;
        return store.delete(key);
      },
      async keys() {
        return Array.from(store.keys());
      },
    };
  }

  return {
    stores,
    async open(name) {
      return makeCache(name);
    },
    async keys() {
      return Array.from(stores.keys());
    },
    async delete(name) {
      return stores.delete(name);
    },
    async match(request) {
      const key = typeof request === 'string' ? request : request.url;
      for (const store of stores.values()) {
        if (store.has(key)) return store.get(key);
      }
      return undefined;
    },
  };
}

function loadServiceWorker() {
  const caches = createCachesStub();
  const listeners = {};
  const self = {
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    skipWaiting() {},
    clients: { claim: async () => {} },
    caches,
    location: { origin: 'https://example.com' },
  };

  const sandbox = {
    self,
    caches,
    clients: self.clients,
    location: self.location,
    console,
    fetch: async () => ({ ok: true }),
    Request: class Request {
      constructor(url, init = {}) {
        this.url = url;
        this.method = init.method || 'GET';
        this.headers = new Map(Object.entries(init.headers || {}));
      }
    },
    Response: class Response {},
    URL,
    Promise,
    Map,
    Set,
    Array,
    Object,
    JSON,
    RegExp,
    String,
    Number,
    Boolean,
    Error,
    Date,
    Math,
  };
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(swSource, sandbox);

  return { sandbox, caches, listeners };
}

function makeRequest(url, { method = 'GET', headers = {} } = {}) {
  return {
    url,
    method,
    headers: {
      get(name) {
        const key = Object.keys(headers).find(
          (h) => h.toLowerCase() === name.toLowerCase()
        );
        return key ? headers[key] : null;
      },
    },
  };
}

describe('service worker API cache allowlist', () => {
  let sw;

  beforeEach(() => {
    sw = loadServiceWorker();
  });

  it('exposes isCacheableApiRequest and clearUserCache', () => {
    expect(typeof sw.sandbox.isCacheableApiRequest).toBe('function');
    expect(typeof sw.sandbox.clearUserCache).toBe('function');
  });

  it('returns false for POST requests', () => {
    const request = makeRequest('https://example.com/api/v1/products', {
      method: 'POST',
    });
    expect(sw.sandbox.isCacheableApiRequest(request)).toBe(false);
  });

  it('returns false for GET requests carrying an Authorization header', () => {
    const request = makeRequest('https://example.com/api/v1/products', {
      headers: { Authorization: 'Bearer token' },
    });
    expect(sw.sandbox.isCacheableApiRequest(request)).toBe(false);
  });

  it('returns true for allowlisted unauthenticated GET requests', () => {
    for (const path of ['/api/v1/products', '/api/v1/categories', '/api/v1/rates']) {
      const request = makeRequest(`https://example.com${path}`);
      expect(sw.sandbox.isCacheableApiRequest(request)).toBe(true);
    }
  });

  it('returns false for non-allowlisted API paths', () => {
    for (const path of ['/api/wallet', '/api/orders', '/api/messages']) {
      const request = makeRequest(`https://example.com${path}`);
      expect(sw.sandbox.isCacheableApiRequest(request)).toBe(false);
    }
  });
});

describe('clearUserCache', () => {
  it('deletes cached /api/ entries but keeps non-API entries', async () => {
    const sw = loadServiceWorker();
    const cache = await sw.caches.open('api-cache');
    await cache.put('https://example.com/api/v1/products', { body: 'products' });
    await cache.put('https://example.com/api/wallet', { body: 'wallet' });
    await cache.put('https://example.com/offline.html', { body: 'offline' });

    await sw.sandbox.clearUserCache();

    const remaining = await cache.keys();
    expect(remaining).not.toContain('https://example.com/api/v1/products');
    expect(remaining).not.toContain('https://example.com/api/wallet');
    expect(remaining).toContain('https://example.com/offline.html');
  });
});
