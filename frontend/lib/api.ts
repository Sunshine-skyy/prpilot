import type { ReviewAnalysisResponse } from './types';

export async function fetchDemoReview(): Promise<ReviewAnalysisResponse> {
  const response = await fetch('/api/reviews/demo', {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Demo API request failed with status ${response.status}`);
  }

  return response.json() as Promise<ReviewAnalysisResponse>;
}
