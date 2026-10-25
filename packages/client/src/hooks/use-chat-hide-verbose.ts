import { useChatDefaults } from './use-chat-defaults';

export function useChatHideVerbose() {
  const defaults = useChatDefaults();

  return {
    hideVerbose: defaults.settings?.hideVerbose ?? true,
    isPending: defaults.isPending,
    setHideVerbose: (hideVerbose: boolean) => defaults.configure({ hideVerbose }),
  };
}
