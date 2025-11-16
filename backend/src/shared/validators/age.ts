/**
 * Age validation and parsing utilities
 */

import { AGE_CONSTRAINTS } from '../constants/validation';

/**
 * Parse ages from comma-separated string
 * Used primarily in frontend to convert user input to array of numbers
 * @param input - Comma-separated string of ages (e.g., "5, 8, 12")
 * @returns Array of valid age numbers
 */
export const parseAges = (input: string): number[] => {
  return input
    .split(',')
    .map(age => parseInt(age.trim()))
    .filter(age => !isNaN(age));
};

/**
 * Validate an array of ages
 * @param ages - Array of ages to validate
 * @returns Error message if invalid, null if valid
 */
export const validateAges = (ages: unknown): string | null => {
  // Check if ages is an array
  if (!Array.isArray(ages)) {
    return 'Ages must be an array';
  }

  // Check if array is empty
  if (ages.length === 0) {
    return 'At least one age is required';
  }

  // Check maximum number of ages
  if (ages.length > AGE_CONSTRAINTS.MAX_COUNT) {
    return `Cannot specify more than ${AGE_CONSTRAINTS.MAX_COUNT} ages`;
  }

  // Validate each age
  for (const age of ages) {
    // Check if age is a number
    if (typeof age !== 'number') {
      return 'All ages must be numbers';
    }

    // Check if age is an integer
    if (!Number.isInteger(age)) {
      return 'All ages must be integers';
    }

    // Check age range
    if (age < AGE_CONSTRAINTS.MIN || age > AGE_CONSTRAINTS.MAX) {
      return `All ages must be between ${AGE_CONSTRAINTS.MIN} and ${AGE_CONSTRAINTS.MAX}`;
    }
  }

  return null;
};
