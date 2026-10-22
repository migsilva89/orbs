import { BuildConfig } from 'electrobun/main';
import { desktopBuild } from './types/desktop.types';

/** Packaged apps have no env, so the name and bundle ID come from the build. */
export const DESKTOP_BUILD = desktopBuild.parse(BuildConfig.getSync().runtime);
