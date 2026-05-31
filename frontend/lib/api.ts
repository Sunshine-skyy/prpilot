import type { AnalyzeDiffRequest, AnalyzePullRequestRequest, ReviewAnalysisResponse, ReviewAnalysisStreamEvent } from './types';

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

type StreamEventHandler = (event: ReviewAnalysisStreamEvent) => void | Promise<void>;

async function requestAnalysisStream(path: string, request: AnalyzeDiffRequest | AnalyzePullRequestRequest, onEvent: StreamEventHandler): Promise<ReviewAnalysisResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Streaming response is not supported by this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: ReviewAnalysisResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const event = parseStreamEvent(chunk);
      if (!event) continue;
      await onEvent(event);
      if (event.status === 'completed' && event.result) {
        result = event.result;
      }
      if (event.status === 'error') {
        throw new Error(event.message || 'Analysis failed.');
      }
    }

    if (done) break;
  }

  if (!result) {
    const event = parseStreamEvent(buffer);
    if (event) {
      await onEvent(event);
      if (event.status === 'completed' && event.result) result = event.result;
      if (event.status === 'error') throw new Error(event.message || 'Analysis failed.');
    }
  }

  if (!result) {
    throw new Error('The analysis stream ended before returning a result.');
  }

  return result;
}

function parseStreamEvent(chunk: string): ReviewAnalysisStreamEvent | null {
  const data = chunk
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');

  if (!data) return null;
  return JSON.parse(data) as ReviewAnalysisStreamEvent;
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

export async function streamPullRequestAnalysis(request: AnalyzePullRequestRequest, onEvent: StreamEventHandler): Promise<ReviewAnalysisResponse> {
  return requestAnalysisStream('/api/reviews/analyze-pr-stream', request, onEvent);
}

export async function streamRawDiffAnalysis(request: AnalyzeDiffRequest, onEvent: StreamEventHandler): Promise<ReviewAnalysisResponse> {
  return requestAnalysisStream('/api/reviews/analyze-diff-stream', request, onEvent);
}
