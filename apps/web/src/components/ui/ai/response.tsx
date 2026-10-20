import { ResponseContent } from '@/components/ui/ai/response-content';
import type { ComponentProps } from 'react';

export function Response(props: ComponentProps<typeof ResponseContent>) {
  return <ResponseContent {...props} />;
}
