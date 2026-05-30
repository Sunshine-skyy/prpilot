import type { AnalyzeDiffRequest, AnalyzePullRequestRequest, ReviewAnalysisResponse } from './types';

async function requestJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export async function fetchDemoReview(): Promise<ReviewAnalysisResponse> {
  return requestJson<ReviewAnalysisResponse>('/api/reviews/demo');
}

export async function analyzePullRequest(request: AnalyzePullRequestRequest): Promise<ReviewAnalysisResponse> {
  return requestJson<ReviewAnalysisResponse>('/api/reviews/analyze-pr', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function analyzeRawDiff(request: AnalyzeDiffRequest): Promise<ReviewAnalysisResponse> {
  return requestJson<ReviewAnalysisResponse>('/api/reviews/analyze-diff', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
