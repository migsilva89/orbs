import { z } from 'zod';

export const envClientSchema = {
  VITE_APP_NAME: z.string().trim().min(1).default('Orbs'),
};
