import { cva } from 'cva';
import { createContext, use } from 'react';
import { Text as NativeText } from 'react-native';
import { cn } from '@/lib/cn';
import type { VariantProps } from 'cva';
import type { TextProps as NativeTextProps } from 'react-native';

export const textBaseVariants = cva({
  base: 'font-sans tracking-body text-foreground',
  variants: {
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      'glass-muted': 'text-glass-muted',
      primary: 'text-primary',
      'on-primary': 'text-primary-foreground',
      'on-secondary': 'text-secondary-foreground',
      destructive: 'text-destructive',
      'destructive-subtle': 'text-destructive/40',
      'on-destructive': 'text-destructive-foreground',
      'on-blue': 'text-white',
      card: 'text-card-foreground',
    },
  },
});

export const textVariants = cva({
  composes: textBaseVariants,
  variants: {
    variant: {
      title: 'text-2xl font-semibold',
      heading: 'text-xl font-semibold',
      body: 'text-sm',
      small: 'text-xs',
      muted: 'text-sm text-muted-foreground',
      label: 'text-sm leading-none font-medium',
      button: 'text-sm font-medium',
      'button-small': 'text-xs font-medium',
      error: 'text-xs text-destructive',
      caption: 'text-xxs leading-none',
      brand: 'text-2xl font-semibold tracking-tight',
      'brand-small': 'text-base font-semibold tracking-tight',
      'card-title': 'text-base leading-none font-medium',
      'card-description': 'text-xs font-light',
      'item-title': 'text-sm leading-snug font-medium',
      'item-description': 'text-sm leading-snug',
      'empty-title': 'text-lg font-medium tracking-tight',
      'empty-description': 'text-xxs leading-relaxed',
      'conversation-title': 'text-xl font-medium',
      'conversation-preview': 'text-[17px]',
      'conversation-time': 'text-[15px]',
      'section-title': 'text-[17px]',
      emoji: 'text-[26px]',
      action: 'text-[17px]',
      trace: 'text-xs font-medium',
      'trace-preview': 'text-xs',
      'trace-code': 'font-mono text-xs',
      'message-time': 'text-center text-xs',
      'chat-title': 'text-[15px] leading-tight font-semibold',
      'reaction-emoji': 'text-[10px] leading-3.5',
      'reaction-count': 'text-xxs leading-4 font-medium',
      'chat-status': 'text-xs leading-tight',
      'featured-name': 'text-[17px]',
      'avatar-small': 'text-base',
      avatar: 'text-[26px]',
      'avatar-featured': 'text-[52px]',
    },
  },
  defaultVariants: { variant: 'body' },
});

export const textContext = createContext<Pick<TextProps, 'variant' | 'tone'>>({});

export interface TextProps extends NativeTextProps, VariantProps<typeof textVariants> {}

export function Text({ className, variant, tone, ...props }: TextProps) {
  const inherited = use(textContext);
  return <NativeText {...props} className={cn(textVariants({ variant: variant ?? inherited.variant, tone: tone ?? inherited.tone }), className)} />;
}
