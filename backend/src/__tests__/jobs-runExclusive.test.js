jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { runExclusive, JOBS } = require('../jobs');

describe('runExclusive overlap guard', () => {
  it('returns "completed" then "skipped" when the same job runs concurrently', async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });

    const first = runExclusive('overlap-job', async () => {
      await gate;
    });

    // Second invocation happens while the first is still in progress.
    const second = await runExclusive('overlap-job', async () => {});
    expect(second).toBe('skipped');

    release();
    await expect(first).resolves.toBe('completed');
  });

  it('returns "failed" and resolves when the job throws', async () => {
    const result = await runExclusive('throwing-job', async () => {
      throw new Error('boom');
    });

    expect(result).toBe('failed');
  });

  it('returns "completed" for a successful job', async () => {
    const result = await runExclusive('successful-job', async () => {});

    expect(result).toBe('completed');
  });

  it('allows the same job to run again after it finishes', async () => {
    await expect(runExclusive('repeat-job', async () => {})).resolves.toBe('completed');
    await expect(runExclusive('repeat-job', async () => {})).resolves.toBe('completed');
  });
});

describe('JOBS registry', () => {
  it('has unique job names', () => {
    const names = JOBS.map((job) => job.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('defines a valid cron or intervalMs on every entry', () => {
    for (const job of JOBS) {
      const hasCron = typeof job.cron === 'string' && job.cron.length > 0;
      const hasInterval = typeof job.intervalMs === 'number' && job.intervalMs > 0;
      expect(hasCron || hasInterval).toBe(true);
    }
  });
});
