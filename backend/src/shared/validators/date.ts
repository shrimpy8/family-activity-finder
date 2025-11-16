/**
 * Date validation utilities
 */

import { VALIDATION_PATTERNS, DATE_CONSTRAINTS } from '../constants/validation';
import { parseDateSafe, isDateInRange } from '../utils/date';

/**
 * Validate date format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @returns Error message if invalid, null if valid
 */
export const validateDateFormat = (date: string | undefined): string | null => {
  if (!date || typeof date !== 'string') {
    return 'Date is required and must be a string';
  }

  if (!VALIDATION_PATTERNS.DATE_FORMAT.test(date)) {
    return 'Date must be in YYYY-MM-DD format';
  }

  return null;
};

/**
 * Validate date is a valid calendar date and within acceptable range
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Error message if invalid, null if valid
 */
export const validateDate = (dateStr: string): string | null => {
  // First check format
  const formatError = validateDateFormat(dateStr);
  if (formatError) {
    return formatError;
  }

  // Parse the date
  const dateObj = parseDateSafe(dateStr);
  if (!dateObj) {
    return 'Date is not a valid calendar date';
  }

  // Check if date is within acceptable range
  if (!isDateInRange(dateObj, DATE_CONSTRAINTS.YEARS_BACK, DATE_CONSTRAINTS.YEARS_FORWARD)) {
    return `Date must be within ${DATE_CONSTRAINTS.YEARS_BACK} year in the past and ${DATE_CONSTRAINTS.YEARS_FORWARD} year in the future`;
  }

  return null;
};
