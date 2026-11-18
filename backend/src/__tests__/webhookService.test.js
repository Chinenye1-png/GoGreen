'use strict';

const crypto = require('crypto');

describe('webhookService', () => {
  let webhookService;

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
    webhookService = require('../services/webhookService');
  });

  it('signPayload returns a stable sha256 HMAC', () => {
    const payload = '{"event":"order.paid"}';
    const expected =
      'sha256=' + crypto.createHmac('sha256', 'secret').update(payload).digest('hex');
    expect(webhookService.signPayload('secret', payload)).toBe(expected);
  });

  it('buildPayload includes event, timestamp, and order fields', () => {
    const order = {
      id: 1,
      status: 'paid',
      buyer_id: 2,
      farmer_id: 3,
      total_amount: '9.50',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const parsed = JSON.parse(webhookService.buildPayload('order.paid', order));
    expect(parsed.event).toBe('order.paid');
    expect(parsed.timestamp).toBeTruthy();
    expect(parsed.data.order_id).toBe(1);
    expect(parsed.data.total_amount).toBe('9.50');
  });

  it('retries failed deliveries and increments attempt header', async () => {
    jest.useFakeTimers();
    const insertFn = jest.fn().mockResolvedValue([]);
    const db = jest.fn((table) => {
      if (table === 'webhook_deliveries') return { insert: insertFn };
      return {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          webhook_url: 'https://example.com/hook',
          webhook_secret: 'farmer-secret',
        }),
      };
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'err' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => 'ok' });

    const promise = webhookService.fireOrderWebhook(db, 'order.paid', {
      id: 9,
      status: 'paid',
      buyer_id: 1,
      farmer_id: 7,
      total_amount: '10',
      updated_at: new Date().toISOString(),
    });
    await jest.runAllTimersAsync();
    await promise;

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][1].headers['X-Farmers-Event-Attempt']).toBe('2');
    jest.useRealTimers();
  });
});