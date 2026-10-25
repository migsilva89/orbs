import type { RegisteredRouter, RouteByPath, RoutePaths } from '@tanstack/router-core';
import type { JsonObject, JsonValue } from 'type-fest';

export interface TanstackUrlCanonicalParams {
  origin: string
  path: string
}

export interface TanstackUrlLocalizedPathParams {
  path: string
  locale: string
  baseLocale: string
}

export interface TanstackUrlCanonicalLocalizedParams extends TanstackUrlLocalizedPathParams {
  origin: string
}

export interface TanstackUrlLocaleAlternateParams {
  origin: string
  path: string
  locales: readonly string[]
  baseLocale: string
}

export interface TanstackUrlLocaleAlternate {
  hreflang: string
  href: string
}

export interface TanstackUrlResolveIntendedOptions {
  intended?: string | null
  fallback?: string
}

export interface TanstackUrlCanonicalLink {
  rel: 'canonical'
  href: string
}

export interface TanstackUrlHreflangLink {
  rel: 'alternate'
  hrefLang: string
  href: string
}

export type TanstackUrlParams<TPath extends RoutePaths<RegisteredRouter['routeTree']>> = RouteByPath<
  RegisteredRouter['routeTree'],
  TPath
>['types']['allParams'] extends infer Params
  ? Params extends JsonObject
    ? Params
    : JsonObject
  : JsonObject

export interface TanstackUrlOptions<TPath extends RoutePaths<RegisteredRouter['routeTree']>> {
  origin: string
  to: TPath
  params?: TanstackUrlParams<TPath>
  search?: JsonObject | ((prev: JsonObject) => JsonObject)
  hash?: string
}

export type TanstackUrlRuntimeSearchValue = JsonValue | undefined | (JsonValue | undefined)[]

export type TanstackUrlRuntimeSearch = Record<string, TanstackUrlRuntimeSearchValue>

export interface TanstackUrlRuntimeOptions {
  origin: string
  to: string
  params: JsonObject
  search: TanstackUrlRuntimeSearch | ((prev: JsonObject) => JsonObject)
  hash: string
}
