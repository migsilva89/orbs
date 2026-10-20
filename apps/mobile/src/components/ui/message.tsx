import { cva } from 'cva';
import { Pressable, View } from 'react-native';
import NativeSvg, { Path } from 'react-native-svg';
import { useCSSVariable, withUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import { markdownColorContext } from './markdown';
import { Text, textContext } from './text';
import type { BotBubble } from '@openbots/client/client';
import type { VariantProps } from 'cva';
import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

const Svg = withUniwind(NativeSvg);

const messageVariants = cva({
  base: 'w-full flex-row items-end gap-2 px-3 py-1',
  variants: { from: { user: 'justify-end', assistant: 'justify-start' } },
});

const messageStackVariants = cva({
  base: 'w-4/5 min-w-0 gap-1',
  variants: { from: { user: 'items-end', assistant: 'items-start' } },
});

const messageBubbleVariants = cva({
  base: 'max-w-full min-w-0 rounded-2xl px-4 py-3',
  variants: {
    from: { user: 'bg-primary', assistant: 'bg-secondary' },
    tail: { true: '', false: '' },
    wide: { true: 'w-full', false: '' },
  },
  compoundVariants: [
    { from: 'user', tail: true, class: 'rounded-br-lg' },
    { from: 'assistant', tail: true, class: 'rounded-bl-lg' },
  ],
});

const messageTailVariants = cva({
  base: 'absolute bottom-0 size-5',
  variants: { from: { user: '-right-2.5', assistant: '-left-2.5' } },
});

// The iOS-style wedge tucked under the bottom corner nearest the sender, as on web.
const MESSAGE_TAIL_PATHS = {
  user: 'M0 0 H10 V12 C10 16 13 19 18 20 C13 20 11 20 10 20 H0 Z',
  assistant: 'M20 0 H10 V12 C10 16 7 19 2 20 C7 20 9 20 10 20 H20 Z',
} as const;

type MessageFrom = NonNullable<VariantProps<typeof messageVariants>['from']>;

interface MessageProps extends ViewProps {
  from: MessageFrom;
  /** Opens the message actions, like a long press in Messages. */
  onLongPress?: () => void;
  /** Shown beside the sender's last bubble; assistants only. */
  avatar?: ReactNode;
}

export function Message({ from, avatar, onLongPress, className, children, ...props }: MessageProps) {
  return (
    <View {...props} className={cn(messageVariants({ from }), className)}>
      {from === 'assistant' ? <View className="size-8 shrink-0">{avatar}</View> : null}
      <Pressable className={messageStackVariants({ from })} delayLongPress={300} disabled={!onLongPress} onLongPress={onLongPress}>
        {children}
      </Pressable>
    </View>
  );
}

interface MessageNameProps {
  children: string;
}

export function MessageName({ children }: MessageNameProps) {
  return <Text className="mx-4" tone="muted" variant="message-name">{children}</Text>;
}

interface MessageBubbleProps extends ViewProps {
  from: MessageFrom;
  tail?: boolean;
  /** Content that needs the full width, such as a live HTML preview. */
  wide?: boolean;
  /** The bot's colour for the owner's bubbles; the primary colour when absent. */
  bubble?: BotBubble;
}

export function MessageBubble({ from, tail = false, wide = false, bubble, className, style, children, ...props }: MessageBubbleProps) {
  const [primary, onPrimary, secondary] = useCSSVariable(['--color-primary', '--color-primary-foreground', '--color-secondary']).map(String);
  const background = from === 'user' ? bubble?.background ?? primary : secondary;
  const markdownColor = from === 'user' ? bubble?.foreground ?? onPrimary : undefined;

  return (
    <View className={cn('relative min-w-0', wide && 'w-full')}>
      <View
        {...props}
        className={cn(messageBubbleVariants({
          from,
          tail,
          wide,
        }), className)}
        style={[style, bubble && from === 'user' ? { backgroundColor: bubble.background } : undefined]}
      >
        <markdownColorContext.Provider value={markdownColor}>
          <textContext.Provider value={{ tone: from === 'user' && !bubble ? 'on-primary' : 'default' }}>{children}</textContext.Provider>
        </markdownColorContext.Provider>
      </View>
      {tail ? (
        <Svg className={messageTailVariants({ from })} pointerEvents="none" viewBox="0 0 20 20">
          <Path d={MESSAGE_TAIL_PATHS[from]} fill={background} />
        </Svg>
      ) : null}
    </View>
  );
}
