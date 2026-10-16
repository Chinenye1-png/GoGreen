import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateName,
  validatePhone,
  validateAddress,
  validatePrice,
  validateQuantity,
} from '../utils/validation';

describe('validateEmail', () => {
  it('returns success for a valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('returns an error for an invalid email', () => {
    expect(validateEmail('not-an-email')).toBe('Please enter a valid email address');
  });

  it('rejects an empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
  });

  it('rejects a whitespace-only string', () => {
    expect(validateEmail('   ')).toBe('Email is required');
  });

  it('rejects a malformed email with a missing domain', () => {
    expect(validateEmail('user@')).toBe('Please enter a valid email address');
  });
});

describe('validatePassword', () => {
  it('returns success for a valid password', () => {
    expect(validatePassword('Secret123')).toBe(true);
  });

  it('returns an error for a too-short password', () => {
    expect(validatePassword('abc')).toBe('Password must be at least 8 characters');
  });

  it('rejects an empty string', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('rejects a whitespace-only string', () => {
    expect(validatePassword('        ')).toBe('Password is required');
  });

  it('rejects a password just over the maximum length', () => {
    expect(validatePassword('a'.repeat(129))).toBe('Password must be at most 128 characters');
  });
});

describe('validateRequired', () => {
  it('returns success for a non-empty value', () => {
    expect(validateRequired('value', 'Name')).toBe(true);
  });

  it('returns an error for an empty value', () => {
    expect(validateRequired('', 'Name')).toBe('Name is required');
  });

  it('rejects a whitespace-only value', () => {
    expect(validateRequired('   ', 'Name')).toBe('Name is required');
  });
});

describe('validateName', () => {
  it('returns success for a valid name', () => {
    expect(validateName('Jane Doe')).toBe(true);
  });

  it('returns an error for an empty name', () => {
    expect(validateName('')).toBe('Name is required');
  });

  it('rejects a whitespace-only name', () => {
    expect(validateName('   ')).toBe('Name is required');
  });

  it('rejects a name just over the maximum length', () => {
    expect(validateName('a'.repeat(101))).toBe('Name must be at most 100 characters');
  });
});

describe('validatePhone', () => {
  it('returns success for a valid phone number', () => {
    expect(validatePhone('+1 555 123 4567')).toBe(true);
  });

  it('returns an error for an invalid phone number', () => {
    expect(validatePhone('abc')).toBe('Please enter a valid phone number');
  });

  it('rejects an empty string', () => {
    expect(validatePhone('')).toBe('Phone number is required');
  });

  it('rejects a whitespace-only string', () => {
    expect(validatePhone('   ')).toBe('Phone number is required');
  });
});

describe('validateAddress', () => {
  it('returns success for a valid address', () => {
    expect(validateAddress('123 Main St')).toBe(true);
  });

  it('returns an error for an empty address', () => {
    expect(validateAddress('')).toBe('Address is required');
  });

  it('rejects a whitespace-only address', () => {
    expect(validateAddress('   ')).toBe('Address is required');
  });

  it('rejects an address just over the maximum length', () => {
    expect(validateAddress('a'.repeat(201))).toBe('Address must be at most 200 characters');
  });
});

describe('validatePrice', () => {
  it('returns success for a valid price', () => {
    expect(validatePrice('19.99')).toBe(true);
  });

  it('returns an error for a non-numeric price', () => {
    expect(validatePrice('free')).toBe('Price must be a valid number');
  });

  it('rejects an empty string', () => {
    expect(validatePrice('')).toBe('Price is required');
  });

  it('rejects a whitespace-only string', () => {
    expect(validatePrice('   ')).toBe('Price is required');
  });

  it('rejects a negative price', () => {
    expect(validatePrice('-1')).toBe('Price must be greater than or equal to 0');
  });
});

describe('validateQuantity', () => {
  it('returns success for a valid quantity', () => {
    expect(validateQuantity('5')).toBe(true);
  });

  it('returns an error for a non-numeric quantity', () => {
    expect(validateQuantity('many')).toBe('Quantity must be a valid number');
  });

  it('rejects an empty string', () => {
    expect(validateQuantity('')).toBe('Quantity is required');
  });

  it('rejects a whitespace-only string', () => {
    expect(validateQuantity('   ')).toBe('Quantity is required');
  });

  it('rejects a quantity just over the maximum', () => {
    expect(validateQuantity('1001')).toBe('Quantity must be at most 1000');
  });
});
