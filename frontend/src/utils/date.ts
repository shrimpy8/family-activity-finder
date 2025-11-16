/**
 * Date utility functions for the frontend
 */

/**
 * Convert a Date object to ISO date string format (YYYY-MM-DD)
 * Uses local timezone to avoid timezone conversion issues
 * @param date - Date object to convert
 * @returns ISO date string (e.g., "2025-11-16")
 */
export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get the date for the next weekend (Saturday)
 * If today is already Saturday or Sunday, returns today's date
 * @returns ISO date string for the next weekend
 */
export const getNextWeekend = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // If it's already the weekend, return today
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    return toISODateString(today);
  }

  // Calculate days until next Saturday
  const daysUntilSaturday = 6 - dayOfWeek;
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);

  return toISODateString(nextSaturday);
};

/**
 * Get tomorrow's date
 * @returns ISO date string for tomorrow
 */
export const getTomorrow = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toISODateString(tomorrow);
};

/**
 * Add a specified number of days to a date
 * @param date - Starting date
 * @param days - Number of days to add (can be negative to subtract)
 * @returns New date with days added
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
};
