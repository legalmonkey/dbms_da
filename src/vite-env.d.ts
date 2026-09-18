/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'mock' runs against src/mock; 'live' issues real fetch calls. */
  readonly VITE_API_MODE: 'mock' | 'live'
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
