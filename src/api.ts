// Central API configuration
// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, the Vite proxy handles /api → localhost:5000.
export const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Helper to perform fetch requests with exponential backoff retries.
 * Retries on network errors and server errors (5xx) to handle server spin-up.
 */
async function fetchWithRetry(url: string, init?: RequestInit, retries = 5, delay = 2000): Promise<Response> {
  try {
    const res = await fetch(url, init);
    // If it's a server error (500, 502, 503, 504), retry
    if (!res.ok && res.status >= 500) {
      if (retries > 0) {
        console.warn(`API server returned status ${res.status}. Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, init, retries - 1, delay * 1.5);
      }
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`API fetch network error: ${errMsg}. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, init, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

/**
 * Wrapper around fetch that automatically prefixes the API base URL and handles retries.
 * Drop-in replacement for fetch("/api/...") calls.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`;
  return fetchWithRetry(url, init);
}
