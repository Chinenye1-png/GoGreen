const db = require('../db/schema');
const {
  getCachedResponse,
  claimIdempotencyKey,
  releaseIdempotencyKey,
  cacheResponse,
} = require('../utils/idempotency');

const USER_ID = 1;
const OTHER_USER_ID = 2;

async function clearKeys() {
  await db.query('DELETE FROM idempotency_keys');
}

beforeEach(async () => {
  await clearKeys();
});

afterAll(async () => {
  await clearKeys();
});

describe('idempotency utility', () => {
  test('a duplicate key returns the cached response and the handler runs once', async () => {
    const key = 'dup-key';
    const payload = { amount: 100 };
    const handler = jest.fn(async () => ({ ok: true, amount: payload.amount }));

    async function run(payload) {
      const claim = await claimIdempotencyKey(USER_ID, key);
      if (claim.status === 'cached') return claim.response;
      if (claim.status === 'in_progress') throw new Error('Request already in progress');
      try {
        const response = await handler(payload);
        await cacheResponse(key, response, undefined, USER_ID);
        return response;
      } catch (err) {
        await releaseIdempotencyKey(key, USER_ID);
        throw err;
      }
    }

    const first = await run(payload);
    const second = await run(payload);

    expect(first).toEqual({ ok: true, amount: 100 });
    expect(second).toEqual(first);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('a reused key with a different payload is rejected with a clear error', async () => {
    const key = 'reuse-key';
    const originalPayload = { amount: 100 };
    const differentPayload = { amount: 250 };

    await cacheResponse(key, { ok: true, payload: originalPayload }, undefined, USER_ID);

    const cached = await getCachedResponse(key, USER_ID);
    expect(cached).toEqual({ ok: true, payload: originalPayload });

    const isSamePayload =
      JSON.stringify(cached.payload) === JSON.stringify(differentPayload);
    expect(isSamePayload).toBe(false);

    const claim = await claimIdempotencyKey(USER_ID, key);
    expect(claim.status).toBe('cached');

    const reject = () => {
      if (!isSamePayload) {
        throw new Error('Idempotency key reused with a different payload');
      }
      return claim.response;
    };

    expect(reject).toThrow('Idempotency key reused with a different payload');
  });

  test('an expired key is not treated as a duplicate', async () => {
    const key = 'expired-key';
    const handler = jest.fn(async () => ({ ok: true, run: 'fresh' }));

    await cacheResponse(key, { ok: true, run: 'stale' }, -1, USER_ID);

    const cached = await getCachedResponse(key, USER_ID);
    expect(cached).toBeNull();

    const claim = await claimIdempotencyKey(USER_ID, key);
    expect(claim.status).toBe('claimed');

    const response = await handler();
    await cacheResponse(key, response, undefined, USER_ID);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ ok: true, run: 'fresh' });
    expect(await getCachedResponse(key, USER_ID)).toEqual({ ok: true, run: 'fresh' });
  });

  test('keys are scoped per user', async () => {
    const key = 'scoped-key';
    await cacheResponse(key, { ok: true, user: USER_ID }, undefined, USER_ID);

    expect(await getCachedResponse(key, USER_ID)).toEqual({ ok: true, user: USER_ID });
    expect(await getCachedResponse(key, OTHER_USER_ID)).toBeNull();
  });
});
