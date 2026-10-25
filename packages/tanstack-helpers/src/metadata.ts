import type * as TanstackMetadataTypes from './types/tanstack-metadata.types';

function resolveTitle(title?: string, template?: string): string | undefined {
  if (!title) {
    return undefined;
  }

  if (!template || !template.includes('%s')) {
    return title;
  }

  return template.replace('%s', title);
}

function addMetaTag(meta: TanstackMetadataTypes.TanstackMetadataMeta[], keyType: 'name' | 'property', keyName: string, content?: string) {
  if (content && content.trim() !== '') {
    meta.push({ [keyType]: keyName, content });
  }
}

function addImageMetadata(meta: TanstackMetadataTypes.TanstackMetadataMeta[], images?: TanstackMetadataTypes.TanstackMetadataImage[]) {
  if (!images?.length) {
    return;
  }

  const primaryImage = images[0];

  if (primaryImage.url) {
    addMetaTag(meta, 'name', 'twitter:image', primaryImage.url);
    addMetaTag(meta, 'name', 'twitter:image:alt', primaryImage.alt);
    addMetaTag(meta, 'name', 'twitter:image:width', primaryImage.width?.toString());
    addMetaTag(meta, 'name', 'twitter:image:height', primaryImage.height?.toString());
  }

  for (const image of images) {
    if (image.url) {
      addMetaTag(meta, 'property', 'og:image', image.url);
      addMetaTag(meta, 'property', 'og:image:alt', image.alt);
      addMetaTag(meta, 'property', 'og:image:type', image.format);
      addMetaTag(meta, 'property', 'og:image:width', image.width?.toString());
      addMetaTag(meta, 'property', 'og:image:height', image.height?.toString());
    }
  }
}

export function createMetadata(params: TanstackMetadataTypes.TanstackMetadataParams = {}): TanstackMetadataTypes.TanstackMetadataMeta[] {
  const defaults = params.defaults ?? {};
  const metadata = params.metadata ?? {};

  const merged: TanstackMetadataTypes.TanstackMetadata = {
    ...defaults,
    ...metadata,
    viewport: {
      ...defaults.viewport,
      ...metadata.viewport,
    },
    openGraph: {
      ...defaults.openGraph,
      ...metadata.openGraph,
    },
    twitter: {
      ...defaults.twitter,
      ...metadata.twitter,
    },
  };

  const isUsingDefaultTitle = metadata.title === undefined && merged.title === defaults.title;
  const title = isUsingDefaultTitle ? merged.title : resolveTitle(merged.title, merged.titleTemplate);
  const meta: TanstackMetadataTypes.TanstackMetadataMeta[] = [];

  if (merged.charSet) {
    meta.push({ charSet: merged.charSet });
  }

  if (title) {
    meta.push({ title });
  }

  const viewportEntries = Object.entries(merged.viewport ?? {}).filter(([, v]) => v !== null && v !== undefined);

  if (viewportEntries.length > 0) {
    meta.push({ name: 'viewport', content: viewportEntries.map(([k, v]) => `${k}=${v}`).join(', ') });
  }

  addMetaTag(meta, 'name', 'description', merged.description);
  addMetaTag(meta, 'name', 'author', merged.author);
  addMetaTag(meta, 'name', 'robots', merged.robots);
  addMetaTag(meta, 'name', 'keywords', merged.keywords);
  addMetaTag(meta, 'name', 'theme-color', merged.themeColor);
  addMetaTag(meta, 'name', 'application-name', merged.applicationName);
  addMetaTag(meta, 'name', 'apple-mobile-web-app-title', merged.appleWebAppTitle);

  if (merged.appleWebAppCapable) {
    addMetaTag(meta, 'name', 'apple-mobile-web-app-capable', 'yes');
    addMetaTag(meta, 'name', 'mobile-web-app-capable', 'yes');
  }

  addMetaTag(meta, 'name', 'apple-mobile-web-app-status-bar-style', merged.appleWebAppStatusBarStyle);
  addMetaTag(meta, 'name', 'msapplication-TileColor', merged.msApplication?.tileColor);
  addMetaTag(meta, 'name', 'msapplication-config', merged.msApplication?.config);

  addMetaTag(meta, 'property', 'og:title', title);
  addMetaTag(meta, 'property', 'og:description', merged.description);
  addMetaTag(meta, 'property', 'og:url', merged.openGraph?.url);
  addMetaTag(meta, 'property', 'og:type', merged.openGraph?.type);
  addMetaTag(meta, 'property', 'og:locale', merged.openGraph?.locale);
  addMetaTag(meta, 'property', 'og:site_name', merged.openGraph?.siteName);

  addMetaTag(meta, 'name', 'twitter:card', merged.twitter?.card);
  addMetaTag(meta, 'name', 'twitter:site', merged.twitter?.site);
  addMetaTag(meta, 'name', 'twitter:creator', merged.twitter?.creator);
  addMetaTag(meta, 'name', 'twitter:title', title);
  addMetaTag(meta, 'name', 'twitter:description', merged.description);

  addImageMetadata(meta, merged.images);

  return meta;
}
