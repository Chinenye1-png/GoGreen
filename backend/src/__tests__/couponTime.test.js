const {
  isWithinWindow,
  getWindowStatus,
  isCouponActive,
} = require('../utils/couponTime');

describe('couponTime utility', () => {
  const start = new Date('2024-01-01T00:00:00.000Z');
  const end = new Date('2024-01-31T23:59:59.000Z');

  describe('isWithinWindow', () => {
    it('returns false before the window starts', () => {
      const before = new Date('2023-12-31T23:59:59.000Z');
      expect(isWithinWindow(before, start, end)).toBe(false);
    });

    it('returns true exactly at the start boundary', () => {
      expect(isWithinWindow(start, start, end)).toBe(true);
    });

    it('returns true within the window', () => {
      const within = new Date('2024-01-15T12:00:00.000Z');
      expect(isWithinWindow(within, start, end)).toBe(true);
    });

    it('returns true exactly at the end boundary', () => {
      expect(isWithinWindow(end, start, end)).toBe(true);
    });

    it('returns false after the window ends', () => {
      const after = new Date('2024-02-01T00:00:00.000Z');
      expect(isWithinWindow(after, start, end)).toBe(false);
    });

    it('handles invalid input by returning false', () => {
      expect(isWithinWindow(null, start, end)).toBe(false);
      expect(isWithinWindow(new Date('invalid'), start, end)).toBe(false);
      expect(isWithinWindow(new Date(), null, end)).toBe(false);
      expect(isWithinWindow(new Date(), start, null)).toBe(false);
    });
  });

  describe('getWindowStatus', () => {
    it('reports not-yet-active before the start', () => {
      const before = new Date('2023-12-31T23:59:59.000Z');
      expect(getWindowStatus(before, start, end)).toBe('not_started');
    });

    it('reports active at the start boundary', () => {
      expect(getWindowStatus(start, start, end)).toBe('active');
    });

    it('reports active within the window', () => {
      const within = new Date('2024-01-15T12:00:00.000Z');
      expect(getWindowStatus(within, start, end)).toBe('active');
    });

    it('reports active at the end boundary', () => {
      expect(getWindowStatus(end, start, end)).toBe('active');
    });

    it('reports expired after the end', () => {
      const after = new Date('2024-02-01T00:00:00.000Z');
      expect(getWindowStatus(after, start, end)).toBe('expired');
    });

    it('handles invalid input', () => {
      expect(getWindowStatus(null, start, end)).toBe('invalid');
      expect(getWindowStatus(new Date('invalid'), start, end)).toBe('invalid');
    });
  });

  describe('isCouponActive', () => {
    it('returns false before the window starts', () => {
      const before = new Date('2023-12-31T23:59:59.000Z');
      expect(isCouponActive({ startDate: start, endDate: end }, before)).toBe(false);
    });

    it('returns true at the start boundary', () => {
      expect(isCouponActive({ startDate: start, endDate: end }, start)).toBe(true);
    });

    it('returns true within the window', () => {
      const within = new Date('2024-01-15T12:00:00.000Z');
      expect(isCouponActive({ startDate: start, endDate: end }, within)).toBe(true);
    });

    it('returns true at the end boundary', () => {
      expect(isCouponActive({ startDate: start, endDate: end }, end)).toBe(true);
    });

    it('returns false after the window ends', () => {
      const after = new Date('2024-02-01T00:00:00.000Z');
      expect(isCouponActive({ startDate: start, endDate: end }, after)).toBe(false);
    });

    it('handles invalid input', () => {
      expect(isCouponActive(null, new Date())).toBe(false);
      expect(isCouponActive({ startDate: start, endDate: end }, null)).toBe(false);
    });
  });
});
