import { createMetadata } from '@openbots/tanstack-helpers/universal';
import { SEO_METADATA_DEFAULTS } from '@/services/seo/seo.constants';
import type * as SeoTypes from '@/types/seo.types';

export function seoHead({ title, description }: SeoTypes.SeoHeadParams) {
  return { meta: createMetadata({ metadata: { title, description, titleTemplate: SEO_METADATA_DEFAULTS.titleTemplate } }) };
}
