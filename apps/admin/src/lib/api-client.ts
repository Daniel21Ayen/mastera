import { ApiErrorResponseDto } from '@mastera/contracts';

/**
 * Section 11.4 & FR-G66: Real data only.
 * A missing API base URL stops the admin portal with a clear error.
 */
export function resolveApiBaseUrl(): string {
  const rawUrl = process.env['NEXT_PUBLIC_API_URL']?.trim();
  if (!rawUrl) {
    throw new Error(
      'FATAL [Section 11.4 / FR-G66]: NEXT_PUBLIC_API_URL is missing. The Admin Portal refuses to start without a real API endpoint.'
    );
  }
  return rawUrl.replace(/\/+$/, '');
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  csrfToken?: string;
  headers?: Record<string, string>;
}

export async function adminApiFetch<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const baseUrl = resolveApiBaseUrl();
  const method = options.method ?? 'GET';
  const isMutation = method !== 'GET';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(isMutation && options.csrfToken
      ? { 'X-CSRF-Token': options.csrfToken }
      : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    credentials: 'include', // Section 14: HttpOnly, Secure, SameSite cookie session
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) {
    let errorPayload: ApiErrorResponseDto | null = null;
    try {
      errorPayload = (await response.json()) as ApiErrorResponseDto;
    } catch {
      // Fallback if non-JSON error body
    }
    const errCode = errorPayload?.errorCode ?? `HTTP_${response.status}`;
    const errMessage = errorPayload?.message ?? response.statusText;
    throw new Error(`${errCode}: ${errMessage}`);
  }

  return (await response.json()) as TResponse;
}