import type { components } from './schema'

// Re-export the generated shapes under friendly names. Never hand-edit
// schema.d.ts — regenerate it with `npm run gen:types`.
export type ServerItem = components['schemas']['Item']
export type ItemChange = components['schemas']['ItemChange']
export type SyncRequest = components['schemas']['SyncRequest']
export type SyncResponse = components['schemas']['SyncResponse']
export type AuthResponse = components['schemas']['AuthResponse']
