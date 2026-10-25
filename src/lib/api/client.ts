import { ApiError } from './types.ts';
import { SJCET_BASE_URL, SJCET_HOST } from './endpoints.ts';

const DEFAULT_TIMEOUT_MS = 25_000;
const ETAG_HEADER = 'If-None-Match';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type RequestOptions = {
  baseUrl: string;
  path: string;
  method?: RequestMethod;
  token?: string | null;
  body?: unknown;
  form?: Record<string, string>;
  headers?: Record<string, string>;
  anonymous?: boolean;
  /** Ask the API to validate a cached representation with If-None-Match. */
  etag?: boolean;
  /** Accept a top-level JSON array for endpoints that return a bare list. */
  allowArray?: boolean;
  /** Number of extra attempts for transient failures. Reads only by default. */
  retries?: number;
  signal?: AbortSignal;
};

type CacheEntry = { etag: string; data: unknown };

const etagCache = new Map<string, CacheEntry>();

/** Normalize a URL only when it points to the single supported SJCET portal. */
export function normalizeBaseUrl(raw: string): string {
  let value = raw.trim();
  if (!value) {
    throw new ApiError('auth', 'NexusLabs connects to the SJCET Palai portal.');
  }
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      throw new ApiError('auth', 'The SJCET portal must use HTTPS.');
    }
    if (url.username || url.password) {
      throw new ApiError('auth', 'Portal addresses cannot contain credentials.');
    }
    if (url.hostname.toLowerCase() !== SJCET_HOST) {
      throw new ApiError('auth', 'Only the SJCET Palai Etlab portal is supported.');
    }
    const path = url.pathname.replace(/\/+$/, '').toLowerCase();
    if (path !== '' && path !== '/androidapp') {
      throw new ApiError('auth', 'The SJCET portal address has an unexpected path.');
    }
    return SJCET_BASE_URL;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('auth', 'The SJCET portal address does not look valid.', undefined, error);
  }
}

function cacheKey(url: string, body: string | undefined, token?: string | null): string {
  // Scope cached responses to the authenticated account. Account transitions
  // clear this cache too, but a keyed entry cannot leak across accounts.
  return `${url}|${body ?? ''}|${token ?? ''}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload)) {
    const message = payload.error ?? payload.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  return fallback;
}

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const {
    baseUrl,
    path,
    method = 'POST',
    token,
    body,
    form,
    headers: extraHeaders,
    anonymous = false,
    etag = false,
    signal,
  } = options;

  if (!anonymous && !token) {
    throw new ApiError('auth', 'Your session has expired. Sign in again.');
  }

  const url = `${normalizeBaseUrl(baseUrl)}${path.replace(/^\/+/, '')}`;
  const serializedBody = form
    ? new URLSearchParams(form).toString()
    : body === undefined
      ? method === 'GET'
        ? undefined
        : '{}'
      : JSON.stringify(body);

  const key = cacheKey(url, serializedBody, anonymous ? '' : token);
  const cached = etag ? etagCache.get(key) : undefined;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (!anonymous && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (serializedBody !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (cached) {
    headers[ETAG_HEADER] = cached.etag;
  }

  const maxAttempts = options.retries ?? (method === 'GET' ? 2 : 0);
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    let cancelledByCaller = false;
    const abort = () => {
      cancelledByCaller = true;
      controller.abort();
    };
    signal?.addEventListener('abort', abort);
    if (signal?.aborted) {
      abort();
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: serializedBody,
        signal: controller.signal,
      });

      if (response.url) {
        const finalUrl = new URL(response.url);
        if (finalUrl.protocol !== 'https:' || finalUrl.hostname.toLowerCase() !== SJCET_HOST) {
          throw new ApiError('http', 'The SJCET portal redirected to an unsupported address.');
        }
      }

      if (response.status === 304) {
        if (cached) {
          return cached.data as T;
        }
        throw new ApiError('parse', 'The cached response has expired. Try again.');
      }

      const responseEtag = response.headers.get('etag');
      const text = await response.text();
      let payload: unknown = null;
      if (text) {
        try {
          payload = JSON.parse(text) as unknown;
        } catch {
          if (response.ok) {
            throw new ApiError('parse', 'The response could not be read.');
          }
        }
      }

      if (!response.ok) {
        const kind = response.status === 401 ? 'auth' : response.status >= 500 ? 'server' : 'http';
        throw new ApiError(
          kind,
          extractMessage(payload, `Request failed (${response.status}).`),
          response.status,
        );
      }

      const isArrayPayload = Array.isArray(payload);
      if (!isRecord(payload) && !(options.allowArray && isArrayPayload)) {
        throw new ApiError('parse', 'SJCET Etlab sent an unexpected response.');
      }

      if (isRecord(payload)) {
        if (payload.login === false) {
          throw new ApiError('auth', extractMessage(payload, 'Your session has expired.'));
        }

        if (typeof payload.error === 'string' && payload.error.trim()) {
          throw new ApiError('server', payload.error.trim(), response.status);
        }
      }

      if (etag && responseEtag) {
        etagCache.set(key, { etag: responseEtag, data: payload });
      }

      return payload as T;
    } catch (error) {
      lastError = error;
      if (cancelledByCaller) {
        throw error;
      }
      if (error instanceof ApiError) {
        const retryable = error.kind === 'network' || error.kind === 'server';
        if (!retryable || attempt === maxAttempts) {
          throw error;
        }
      } else if (error instanceof Error && error.name === 'AbortError') {
        if (attempt === maxAttempts) {
          throw new ApiError(
            'timeout',
            'SJCET Etlab took too long to respond.',
            undefined,
            error,
          );
        }
      } else if (attempt === maxAttempts) {
        throw new ApiError(
          'network',
          'Could not reach SJCET Etlab. Check your connection.',
          undefined,
          error,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }

  throw new ApiError('unknown', 'The request failed.', undefined, lastError);
}

/** Clear cached ETags, e.g. after signing into a different account. */
export function clearApiCache(): void {
  etagCache.clear();
}
