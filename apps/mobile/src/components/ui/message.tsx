import { cva } from 'cva';
import { FileText } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { markdownColorContext } from './markdown';
import { Text, textContext } from './text';
import type { BotBubble } from '@openbots/client/client';
import type { VariantProps } from 'cva';
import type { ImageURISource, ViewProps } from 'react-native';

const messageVariants = cva({
  base: 'w-full flex-row items-end gap-2 px-3 py-1',
  variants: { from: { user: 'justify-end', assistant: 'justify-start' } },
});

const messageStackVariants = cva({
  base: 'w-4/5 min-w-0 gap-1',
  variants: { from: { user: 'items-end', assistant: 'items-start' } },
});

const messageBubbleVariants = cva({
  base: 'max-w-full min-w-0 rounded-2xl px-3.5 py-2.5',
  variants: {
    from: { user: 'bg-primary', assistant: 'bg-secondary' },
    wide: { true: 'w-full', false: '' },
  },
});

type MessageFrom = NonNullable<VariantProps<typeof messageVariants>['from']>;

interface MessageProps extends ViewProps {
  from: MessageFrom;
  /** Opens the message actions, like a long press in Messages. */
  onLongPress?: () => void;
}

export function Message({ from, onLongPress, className, children, ...props }: MessageProps) {
  return (
    <View {...props} className={cn(messageVariants({ from }), className)}>
      <Pressable className={messageStackVariants({ from })} delayLongPress={300} disabled={!onLongPress} onLongPress={onLongPress}>
        {children}
      </Pressable>
    </View>
  );
}

interface MessageBubbleProps extends ViewProps {
  from: MessageFrom;
  /** Content that needs the full width, such as a live HTML preview. */
  wide?: boolean;
  /** The bot's colour for the owner's bubbles; the primary colour when absent. */
  bubble?: BotBubble;
}

export function MessageBubble({ from, wide = false, bubble, className, style, children, ...props }: MessageBubbleProps) {
  const [onPrimary] = useCSSVariable(['--color-primary-foreground']).map(String);
  const markdownColor = from === 'user' ? bubble?.foreground ?? onPrimary : undefined;

  return (
    <View
      {...props}
      className={cn(messageBubbleVariants({ from, wide }), className)}
      style={[style, bubble && from === 'user' ? { backgroundColor: bubble.background } : undefined]}
    >
      <markdownColorContext.Provider value={markdownColor}>
        <textContext.Provider value={{ tone: from === 'user' && !bubble ? 'on-primary' : 'default' }}>{children}</textContext.Provider>
      </markdownColorContext.Provider>
    </View>
  );
}

interface MessageQuoteProps {
  children: string;
}

/** The message a reply answers, quoted at the top of the bubble. */
export function MessageQuote({ children }: MessageQuoteProps) {
  return (
    <View className="mb-1.5 border-l-2 border-muted-foreground/40 pl-2 opacity-80">
      <Text numberOfLines={2} variant="small">{children}</Text>
    </View>
  );
}

interface MessageImageProps {
  source: ImageURISource;
  name: string;
}

/** A sent photo; a muted block holds its place while it loads. */
export function MessageImage({ source, name }: MessageImageProps) {
  return (
    <View accessibilityLabel={name} accessibilityRole="image" className="size-48 overflow-hidden rounded-2xl bg-muted">
      <Image className="size-full" resizeMode="cover" source={source} />
    </View>
  );
}

interface MessageFileProps {
  name: string;
}

export function MessageFile({ name }: MessageFileProps) {
  return (
    <View className="max-w-full flex-row items-center gap-2 rounded-xl border border-border px-3 py-2">
      <Icon icon={FileText} tone="muted" />
      <Text className="shrink" numberOfLines={1} variant="button">{name}</Text>
    </View>
  );
}
