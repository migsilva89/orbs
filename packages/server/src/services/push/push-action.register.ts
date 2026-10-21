import type { PushRegisterParams, PushServiceDeps } from '../../types/push.types';

export async function pushActionRegister({ database }: PushServiceDeps, { deviceId, token }: PushRegisterParams): Promise<void> {
  await database.db.transaction().execute(async (tx) => {
    if (token) {
      await tx.updateTable('device').set({ pushToken: null }).where('pushToken', '=', token).execute();
    }

    await tx.updateTable('device').set({ pushToken: token }).where('id', '=', deviceId).execute();
  });
}
