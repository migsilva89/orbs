import type { Artifact } from '@repo/contracts/universal';

export interface EmbedPageParams {
  artifact: Pick<Artifact, 'title' | 'spec'>
  theme: 'light' | 'dark'
}

export interface EmbedServer {
  embedRender: (params: Pick<EmbedPageParams, 'artifact'>) => string
}

export interface EmbedBuild {
  server: EmbedServer
  files: Map<string, Blob>
  script: string
  styles: string
}
