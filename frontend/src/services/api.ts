import type { ActivityFormData, Recommendation, MultiProviderResponse } from '../types/index.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Response interface for single provider recommendations
 */
export interface RecommendResponse {
  recommendations: Recommendation[];
}

/**
 * Fetch activity recommendations from a single AI provider
 * @param formData - Form data containing search criteria
 * @returns Promise resolving to an array of recommendations
 * @throws Error if the API request fails
 */
export async function getRecommendations(formData: ActivityFormData): Promise<Recommendation[]> {
  const response = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const data: RecommendResponse = await response.json();
  return data.recommendations;
}

/**
 * Fetch activity recommendations from all available AI providers in parallel
 * @param formData - Form data containing search criteria (without provider field)
 * @returns Promise resolving to an array of provider responses, each containing recommendations or error info
 * @throws Error if the API request fails
 */
export async function getAllProviderRecommendations(
  formData: Omit<ActivityFormData, 'provider'>
): Promise<MultiProviderResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/recommend/all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const data: MultiProviderResponse[] = await response.json();
  return data;
}
