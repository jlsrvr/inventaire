// Backend base URL. Override with VITE_API_URL at build/dev time.
export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
