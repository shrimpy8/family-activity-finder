import type { ActivityFormData, Recommendation } from '../types/index.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface RecommendResponse {
  recommendations: Recommendation[];
}

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
