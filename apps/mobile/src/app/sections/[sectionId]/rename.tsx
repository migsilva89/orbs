import { useLocalSearchParams } from 'expo-router';
import { BotSectionSheet } from '@/components/bots/bot-section-sheet';
import type { BotHomeSectionRouteParams } from '@/types/bot-home.types';

export default function SectionRenameRoute() {
  const { sectionId } = useLocalSearchParams<BotHomeSectionRouteParams>();

  return <BotSectionSheet sectionId={sectionId} />;
}
