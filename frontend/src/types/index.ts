/**
 * Re-export shared types from backend
 * This ensures type consistency across frontend and backend
 *
 * Note: Frontend imports from backend's shared types to maintain
 * a single source of truth for all data structures
 */
export type {
  TimeSlot,
  ActivityFormData,
  Recommendation,
  RecommendResponse,
  LLMProvider,
  OutputFormat,
  MultiProviderResponse
} from '../../../backend/src/shared/types';
