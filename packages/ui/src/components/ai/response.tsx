import { ResponseContent } from './response-content';
import type { ComponentProps } from 'react';

export function Response(props: ComponentProps<typeof ResponseContent>) {
  return <ResponseContent {...props} />;
}
