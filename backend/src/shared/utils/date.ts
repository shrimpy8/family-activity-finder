/**
 * Date utility functions for the backend
 */

/**
 * Format a date string (YYYY-MM-DD) to a human-readable long format
 * Example: "2025-11-16" → "Saturday, November 16, 2025"
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Human-readable date string
 */
export const formatDateLong = (dateStr: string): string => {
  // Add T12:00:00 to avoid timezone issues
  const dateObj = new Date(dateStr + 'T12:00:00');

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Safely parse a date string to a Date object
 * Returns null if the date string is invalid
 * @param dateStr - Date string to parse
 * @returns Date object or null if invalid
 */
export const parseDateSafe = (dateStr: string): Date | null => {
  const dateObj = new Date(dateStr + 'T00:00:00');
  return isNaN(dateObj.getTime()) ? null : dateObj;
};

/**
 * Check if a date falls within a specified range from today
 * Normalizes all dates to midnight for fair comparison
 * @param date - Date to check
 * @param yearsBack - How many years in the past to allow (default: 1)
 * @param yearsForward - How many years in the future to allow (default: 1)
 * @returns true if date is within range, false otherwise
 */
export const isDateInRange = (
  date: Date,
  yearsBack: number = 1,
  yearsForward: number = 1
): boolean => {
  // Normalize all dates to midnight for fair comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - yearsBack);

  const maxDate = new Date(today);
  maxDate.setFullYear(today.getFullYear() + yearsForward);

  return date >= minDate && date <= maxDate;
};
