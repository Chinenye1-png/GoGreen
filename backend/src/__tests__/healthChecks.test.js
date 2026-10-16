const mockQuery = jest.fn();

jest.mock('../db/schema', () => ({
  db: {
    query: (...args) => mockQuery(...args),
  },
}));

jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const {
  checkDatabase,
  checkStellarHorizon,
  checkSorobanRPC,
} = require('../routes/index');

describe('health-check helpers', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('checkDatabase', () => {
    it("returns status 'ok' when db.query resolves", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const result = await checkDatabase();

      expect(result.status).toBe('ok');
      expect(result).not.toHaveProperty('error');
      expect(typeof result.responseTime).toBe('string');
      expect(result.responseTime).toMatch(/ms$/);
    });

    it("returns status 'down' with an error property when db.query rejects", async () => {
      mockQuery.mockRejectedValueOnce(new Error('connection refused'));

      const result = await checkDatabase();

      expect(result.status).toBe('down');
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('connection refused');
      expect(typeof result.responseTime).toBe('string');
      expect(result.responseTime).toMatch(/ms$/);
    });
  });

  describe('checkSorobanRPC', () => {
    const originalUrl = process.env.SOROBAN_RPC_URL;

    afterEach(() => {
      if (originalUrl === undefined) {
        delete process.env.SOROBAN_RPC_URL;
      } else {
        process.env.SOROBAN_RPC_URL = originalUrl;
      }
    });

    it("returns status 'not_configured' when SOROBAN_RPC_URL is unset", async () => {
      delete process.env.SOROBAN_RPC_URL;

      const result = await checkSorobanRPC('test-request-id');

      expect(result.status).toBe('not_configured');
      expect(typeof result.responseTime).toBe('string');
      expect(result.responseTime).toMatch(/ms$/);
    });
  });

  describe('checkStellarHorizon', () => {
    it('returns a result with a responseTime string ending in ms', async () => {
      const result = await checkStellarHorizon('test-request-id');

      expect(result).toHaveProperty('status');
      expect(typeof result.responseTime).toBe('string');
      expect(result.responseTime).toMatch(/ms$/);
    });
  });
});
