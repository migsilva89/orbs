import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BotDeleteSheet } from '@/components/bots/bot-delete-sheet';
import { BotDetailsSheet } from '@/components/bots/bot-details-sheet';
import { BotList } from '@/components/bots/bot-list';
import { ChatMessageActions } from '@/components/chat/chat-message-actions';
import { ChatMessageText } from '@/components/chat/chat-message-text';
import { ChatReactionPicker } from '@/components/chat/chat-reaction-picker';
import { ChatResetSheet } from '@/components/chat/chat-reset-sheet';
import { ChatRoom } from '@/components/chat/chat-room';
import { ConnectIntro } from '@/components/connect/connect-intro';
import { TodosDeleteSheet } from '@/components/todos/todos-delete-sheet';
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
        BotDetails: {
          screen: BotDetailsSheet,
          options: { presentation: 'formSheet', sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: true, sheetCornerRadius: 32 },
        },
        TodosDelete: {
          screen: TodosDeleteSheet,
          options: { presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, sheetCornerRadius: 32 },
        },
        ChatReset: {
          screen: ChatResetSheet,
          options: { presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, sheetCornerRadius: 32 },
        },
        BotDelete: {
          screen: BotDeleteSheet,
          options: { presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, sheetCornerRadius: 32 },
        },
      },
    },
    Disconnected: {
      if: useConnectionIsDisconnected,
      screens: { Connect: ConnectIntro },
    },
  },
});
