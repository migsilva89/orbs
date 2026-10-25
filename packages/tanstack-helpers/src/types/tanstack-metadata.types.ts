import type { JSX } from 'react';
import type { LiteralUnion } from 'type-fest';

export type TanstackMetadataStringNumber = string | number

export type TanstackMetadataMeta = JSX.IntrinsicElements['meta']

export type TanstackMetadataViewportSize = 'device-width' | 'device-height'

export interface TanstackMetadataViewport {
  width?: TanstackMetadataViewportSize
  height?: TanstackMetadataViewportSize
  'initial-scale'?: TanstackMetadataStringNumber
  'minimum-scale'?: TanstackMetadataStringNumber
  'maximum-scale'?: TanstackMetadataStringNumber
  'user-scalable'?: 'yes' | 'no' | '1' | '0'
  'viewport-fit'?: 'auto' | 'contain' | 'cover'
}

export interface TanstackMetadataImage {
  width?: number
  height?: number
  url?: string
  alt?: string
  format?: LiteralUnion<'jpg' | 'png' | 'webp' | 'gif', string>
}

export type TanstackMetadataOpenGraphType = 'website' | 'article' | 'book' | 'profile' | 'product' | 'place' | 'event'

export type TanstackMetadataTwitterCard = 'summary' | 'summary_large_image'

export interface TanstackMetadataMsApplication {
  tileColor?: string
  config?: string
}

export interface TanstackMetadataOpenGraph {
  url?: string
  type?: LiteralUnion<TanstackMetadataOpenGraphType, string>
  locale?: string
  siteName?: string
}

export interface TanstackMetadataTwitter {
  site?: string
  creator?: string
  card?: LiteralUnion<TanstackMetadataTwitterCard, string>
}

export interface TanstackMetadata {
  charSet?: LiteralUnion<'utf-8', string>
  title?: string
  titleTemplate?: string
  description?: string
  viewport?: TanstackMetadataViewport
  author?: string
  robots?: string
  keywords?: string
  themeColor?: string
  applicationName?: string
  appleWebAppTitle?: string
  appleWebAppCapable?: boolean
  appleWebAppStatusBarStyle?: 'default' | 'black' | 'black-translucent'
  msApplication?: TanstackMetadataMsApplication
  images?: TanstackMetadataImage[]
  openGraph?: TanstackMetadataOpenGraph
  twitter?: TanstackMetadataTwitter
}

export interface TanstackMetadataParams {
  defaults?: TanstackMetadata
  metadata?: TanstackMetadata
}
