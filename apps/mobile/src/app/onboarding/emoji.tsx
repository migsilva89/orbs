import { BotAvatarEmojiScreen } from '@/components/bots/bot-avatar-emoji-screen';

export default function OnboardingEmojiRoute() {
  return <BotAvatarEmojiScreen returnTo="onboarding/[step]" />;
}
