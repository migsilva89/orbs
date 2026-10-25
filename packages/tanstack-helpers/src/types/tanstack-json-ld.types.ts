import type * as SchemaDtsTypes from 'schema-dts';

export type TanstackJsonLdSchema = SchemaDtsTypes.WithContext<SchemaDtsTypes.Thing>

export interface TanstackJsonLdOrganizationContactPoint {
  email?: string
  telephone?: string
  contactType?: string
  areaServed?: string | string[]
  availableLanguage?: string | string[]
}

export interface TanstackJsonLdOrganizationParams {
  id?: string
  name: string
  legalName?: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[]
  aggregateRating?: TanstackJsonLdAggregateRatingParams
  reviews?: TanstackJsonLdProductReview[]
  contactPoints?: TanstackJsonLdOrganizationContactPoint[]
}

export interface TanstackJsonLdWebApplicationParams {
  id?: string
  name: string
  url: string
  description: string
  applicationCategory?: string
  operatingSystem?: string
}

export interface TanstackJsonLdWebSiteParams {
  id?: string
  name: string
  url: string
  description?: string
  inLanguage?: string
  publisherId?: string
}

export interface TanstackJsonLdSoftwareApplicationParams {
  id?: string
  name: string
  url: string
  description: string
  applicationCategory?: string
  operatingSystem?: string
  offers?: SchemaDtsTypes.Offer[]
}

export interface TanstackJsonLdFaqItem {
  title: string
  content: string
}

export interface TanstackJsonLdHowToStep {
  name: string
  text: string
}

export interface TanstackJsonLdHowToParams {
  name: string
  description?: string
  steps: TanstackJsonLdHowToStep[]
}

export interface TanstackJsonLdAggregateRatingParams {
  ratingValue: number
  reviewCount: number
  bestRating?: number
  worstRating?: number
}

export interface TanstackJsonLdProductReview {
  author: string
  rating: number
  date: string
  title?: string
  content: string
}

export interface TanstackJsonLdAuthorParams {
  name: string
  url?: string
  avatar?: string
}

export interface TanstackJsonLdArticleParams {
  headline: string
  description: string
  url: string
  siteName: string
  siteUrl: string
  siteLogo?: string
  datePublished?: string
  dateModified?: string
  author?: TanstackJsonLdAuthorParams
  image?: string
  wordCount?: number
  keywords?: string[]
  language?: string
}

export interface TanstackJsonLdBreadcrumbItem {
  name: string
  url: string
}

export interface TanstackJsonLdWebPageParams {
  name: string
  description: string
  url: string
  siteName: string
  siteUrl: string
  datePublished?: string
  dateModified?: string
}

export interface TanstackJsonLdItemListItem {
  name: string
  position: number
}

export type TanstackJsonLdReturnCategory = 'finite' | 'unlimited' | 'none' | 'seasonal'

export type TanstackJsonLdReturnFees = 'free' | 'customer' | 'origin'

export type TanstackJsonLdReturnMethod = 'mail' | 'inStore' | 'kiosk'

export interface TanstackJsonLdQuantitativeDays {
  minDays?: number
  maxDays?: number
}

export interface TanstackJsonLdOfferShipping {
  rate?: { value: number; currency?: string }
  countries: string[]
  handlingTime?: TanstackJsonLdQuantitativeDays
  transitTime?: TanstackJsonLdQuantitativeDays
}

export interface TanstackJsonLdOfferReturn {
  countries: string[]
  category?: TanstackJsonLdReturnCategory
  returnDays?: number
  returnMethod?: TanstackJsonLdReturnMethod
  returnFees?: TanstackJsonLdReturnFees
}

export interface TanstackJsonLdPricingTier {
  name: string
  price: number
  currency?: string
  billingPeriod?: string
  description?: string
  priceValidUntil?: string
  sku?: string
  url?: string
}

export interface TanstackJsonLdProductParams {
  name: string
  description: string
  image?: string | string[]
  brandName?: string
  url?: string
  sku?: string
  category?: string
  pricing: TanstackJsonLdPricingTier[]
  aggregateRating?: TanstackJsonLdAggregateRatingParams
  reviews?: TanstackJsonLdProductReview[]
  shipping?: TanstackJsonLdOfferShipping
  returnPolicy?: TanstackJsonLdOfferReturn
}
