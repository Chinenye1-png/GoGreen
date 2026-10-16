'use strict';

const request = require('supertest');

jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const ALLOWED_ORIGIN = 'http://allowed.example.com';
const UNKNOWN_ORIGIN = 'http://unknown.example.com';

function loadApp({ corsOrigin, nodeEnv }) {
  jest.resetModules();
  process.env.CORS_ORIGIN = corsOrigin;
  process.env.NODE_ENV = nodeEnv;
  // eslint-disable-next-line global-require
  return require('../app');
}

describe('CORS origin callback', () => {
  const originalCorsOrigin = process.env.CORS_ORIGIN;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = originalCorsOrigin;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    jest.resetModules();
  });

  it('allows requests with no Origin header', async () => {
    const app = loadApp({ corsOrigin: ALLOWED_ORIGIN, nodeEnv: 'production' });

    const res = await request(app).get('/health');

    expect(res.status).not.toBe(500);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows an origin present in CORS_ORIGIN', async () => {
    const app = loadApp({ corsOrigin: ALLOWED_ORIGIN, nodeEnv: 'production' });

    const res = await request(app).get('/health').set('Origin', ALLOWED_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  it('rejects an unknown origin when NODE_ENV=production', async () => {
    const app = loadApp({ corsOrigin: ALLOWED_ORIGIN, nodeEnv: 'production' });

    const res = await request(app).get('/health').set('Origin', UNKNOWN_ORIGIN);

    expect(res.status).toBe(500);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows an unknown origin when NODE_ENV is not production', async () => {
    const app = loadApp({ corsOrigin: ALLOWED_ORIGIN, nodeEnv: 'development' });

    const res = await request(app).get('/health').set('Origin', UNKNOWN_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBe(UNKNOWN_ORIGIN);
  });
});
