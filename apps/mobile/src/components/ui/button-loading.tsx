import { Button } from './button';
import type { ComponentProps } from 'react';

interface ButtonLoadingProps extends ComponentProps<typeof Button> {
  loading: boolean;
}

export function ButtonLoading(props: ButtonLoadingProps) {
  return <Button {...props} />;
}
