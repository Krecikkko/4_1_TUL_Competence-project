export class ApiError extends Error {
  status: number
  data?: unknown
  isNotFound: boolean
  isBadRequest: boolean
  isServerError: boolean
  isNetworkError: boolean

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.isNotFound = status === 404
    this.isBadRequest = status === 400
    this.isServerError = status >= 500
    this.isNetworkError = status === 0
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

/**
 * Normalizes an API path, ensuring it begins with /api/ and ends with a trailing slash.
 */
export function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  let cleanEndpoint = endpoint.trim()

  // Ensure prefix
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`
  }
  if (!cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = `/api${cleanEndpoint}`
  }

  // Ensure trailing slash before query parameters
  if (!cleanEndpoint.endsWith('/')) {
    cleanEndpoint = `${cleanEndpoint}/`
  }

  const fullPath = `${BASE_URL}${cleanEndpoint}`

  if (!params) {
    return fullPath
  }

  const searchParams = new URLSearchParams()
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val))
    }
  }

  const queryString = searchParams.toString()
  return queryString ? `${fullPath}?${queryString}` : fullPath
}

export async function apiFetch<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  init?: RequestInit
): Promise<T> {
  const url = buildUrl(endpoint, params)

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
      ...init,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiError(`Network error while requesting ${url}: ${errorMsg}`, 0)
  }

  if (!response.ok) {
    let errorData: unknown
    let errorMessage = `HTTP ${response.status} (${response.statusText})`
    try {
      errorData = await response.json()
      if (typeof errorData === 'object' && errorData !== null) {
        if ('error' in errorData && typeof (errorData as { error: string }).error === 'string') {
          errorMessage = (errorData as { error: string }).error
        } else if ('detail' in errorData && typeof (errorData as { detail: string }).detail === 'string') {
          errorMessage = (errorData as { detail: string }).detail
        }
      }
    } catch {
      // Non-JSON error payload
    }

    throw new ApiError(errorMessage, response.status, errorData)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('Failed to parse JSON response from server', response.status)
  }
}
