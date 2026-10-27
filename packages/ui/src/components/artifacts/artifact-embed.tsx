import { createMemoryHistory, createRootRoute, createRouter, RouterContextProvider } from '@tanstack/react-router';
import { LazyMotion } from 'motion/react';
import { useState } from 'react';
import { ArtifactView } from './artifact-view';
import type { StateStore } from '@json-render/core';
import type { ArtifactSpec } from '@repo/contracts/universal';

interface ArtifactEmbedProps {
  spec: ArtifactSpec
  store: StateStore
  title: string
}

export function ArtifactEmbed(props: ArtifactEmbedProps) {
  const [router] = useState(() => createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() }));

  return (
    <RouterContextProvider router={router}>
      <LazyMotion
        strict
        features={() => import('../../lib/motion').then((module) => module.motionFeatures)}
      >
        <ArtifactView {...props} />
      </LazyMotion>
    </RouterContextProvider>
  );
}
