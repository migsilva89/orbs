import { m } from '@openbots/i18n/messages';
import { z } from 'zod';
import type { ExpoConfig } from 'expo/config';

const appEnv = z.object({
  APP_VARIANT: z.enum(['development', 'preview', 'production']).default('development'),
  OPENBOTS_APP_NAME: z.string().trim().min(1).default('Openbots'),
  OPENBOTS_APP_SLUG: z.string().trim().min(1).default('openbots'),
  OPENBOTS_APP_SCHEME: z.string().trim().min(1).default('openbots'),
  OPENBOTS_BUNDLE_ID: z.string().trim().min(1).default('app.openbots.mobile'),
  OPENBOTS_APPLE_TEAM_ID: z.string().trim().min(1).optional(),
  OPENBOTS_EAS_OWNER: z.string().trim().min(1).optional(),
  OPENBOTS_EAS_PROJECT_ID: z.uuid().optional(),
}).parse(process.env);

const VARIANTS = {
  development: { name: `${appEnv.OPENBOTS_APP_NAME} Dev`, suffix: '-dev', bundleSuffix: '.dev' },
  preview: { name: `${appEnv.OPENBOTS_APP_NAME} Preview`, suffix: '-preview', bundleSuffix: '.preview' },
  production: { name: appEnv.OPENBOTS_APP_NAME, suffix: '', bundleSuffix: '' },
} satisfies Record<typeof appEnv.APP_VARIANT, { name: string; suffix: string; bundleSuffix: string }>;

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

const variant = VARIANTS[appEnv.APP_VARIANT];
const bundleIdentifier = `${appEnv.OPENBOTS_BUNDLE_ID}${variant.bundleSuffix}`;

export default (): ExpoConfig => ({
  name: variant.name,
  slug: appEnv.OPENBOTS_APP_SLUG,
  scheme: `${appEnv.OPENBOTS_APP_SCHEME}${variant.suffix}`,
  version: '0.1.0',
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier,
    appleTeamId: appEnv.OPENBOTS_APPLE_TEAM_ID,
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocalNetworkUsageDescription: m.mobile_local_network_permission(),
    },
  },
  android: {
    package: bundleIdentifier,
  },
  experiments: { typedRoutes: true },
  owner: appEnv.OPENBOTS_EAS_OWNER,
  extra: { eas: { projectId: appEnv.OPENBOTS_EAS_PROJECT_ID } },
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
