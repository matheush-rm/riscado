import { ConfigContext, ExpoConfig } from 'expo/config';

/** CI injects APP_VERSION (from git tag) and VERSION_CODE (run number). */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  version: process.env.APP_VERSION || config.version,
  android: {
    ...config.android,
    versionCode: Number(process.env.VERSION_CODE || 1),
  },
});
