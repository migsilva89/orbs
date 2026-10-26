import { cva } from 'cva';
import { ChevronDown, FileText, RotateCw, X } from 'lucide-react-native';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { match } from 'ts-pattern';
import { cn } from '@/lib/cn';
import { FloatingBar } from './floating-bar';
import { GlassSurface } from './glass-surface';
import { Icon } from './icon';
import { Text, textContext } from './text';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent, PressableProps, ViewProps } from 'react-native';

const promptAttachmentVariants = cva({
  base: 'size-20 items-center justify-center overflow-hidden rounded-2xl border bg-muted',
  variants: { status: { uploading: 'border-border', ready: 'border-border', failed: 'border-destructive/60' } },
});

interface PromptDockProps {
  /** Drawers stacked above the composer row. */
  drawer?: ReactNode;
  children: ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/** The bottom composer: optional drawers above a row of controls. */
export function PromptDock({ drawer, children, onLayout }: PromptDockProps) {
  return (
    <FloatingBar className="flex-col items-stretch gap-2" edge="bottom" onLayout={onLayout}>
      {drawer}
      <View className="flex-row items-end gap-2">{children}</View>
    </FloatingBar>
  );
}

/** A scrolling list of drawer items, such as mention choices. */
export function PromptDrawerList({ children }: ViewProps) {
  return (
    <ScrollView className="max-h-60" keyboardShouldPersistTaps="always" nestedScrollEnabled>
      {children}
    </ScrollView>
  );
}

/** Glass card above the composer: mention choices, queued messages and the reply quote. */
export function PromptDrawer({ className, ...props }: ViewProps) {
  return <GlassSurface {...props} className={cn('p-1.5', className)} radius="field" />;
}

interface PromptDrawerItemProps extends Omit<PressableProps, 'children'> {
  title: string;
  description?: string;
  /** An icon or avatar before the title. */
  leading?: ReactNode;
  /** A hint or action after the description. */
  trailing?: ReactNode;
  tone?: 'default' | 'destructive';
}

export function PromptDrawerItem({ title, description, leading, trailing, tone = 'default', disabled, ...props }: PromptDrawerItemProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      className="min-h-9 flex-row items-center gap-2 rounded-lg px-2 py-1 active:bg-accent"
      disabled={disabled ?? !props.onPress}
    >
      <textContext.Provider value={{ tone: tone === 'destructive' ? 'destructive' : 'muted' }}>
        {leading}
        <Text className={description ? 'max-w-[45%] shrink-0' : 'flex-1'} numberOfLines={1} tone={tone === 'destructive' ? 'destructive' : 'default'} variant="item-title">{title}</Text>
        {description ? <Text className="flex-1" numberOfLines={1} variant="item-description">{description}</Text> : null}
        {trailing}
      </textContext.Provider>
    </Pressable>
  );
}

interface PromptQuoteProps {
  children: string;
  removeLabel: string;
  onRemove: () => void;
}

export function PromptQuote({ children, removeLabel, onRemove }: PromptQuoteProps) {
  return (
    <View className="flex-row items-center gap-2 py-1 pr-1 pl-2">
      <View className="flex-1 border-l-2 border-muted-foreground/40 pl-2">
        <Text numberOfLines={2} tone="muted" variant="small">{children}</Text>
      </View>
      <Pressable accessibilityLabel={removeLabel} accessibilityRole="button" className="size-8 items-center justify-center rounded-full active:bg-accent" hitSlop={8} onPress={onRemove}>
        <Icon icon={X} tone="muted" />
      </Pressable>
    </View>
  );
}

export function PromptAttachments({ children }: ViewProps) {
  return (
    <ScrollView horizontal contentContainerClassName="gap-2 py-1 pr-2" keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

interface PromptAttachmentProps {
  name: string;
  /** A local image to show instead of the file icon. */
  preview?: string;
  status: 'uploading' | 'ready' | 'failed';
  removeLabel: string;
  retryLabel: string;
  onRemove: () => void;
  onRetry: () => void;
}

export function PromptAttachment({ name, preview, status, removeLabel, retryLabel, onRemove, onRetry }: PromptAttachmentProps) {
  return (
    <View className="relative">
      <Pressable
        accessibilityHint={status === 'failed' ? retryLabel : undefined}
        accessibilityLabel={name}
        accessibilityState={{ busy: status === 'uploading' }}
        className={promptAttachmentVariants({ status })}
        disabled={status !== 'failed'}
        onPress={onRetry}
      >
        {match(preview)
          .with(undefined, () => (
            <View className="items-center gap-1 px-1">
              <Icon icon={FileText} tone="muted" />
              <Text numberOfLines={1} tone="muted" variant="caption">{name}</Text>
            </View>
          ))
          .otherwise((uri) => <Image className="size-full" source={{ uri }} />)}
        {match(status)
          .with('uploading', () => (
            <View className="absolute inset-0 items-center justify-center bg-black/30">
              <ActivityIndicator color="white" />
            </View>
          ))
          .with('failed', () => (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <View className="size-8 items-center justify-center rounded-full bg-destructive">
                <Icon icon={RotateCw} tone="on-destructive" />
              </View>
            </View>
          ))
          .otherwise(() => null)}
      </Pressable>
      <Pressable
        accessibilityLabel={removeLabel}
        accessibilityRole="button"
        className="absolute top-1.5 right-1.5 size-6 items-center justify-center rounded-full bg-background/80"
        hitSlop={6}
        onPress={onRemove}
      >
        <Icon icon={X} size="sm" />
      </Pressable>
    </View>
  );
}

interface PromptJumpProps {
  children: string;
  onPress: () => void;
}

/** A centered pill above the composer that jumps to the newest messages. */
export function PromptJump({ children, onPress }: PromptJumpProps) {
  return (
    <Animated.View className="mb-6 self-center" entering={FadeIn} exiting={FadeOut}>
      <Pressable
        accessibilityRole="button"
        className="h-9 flex-row items-center gap-2 rounded-full border border-blue-400/70 bg-blue pr-4 pl-3.5 shadow-sm active:scale-[0.97]"
        hitSlop={8}
        style={{ borderCurve: 'continuous' }}
        onPress={onPress}
      >
        <textContext.Provider value={{ tone: 'on-blue' }}>
          <Icon icon={ChevronDown} strokeWidth={2.75} />
          <Text className="text-body font-light">{children}</Text>
        </textContext.Provider>
      </Pressable>
    </Animated.View>
  );
}
