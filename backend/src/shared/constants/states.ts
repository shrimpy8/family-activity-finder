/**
 * US State codes and validation utilities
 */

/**
 * Valid US state codes (50 states + District of Columbia)
 * Used for validating state input in location searches
 */
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
] as const;

/**
 * Type representing valid US state codes
 */
export type USState = typeof US_STATES[number];

/**
 * Check if a string is a valid US state code
 * @param state - State code to validate (case-insensitive)
 * @returns true if valid US state code, false otherwise
 */
export const isValidState = (state: string): boolean => {
  return US_STATES.includes(state.toUpperCase() as USState);
};
