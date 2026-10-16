jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

const setEnv = (overrides) => {
  process.env = { ...ORIGINAL_ENV, ...overrides };
  Object.keys(overrides).forEach((key) => {
    if (overrides[key] === undefined) {
      delete process.env[key];
    }
  });
};

describe('required-env startup guard', () => {
  let exitSpy;

  beforeEach(() => {
    jest.resetModules();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
    process.env = { ...ORIGINAL_ENV };
  });

  it('exits when JWT_SECRET is unset', () => {
    setEnv({ JWT_SECRET: undefined, ENCRYPTION_SECRET: 'encryption-secret' });

    expect(() => require('../app')).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when ENCRYPTION_SECRET is unset', () => {
    setEnv({ JWT_SECRET: 'a'.repeat(32), ENCRYPTION_SECRET: undefined });

    expect(() => require('../app')).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when NODE_ENV=production and JWT_SECRET is shorter than 32 bytes', () => {
    setEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'too-short',
      ENCRYPTION_SECRET: 'encryption-secret',
    });

    expect(() => require('../app')).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('does not exit when both secrets are set and JWT_SECRET is at least 32 bytes', () => {
    setEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'a'.repeat(32),
      ENCRYPTION_SECRET: 'encryption-secret',
    });

    expect(() => require('../app')).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
