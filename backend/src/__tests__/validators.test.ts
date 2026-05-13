import { describe, it, expect } from 'vitest';
import { validateCityName, validateState, validateZipCode } from '../shared/validators/location';
import { validateAges } from '../shared/validators/age';
import { validateDate } from '../shared/validators/date';
import { isValidTimeSlot } from '../shared/constants/timeSlots';

describe('validateCityName', () => {
  it('accepts a valid city name', () => {
    expect(validateCityName('Dublin')).toBeNull();
    expect(validateCityName('San Francisco')).toBeNull();
    expect(validateCityName("O'Brien")).toBeNull();
    expect(validateCityName('St. Louis')).toBeNull();
  });

  it('rejects empty or missing city', () => {
    expect(validateCityName('')).not.toBeNull();
    expect(validateCityName(undefined)).not.toBeNull();
    expect(validateCityName('   ')).not.toBeNull();
  });

  it('rejects a city name that exceeds max length', () => {
    expect(validateCityName('A'.repeat(101))).not.toBeNull();
  });

  it('rejects city names with invalid characters', () => {
    expect(validateCityName('Dublin; DROP TABLE--')).not.toBeNull();
    expect(validateCityName('<script>alert(1)</script>')).not.toBeNull();
  });
});

describe('validateState', () => {
  it('accepts valid US state codes', () => {
    expect(validateState('CA')).toBeNull();
    expect(validateState('NY')).toBeNull();
    expect(validateState('DC')).toBeNull();
  });

  it('rejects invalid state codes', () => {
    expect(validateState('ZZ')).not.toBeNull();
    expect(validateState('XX')).not.toBeNull();
  });

  it('rejects missing state', () => {
    expect(validateState(undefined)).not.toBeNull();
    expect(validateState('')).not.toBeNull();
  });
});

describe('validateZipCode', () => {
  it('accepts a valid 5-digit zip code', () => {
    expect(validateZipCode('94568')).toBeNull();
    expect(validateZipCode('00501')).toBeNull();
  });

  it('returns null for empty/undefined (optional field)', () => {
    expect(validateZipCode(undefined)).toBeNull();
    expect(validateZipCode('')).toBeNull();
  });

  it('rejects non-5-digit zip codes', () => {
    expect(validateZipCode('1234')).not.toBeNull();
    expect(validateZipCode('123456')).not.toBeNull();
    expect(validateZipCode('abcde')).not.toBeNull();
  });
});

describe('validateAges', () => {
  it('accepts a valid ages array', () => {
    expect(validateAges([5, 8, 12])).toBeNull();
    expect(validateAges([0])).toBeNull();
    expect(validateAges([18])).toBeNull();
  });

  it('rejects an empty array', () => {
    expect(validateAges([])).not.toBeNull();
  });

  it('rejects ages outside 0-18 range', () => {
    expect(validateAges([-1])).not.toBeNull();
    expect(validateAges([19])).not.toBeNull();
  });

  it('rejects non-integer ages', () => {
    expect(validateAges([5.5])).not.toBeNull();
  });

  it('rejects a non-array input', () => {
    expect(validateAges('5, 8')).not.toBeNull();
  });

  it('rejects arrays exceeding max count (10)', () => {
    expect(validateAges([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).not.toBeNull();
  });
});

describe('validateDate', () => {
  it('accepts a valid date string', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0]!;
    expect(validateDate(dateStr)).toBeNull();
  });

  it('rejects an invalid date format', () => {
    expect(validateDate('11/16/2025')).not.toBeNull();
    expect(validateDate('2025-13-01')).not.toBeNull();
  });

  it('rejects a missing date', () => {
    expect(validateDate(undefined as unknown as string)).not.toBeNull();
  });
});

describe('isValidTimeSlot', () => {
  it('accepts all valid time slots', () => {
    expect(isValidTimeSlot('all_day')).toBe(true);
    expect(isValidTimeSlot('morning')).toBe(true);
    expect(isValidTimeSlot('afternoon')).toBe(true);
    expect(isValidTimeSlot('evening')).toBe(true);
    expect(isValidTimeSlot('night')).toBe(true);
  });

  it('rejects invalid time slots', () => {
    expect(isValidTimeSlot('noon')).toBe(false);
    expect(isValidTimeSlot('')).toBe(false);
    expect(isValidTimeSlot('ALL_DAY')).toBe(false);
  });
});
