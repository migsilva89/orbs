import { chatIndexSearch } from '@repo/contracts/universal';
import { createFileRoute } from '@tanstack/react-router';
import { RoomsPage } from '@/components/rooms/rooms-page';

export const Route = createFileRoute('/_chat/rooms/')({
  validateSearch: chatIndexSearch,
  component: RoomsPage,
});
