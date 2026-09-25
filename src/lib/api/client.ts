import type { ApiResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const TOKEN_KEY = 'iceglide_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  // Mirror into a cookie too, so the Next.js middleware (server-side) can
  // do a cheap "is there a session at all" redirect check. The real
  // authorization decision always happens on the Worker.
  document.cookie = `iceglide_session=1; path=/; max-age=${60 * 60 * 12}; samesite=lax`;
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = 'iceglide_session=; path=/; max-age=0';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      'NEXT_PUBLIC_API_URL tanımlı değil. Lütfen .env.local dosyanızı kontrol edin.',
      0,
    );
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.', 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // no body / non-JSON
  }

  if (!response.ok || !payload || payload.success === false) {
    const message =
      (payload && payload.success === false && payload.message) ||
      defaultMessageForStatus(response.status);
    if (response.status === 401) {
      clearToken();
    }
    throw new ApiError(message, response.status, payload && 'details' in payload ? payload.details : undefined);
  }

  return payload.data;
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 401:
      return 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.';
    case 403:
      return 'Bu işlem için yetkiniz yok.';
    case 404:
      return 'Kayıt bulunamadı.';
    case 422:
      return 'Gönderilen bilgiler eksik veya hatalı.';
    case 500:
      return 'Beklenmeyen sunucu hatası.';
    default:
      return 'Sunucuya bağlanılamadı.';
  }
}
