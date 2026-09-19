import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.vinodh-balaji.pomosync',
  appName: 'PomoSync - Focus Timer & Task Sync',
  webDir: 'out',
  server: {
    iosScheme: 'https',
    androidScheme: 'https'
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
      },
    },
  },
};

export default config;
