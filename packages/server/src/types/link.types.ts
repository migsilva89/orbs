import type { LinkResolverService } from '../services/link/link-resolver.service';

export interface LinkServiceDeps {
  resolver: LinkResolverService;
}

export interface LinkResolverPublicParams {
  hostname: string;
}

export interface LinkDriverFetchParams {
  url: string;
  signal?: AbortSignal;
  redirects?: number;
}

export interface LinkPage {
  url: string;
  html: string;
}
