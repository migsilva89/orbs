import { m } from '@openbots/i18n/messages';
import { z } from 'zod';
import type { ExpoConfig } from 'expo/config';

const appVariantSchema = z.enum(['development', 'preview', 'production']).default('development');

const VARIANTS: Record<z.infer<typeof appVariantSchema>, { name: string; scheme: string; bundleIdentifier: string }> = {
  development: { name: 'Orbs Dev', scheme: 'orbs-dev', bundleIdentifier: 'app.openbots.mobile.dev' },
  preview: { name: 'Orbs Preview', scheme: 'orbs-preview', bundleIdentifier: 'app.openbots.mobile.preview' },
  production: { name: 'Orbs', scheme: 'orbs', bundleIdentifier: 'app.openbots.mobile' },
};

const INTER_WEIGHTS = [
  { file: '300Light/Inter_300Light.ttf', weight: 300 },
  { file: '400Regular/Inter_400Regular.ttf', weight: 400 },
  { file: '500Medium/Inter_500Medium.ttf', weight: 500 },
  { file: '600SemiBold/Inter_600SemiBold.ttf', weight: 600 },
  { file: '700Bold/Inter_700Bold.ttf', weight: 700 },
  { file: '400Regular_Italic/Inter_400Regular_Italic.ttf', weight: 400, style: 'italic' },
  { file: '700Bold_Italic/Inter_700Bold_Italic.ttf', weight: 700, style: 'italic' },
];

const interPath = (file: string) => `./node_modules/@expo-google-fonts/inter/${file}`;

const variant = VARIANTS[appVariantSchema.parse(process.env.APP_VARIANT)];

export default (): ExpoConfig => ({
  name: variant.name,
  slug: 'orbs',
  scheme: variant.scheme,
  version: '0.1.0',
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: variant.bundleIdentifier,
    appleTeamId: 'YOURTEAMID',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocalNetworkUsageDescription: m.mobile_local_network_permission(),
    },
  },
  android: {
    package: variant.bundleIdentifier,
  },
  experiments: { typedRoutes: true },
  owner: 'nikuscs',
  extra: { eas: { projectId: '00000000-0000-0000-0000-000000000000' } },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    '@pierrecapo/expo-notification-service-extension',
    ['expo-image-picker', { photosPermission: m.mobile_photos_permission(), cameraPermission: m.mobile_camera_permission(), microphonePermission: false }],
    [
      'expo-font',
      {
        ios: { fonts: INTER_WEIGHTS.map(({ file }) => interPath(file)) },
        android: {
          fonts: [
            {
              fontFamily: 'Inter',
              fontDefinitions: INTER_WEIGHTS.map(({ file, weight, style }) => ({ path: interPath(file), weight, style })),
            },
          ],
        },
      },
    ],
  ],
});
