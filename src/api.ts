// Central API configuration
// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, the Vite proxy handles /api → localhost:5000.
export const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Wrapper around fetch that automatically prefixes the API base URL.
 * Drop-in replacement for fetch("/api/...") calls.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`;
  return fetch(url, init);
}
