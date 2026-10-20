import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BotList } from '@/components/bots/bot-list';
import { ChatMessageActions } from '@/components/chat/chat-message-actions';
import { ChatMessageText } from '@/components/chat/chat-message-text';
import { ChatReactionPicker } from '@/components/chat/chat-reaction-picker';
import { ChatRoom } from '@/components/chat/chat-room';
import { ConnectIntro } from '@/components/connect/connect-intro';
import { useConnectionIsConnected, useConnectionIsDisconnected } from '@/hooks/use-connection';

export const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  groups: {
    Connected: {
      if: useConnectionIsConnected,
      screens: {
        Bots: BotList,
        Chat: ChatRoom,
        MessageActions: {
          screen: ChatMessageActions,
          options: { presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, sheetCornerRadius: 32 },
        },
        ReactionPicker: {
          screen: ChatReactionPicker,
          options: { presentation: 'formSheet', sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: true, sheetCornerRadius: 32 },
        },
        MessageText: {
          screen: ChatMessageText,
          options: { presentation: 'formSheet', sheetAllowedDetents: [0.9], sheetGrabberVisible: true, sheetCornerRadius: 32 },
        },
      },
    },
    Disconnected: {
      if: useConnectionIsDisconnected,
      screens: { Connect: ConnectIntro },
    },
  },
});
