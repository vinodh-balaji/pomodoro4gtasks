import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.taskspomodoro',
  appName: 'tasks-pomodoro',
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
