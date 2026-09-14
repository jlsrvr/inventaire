// Backend base URL. Defaults to '' (relative), which works because the Vite
// dev server proxies /auth, /sync, and /health to localhost:8000 — so the
// browser only ever talks to one origin, whether that's localhost or a single
// ngrok tunnel to the frontend. Override with VITE_API_URL for a production
// build where the frontend and backend are served from different origins.
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
