import { useLocalSearchParams } from 'expo-router';
import { BotSectionDeleteDialog } from '@/components/bots/bot-section-delete-dialog';
import type { BotHomeSectionRouteParams } from '@/types/bot-home.types';

export default function SectionDeleteRoute() {
  const { sectionId } = useLocalSearchParams<BotHomeSectionRouteParams>();

  return <BotSectionDeleteDialog sectionId={sectionId} />;
}
