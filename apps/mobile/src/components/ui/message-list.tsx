import { KeyboardAwareLegendList } from '@legendapp/list/keyboard';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LegendListRef } from '@legendapp/list/react-native';
import type { ReactElement, Ref } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/** Room left for the floating header above the first message. */
const MESSAGE_LIST_TOP = 64;
/** Room between the last message and the composer, clear of the bottom edge fade. */
const MESSAGE_LIST_BOTTOM = 8;

interface MessageListProps<Item> {
  ref?: Ref<LegendListRef>;
  data: Item[];
  keyExtractor: (item: Item) => string;
  renderItem: (item: Item) => ReactElement | null;
  /** Height of the floating composer, so the last message rests above it. */
  composerInset: SharedValue<number>;
  onStartReached?: () => void;
  onEndReached?: () => void;
  /** Opens at this item instead of the newest one, such as a search result. */
  initialScrollIndex?: number;
  header?: ReactElement | null;
  footer?: ReactElement | null;
}

/** A chat transcript pinned to its newest message that follows the keyboard. */
export function MessageList<Item>({
  ref,
  data,
  keyExtractor,
  renderItem,
  composerInset,
  onStartReached,
  onEndReached,
  initialScrollIndex,
  header,
  footer,
}: MessageListProps<Item>) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();

  return (
    <KeyboardAwareLegendList
      alignItemsAtEnd
      initialScrollAtEnd={initialScrollIndex === undefined}
      initialScrollIndex={initialScrollIndex}
      recycleItems={false}
      ref={ref}
      contentContainerStyle={{ paddingTop: MESSAGE_LIST_TOP, paddingBottom: MESSAGE_LIST_BOTTOM }}
      contentInsetEndAdjustment={composerInset}
      data={data}
      estimatedItemSize={120}
      estimatedListSize={{ width: window.width, height: window.height }}
      keyboardDismissMode="interactive"
      keyboardOffset={insets.bottom}
      keyboardShouldPersistTaps="handled"
      keyExtractor={keyExtractor}
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      maintainScrollAtEnd={{ animated: false, on: { dataChange: true, itemLayout: true, layout: true, footerLayout: true } }}
      maintainVisibleContentPosition
      renderItem={({ item }) => renderItem(item)}
      style={{ flex: 1 }}
      onEndReached={onEndReached}
      onStartReached={onStartReached}
    />
  );
}
