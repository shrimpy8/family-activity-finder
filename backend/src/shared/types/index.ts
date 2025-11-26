/**
 * Shared type definitions used across frontend and backend
 * This file serves as the single source of truth for all data types
 */

/**
 * Time slot options for activity search
 */
export type TimeSlot = 'all_day' | 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * LLM Provider options
 */
export type LLMProvider = 'anthropic' | 'perplexity' | 'gemini' | 'all';

/**
 * Output format options
 */
export type OutputFormat = 'markdown' | 'json';

/**
 * Form data submitted by the user to search for activities
 */
export interface ActivityFormData {
  /** City name (e.g., "Dublin", "San Francisco") */
  city: string;
  /** Two-letter US state code (e.g., "CA", "NY", "TX") */
  state: string;
  /** Optional 5-digit ZIP code for more precise location */
  zipCode?: string;
  /** Array of children's ages (0-18) */
  ages: number[];
  /** Activity date in YYYY-MM-DD format */
  date: string;
  /** Time slot for the activity */
  timeSlot: TimeSlot;
  /** Maximum distance willing to travel (in miles, 1-50) */
  distance: number;
  /** Additional preferences or requirements (max 500 characters) */
  preferences: string;
  /** LLM provider to use (defaults to 'anthropic', use 'all' for parallel multi-provider requests) */
  provider?: LLMProvider;
}

/**
 * A single activity recommendation returned by the API
 */
export interface Recommendation {
  /** Emoji representing the activity type */
  emoji: string;
  /** Activity title with timing information */
  title: string;
  /** Detailed description of the activity */
  description: string;
  /** Specific location or neighborhood name */
  location: string;
  /** Distance from the search location */
  distance: string;
}

/**
 * API response containing activity recommendations
 */
export interface RecommendResponse {
  /** Array of activity recommendations (typically 5) */
  recommendations: Recommendation[];
}

/**
 * Multi-provider response for parallel requests
 */
export interface MultiProviderResponse {
  /** Provider identifier */
  provider: string;
  /** Model display name */
  modelName: string;
  /** Recommendations if successful */
  recommendations?: Recommendation[];
  /** Error message if failed */
  error?: string;
  /** Full error response object for debugging */
  fullErrorResponse?: any;
}
