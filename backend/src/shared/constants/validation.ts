/**
 * Validation constraints used across the application
 * These constants ensure consistent validation on both frontend and backend
 */

/**
 * Distance constraints (in miles)
 */
export const DISTANCE_CONSTRAINTS = {
  /** Minimum distance willing to travel */
  MIN: 1,
  /** Maximum distance willing to travel */
  MAX: 50,
  /** Default distance value */
  DEFAULT: 10
} as const;

/**
 * Age constraints for children
 */
export const AGE_CONSTRAINTS = {
  /** Minimum age (infants) */
  MIN: 0,
  /** Maximum age (teenagers) */
  MAX: 18,
  /** Maximum number of children that can be specified */
  MAX_COUNT: 10
} as const;

/**
 * Input field length constraints
 */
export const INPUT_CONSTRAINTS = {
  /** Maximum length for city name */
  CITY_MAX_LENGTH: 100,
  /** Maximum length for preferences field */
  PREFERENCES_MAX_LENGTH: 500,
  /** Expected length for ZIP code */
  ZIP_CODE_LENGTH: 5,
  /** Expected length for state code */
  STATE_CODE_LENGTH: 2
} as const;

/**
 * Regular expressions for input validation
 */
export const VALIDATION_PATTERNS = {
  /** Valid city name characters (letters, spaces, hyphens, apostrophes, periods) */
  CITY_NAME: /^[a-zA-Z\s\-'.]+$/,
  /** Valid ZIP code format (exactly 5 digits) */
  ZIP_CODE: /^\d{5}$/,
  /** Valid date format (YYYY-MM-DD) */
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/
} as const;

/**
 * Date range constraints
 */
export const DATE_CONSTRAINTS = {
  /** How many years in the past dates are allowed */
  YEARS_BACK: 1,
  /** How many years in the future dates are allowed */
  YEARS_FORWARD: 1
} as const;
