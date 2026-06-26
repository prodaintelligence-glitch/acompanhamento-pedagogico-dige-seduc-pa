import { mockResponses } from '../data/mockResponses.js';

export async function fetchMockResponses() {
  const headers = Object.keys(mockResponses[0] ?? {});

  return {
    success: true,
    headers,
    rows: mockResponses,
    totalRows: mockResponses.length,
    updatedAt: new Date().toISOString(),
    source: 'mock'
  };
}
