import { index, layout, rootRoute, route } from '@tanstack/virtual-file-routes';

export const routes = rootRoute('root.tsx', [
  index('index.tsx'),
  route('/connect', 'connect/connect.tsx'),

  layout('chat', 'chat.layout.tsx', [
    route('/rooms', [
      index('rooms/rooms.index.tsx'),
      route('/direct/$handle', 'rooms/rooms.direct.$handle.tsx', [
        route('/reset', 'rooms/rooms.direct.$handle.reset.tsx'),
        route('/with/$peer/$conversationId', 'rooms/rooms.direct.$handle.with.$peer.tsx'),
        route('/todos', 'rooms/rooms.direct.$handle.todos.tsx', [
          route('/$todoId/delete', 'rooms/rooms.direct.$handle.todos.$todoId.delete.tsx'),
        ]),
        route('/routines', 'rooms/rooms.direct.$handle.routines.tsx'),
        route('/media', 'rooms/rooms.direct.$handle.media.tsx'),
      ]),
    ]),
    route('/bots', 'bots/bots.layout.tsx', [
      index('bots/bots.index.tsx'),
      route('/create', 'bots/bots.create.tsx'),
      route('/$botId', 'bots/bots.$botId.tsx', [
        route('/delete', 'bots/bots.$botId.delete.tsx'),
        route('/routines/$routineId/edit', 'bots/bots.$botId.routines.$routineId.edit.tsx'),
        route('/routines/$routineId/delete', 'bots/bots.$botId.routines.$routineId.delete.tsx'),
        route('/todos/$todoId/delete', 'bots/bots.$botId.todos.$todoId.delete.tsx'),
      ]),
    ]),
    route('/artifacts', 'artifacts/artifacts.layout.tsx', [
      index('artifacts/artifacts.index.tsx'),
      route('/$botId/$conversationId/$artifactId', 'artifacts/artifacts.$botId.$conversationId.$artifactId.tsx'),
    ]),
    route('/settings', 'settings/settings.layout.tsx', [
      route('/themes/create', 'settings/settings.themes.create.tsx'),
      route('/devices/$deviceId/revoke', 'settings/settings.devices.$deviceId.revoke.tsx'),
      route('/providers/$providerId/logout', 'settings/settings.providers.$providerId.logout.tsx'),
    ]),
  ]),
  route('/lab/avatars', 'lab/lab.avatars.tsx'),
  route('/img/favicon/site.webmanifest', 'handlers/handler.webmanifest.ts'),
]);
