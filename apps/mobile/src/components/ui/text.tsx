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
      // A step brighter than muted: what a muted sentence names, like the chat's event lines.
      subtle: 'text-foreground/70',
      'glass-muted': 'text-glass-muted',
      primary: 'text-primary',
      'on-primary': 'text-primary-foreground',
      'on-secondary': 'text-secondary-foreground',
      success: 'text-success',
      warning: 'text-warning',
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
      title: 'text-display font-semibold',
      heading: 'text-title font-semibold',
      body: 'text-body',
      small: 'text-footnote',
      muted: 'text-subhead text-muted-foreground',
      label: 'text-subhead leading-none font-medium',
      button: 'text-body font-medium',
      'button-small': 'text-subhead font-medium',
      error: 'text-footnote text-destructive',
      caption: 'text-caption leading-none',
      brand: 'text-display font-semibold tracking-tight',
      'brand-small': 'text-body font-semibold tracking-tight',
      'card-title': 'text-body leading-none font-medium',
      'card-description': 'text-subhead font-light',
      'item-title': 'text-body leading-snug font-medium',
      'item-description': 'text-subhead leading-snug',
      'empty-title': 'text-title font-medium tracking-tight',
      'empty-description': 'text-subhead',
      'conversation-title': 'text-title font-medium',
      'conversation-preview': 'text-body',
      'conversation-time': 'text-subhead',
      'section-title': 'text-body',
      emoji: 'text-[26px]',
      action: 'text-body',
      trace: 'text-caption font-medium',
      'trace-preview': 'text-caption',
      'search-match': 'text-body font-semibold',
      'trace-code': 'font-mono text-caption',
      pin: 'font-mono text-display font-semibold tracking-widest',
      'pin-slot': 'text-body',
      'message-time': 'text-center text-caption',
      'chat-title': 'text-body leading-tight font-semibold',
      'reaction-emoji': 'text-[10px] leading-3.5',
      'reaction-count': 'text-caption leading-4 font-medium',
      'chat-status': 'text-caption leading-tight',
      'option-letter': 'text-caption font-medium',
      'featured-name': 'text-subhead',
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
