import type { TanstackJsonLdSchema } from './tanstack-json-ld.types';
import type { TanstackMetadata } from './tanstack-metadata.types';

export interface TanstackHeadParams {
  path: string
  locale?: string
  title: string
  description: string
  robots?: string
  hreflang?: boolean
  metadata?: TanstackMetadata
  schemas?: readonly TanstackJsonLdSchema[]
}

export interface TanstackHeadBuilderParams {
  origin: string
  baseLocale: string
  locales: readonly string[]
  defaults: TanstackMetadata
  resolveLocale: (locale?: string) => string
  formatOpenGraphLocale?: (locale: string) => string
}
