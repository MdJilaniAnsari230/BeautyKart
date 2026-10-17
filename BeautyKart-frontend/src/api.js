// Central API client. Every request goes through apiFetch so the base URL,
// credentials, CSRF header, timeout and error handling live in one place.

// Direct mode (default): VITE_API_URL=https://<backend>.
// Proxy mode: leave VITE_API_URL empty and proxy /api and /uploads (see vercel.json / README).
const RAW_BASE = import.meta.env.VITE_API_URL ?? '';
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

const TIMEOUT_MS = 60000; // Render free instances can take ~50s to wake up

export class ApiError extends Error {
  constructor(message, status, kind) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // HTTP status, or 0 when no response was received
    this.kind = kind; // 'network' | 'timeout' | 'http'
  }
}

export function assetUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

export async function apiFetch(path, { method = 'GET', body, formData, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener('abort', () => controller.abort(signal.reason));
  }

  const headers = { Accept: 'application/json' };
  if (method !== 'GET') headers['X-Requested-With'] = 'XMLHttpRequest';

  let payload;
  if (formData) {
    payload = formData; // browser sets the multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: payload,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted && controller.signal.reason === 'timeout') {
      throw new ApiError(
        'The server is taking too long to respond. It may be waking up - please try again in a moment.',
        0,
        'timeout'
      );
    }
    if (err?.name === 'AbortError') throw err; // caller cancelled
    throw new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      0,
      'network'
    );
  } finally {
    clearTimeout(timer);
  }

  // The body may be empty or non-JSON (e.g. an HTML 502 page from a proxy).
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const fallback =
      response.status >= 500
        ? 'The server had a problem. Please try again shortly.'
        : 'Request failed.';
    throw new ApiError(data?.message || fallback, response.status, 'http');
  }
  return data;
}
