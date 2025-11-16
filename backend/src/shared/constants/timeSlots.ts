/**
 * Time slot definitions and labels
 */

import type { TimeSlot } from '../types';

/**
 * Human-readable labels for each time slot
 * Used in both UI display and API prompt generation
 */
export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  all_day: 'All Day',
  morning: 'Morning (8 AM - 12 PM)',
  afternoon: 'Afternoon (12 PM - 4 PM)',
  evening: 'Evening (4 PM - 8 PM)',
  night: 'Night (8 PM - 11 PM)'
} as const;

/**
 * Array of all valid time slot values
 * Used for validation and iteration
 */
export const TIME_SLOTS: readonly TimeSlot[] = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];

/**
 * Check if a string is a valid time slot
 * @param slot - Time slot value to validate
 * @returns true if valid time slot, false otherwise
 */
export const isValidTimeSlot = (slot: string): slot is TimeSlot => {
  return TIME_SLOTS.includes(slot as TimeSlot);
};
