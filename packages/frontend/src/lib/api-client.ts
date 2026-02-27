const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  leads: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/leads${qs}`);
  },
  vin: (vinId: string) => fetchAPI(`/vin/${vinId}`),
  vinPreferences: (vinId: string, body: any) =>
    fetchAPI(`/vin/${vinId}/preferences`, { method: 'POST', body: JSON.stringify(body) }),
  dealerSearch: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/dealers/search${qs}`);
  },
  fsrAvailability: (body: any) =>
    fetchAPI('/fsr/availability', { method: 'POST', body: JSON.stringify(body) }),
  bookingDraft: (body: any) =>
    fetchAPI('/booking/draft', { method: 'POST', body: JSON.stringify(body) }),
  bookingHold: (body: any) =>
    fetchAPI('/booking/hold', { method: 'POST', body: JSON.stringify(body) }),
};

export function createVoiceStream(scope: 'vin' | 'fleet', id: string | null, message: string) {
  const path = scope === 'vin' ? `/voice/vin/${id}` : '/voice/fleet';
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
}
