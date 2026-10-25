import type * as TanstackUrlTypes from './types/tanstack-url.types';
import type { RegisteredRouter, RoutePaths } from '@tanstack/router-core';
import type { Except, JsonObject, JsonValue } from 'type-fest';

function joinOriginPath(origin: string, path: string): string {
  const trimmedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedOrigin}${normalizedPath}`;
}

function stringifyUrlValue(value: JsonValue): string {
  if (value === true || value === false) {
    return String(value);
  }

  if (value === null || Array.isArray(value) || value instanceof Object) {
    return JSON.stringify(value);
  }

  return String(value);
}

export function url<TPath extends RoutePaths<RegisteredRouter['routeTree']>>(
  options: TanstackUrlTypes.TanstackUrlParams<TPath> extends JsonObject
    ? TanstackUrlTypes.TanstackUrlOptions<TPath>
    : Except<TanstackUrlTypes.TanstackUrlOptions<TPath>, 'params'> & Required<Pick<TanstackUrlTypes.TanstackUrlOptions<TPath>, 'params'>>,
): string {
  const runtimeOptions: TanstackUrlTypes.TanstackUrlRuntimeOptions = {
    origin: options.origin,
    to: options.to,
    params: options.params ?? {},
    search: options.search ?? {},
    hash: options.hash ?? '',
  };

  let path = runtimeOptions.to;

  for (const [key, value] of Object.entries(runtimeOptions.params)) {
    const placeholder = `$${key}`;

    if (path.includes(placeholder)) {
      path = path.replace(placeholder, encodeURIComponent(stringifyUrlValue(value)));
    }
  }

  if (path.includes('$')) {
    const missingParams = path
      .split('/')
      .filter((segment) => segment.startsWith('$'))
      .join(', ');

    throw new TypeError(`[tanstack-helpers] URL generation failed: Missing required parameters (${missingParams}) for pattern "${runtimeOptions.to}"`);
  }

  const resolvedSearch: TanstackUrlTypes.TanstackUrlRuntimeSearch = runtimeOptions.search instanceof Function
    ? runtimeOptions.search({})
    : runtimeOptions.search;

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearch)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          searchParams.append(key, stringifyUrlValue(item));
        }
      }
      continue;
    }

    searchParams.set(key, stringifyUrlValue(value));
  }

  const searchString = searchParams.toString();
  const hashString = runtimeOptions.hash ? `#${runtimeOptions.hash.replace(/^#/, '')}` : '';

  return `${joinOriginPath(runtimeOptions.origin, path)}${searchString ? `?${searchString}` : ''}${hashString}`;
}

export function resolveIntendedUrl(options: TanstackUrlTypes.TanstackUrlResolveIntendedOptions): string {
  const fallback = sanitizeRelativeUrl(options.fallback) ?? '/';
  const intended = options.intended?.trim();

  if (!intended) {
    return fallback;
  }

  return sanitizeRelativeUrl(intended) ?? fallback;
}

function sanitizeRelativeUrl(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmed, 'https://app.local');

    if (parsedUrl.origin !== 'https://app.local') {
      return null;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null;
  }
}

export function canonicalHref(params: TanstackUrlTypes.TanstackUrlCanonicalParams): string {
  const isAbsoluteUrl = /^https?:\/\//.test(params.path);

  if (isAbsoluteUrl) {
    return params.path;
  }

  return joinOriginPath(params.origin, params.path);
}

export function canonicalLink(params: TanstackUrlTypes.TanstackUrlCanonicalParams): TanstackUrlTypes.TanstackUrlCanonicalLink {
  return {
    rel: 'canonical',
    href: canonicalHref(params),
  };
}

export function canonicalLocalizedLink(params: TanstackUrlTypes.TanstackUrlCanonicalLocalizedParams): TanstackUrlTypes.TanstackUrlCanonicalLink {
  return canonicalLink({
    origin: params.origin,
    path: localizePath({
      path: params.path,
      locale: params.locale,
      baseLocale: params.baseLocale,
    }),
  });
}

export function localizePath(params: TanstackUrlTypes.TanstackUrlLocalizedPathParams): string {
  const normalizedPath = params.path.startsWith('/') ? params.path : `/${params.path}`;

  if (params.locale === params.baseLocale) {
    return normalizedPath;
  }

  if (normalizedPath === '/') {
    return `/${params.locale}`;
  }

  return `/${params.locale}${normalizedPath}`;
}

export function getLocaleAlternates(params: TanstackUrlTypes.TanstackUrlLocaleAlternateParams): TanstackUrlTypes.TanstackUrlLocaleAlternate[] {
  const localeAlternates = params.locales.map((locale) => ({
    hreflang: locale,
    href: canonicalHref({
      origin: params.origin,
      path: localizePath({
        path: params.path,
        locale,
        baseLocale: params.baseLocale,
      }),
    }),
  }));

  return [
    ...localeAlternates,
    {
      hreflang: 'x-default',
      href: canonicalHref({
        origin: params.origin,
        path: localizePath({
          path: params.path,
          locale: params.baseLocale,
          baseLocale: params.baseLocale,
        }),
      }),
    },
  ];
}

export function hreflangLinks(params: TanstackUrlTypes.TanstackUrlLocaleAlternateParams): TanstackUrlTypes.TanstackUrlHreflangLink[] {
  return getLocaleAlternates(params).map((alternate) => ({
    rel: 'alternate',
    hrefLang: alternate.hreflang,
    href: alternate.href,
  }));
}
