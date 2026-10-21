import { useChatDefaults } from './use-chat-defaults';

/** The owner's daemon-wide choice to hide tool calls and thinking from chats; hidden until the settings load. */
export function useChatHideVerbose() {
  const defaults = useChatDefaults();

  return {
    hideVerbose: defaults.settings?.hideVerbose ?? true,
    isPending: defaults.isPending,
    setHideVerbose: (hideVerbose: boolean) => defaults.configure({ hideVerbose }),
  };
}
