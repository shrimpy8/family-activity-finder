/**
 * Location validation utilities
 */

import { VALIDATION_PATTERNS, INPUT_CONSTRAINTS } from '../constants/validation';
import { US_STATES } from '../constants/states';

/**
 * Validate city name
 * @param city - City name to validate
 * @returns Error message if invalid, null if valid
 */
export const validateCityName = (city: string | undefined): string | null => {
  if (!city || typeof city !== 'string') {
    return 'City is required and must be a string';
  }

  const trimmedCity = city.trim();
  if (trimmedCity.length === 0) {
    return 'City cannot be empty';
  }

  if (city.length > INPUT_CONSTRAINTS.CITY_MAX_LENGTH) {
    return `City must be ${INPUT_CONSTRAINTS.CITY_MAX_LENGTH} characters or less`;
  }

  if (!VALIDATION_PATTERNS.CITY_NAME.test(city)) {
    return 'City contains invalid characters (only letters, spaces, hyphens, apostrophes, and periods allowed)';
  }

  return null;
};

/**
 * Validate US state code
 * @param state - State code to validate (e.g., "CA", "NY")
 * @returns Error message if invalid, null if valid
 */
export const validateState = (state: string | undefined): string | null => {
  if (!state || typeof state !== 'string') {
    return 'State is required and must be a string';
  }

  if (!US_STATES.includes(state.toUpperCase() as any)) {
    return 'State must be a valid US state code (e.g., CA, NY, TX)';
  }

  return null;
};

/**
 * Validate ZIP code (optional field)
 * @param zipCode - ZIP code to validate
 * @returns Error message if invalid, null if valid or empty
 */
export const validateZipCode = (zipCode: string | undefined): string | null => {
  // ZIP code is optional
  if (!zipCode) {
    return null;
  }

  if (typeof zipCode !== 'string') {
    return 'Zip code must be a string';
  }

  if (!VALIDATION_PATTERNS.ZIP_CODE.test(zipCode)) {
    return 'Zip code must be exactly 5 digits';
  }

  return null;
};
