// app.config.js — static Expo config object (NOT a function)
// Emergent's deploy pipeline reads this with `require()` and JSON.stringifies it
// to generate app.json at build time. Exporting a function would produce
// `undefined` from JSON.stringify and break the build.

module.exports = {
  expo: {
    name: 'Here & Now',
    slug: 'here-and-now',
    version: '1.0.8',
    orientation: 'portrait',
    newArchEnabled: false,
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f0a1e',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.herenow.app',
      infoPlist: {
        NSCameraUsageDescription:
          'Here & Now needs camera access to take profile photos',
        NSPhotoLibraryUsageDescription:
          'Here & Now needs photo library access to select profile photos',
        NSLocationWhenInUseUsageDescription:
          'Here & Now needs your location to show nearby venues and people',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Here & Now needs your location to show nearby venues and people',
        NSMicrophoneUsageDescription:
          'Here & Now needs microphone access to record voice intros',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0f0a1e',
      },
      package: 'com.herenow.app',
      versionCode: 8,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECORD_AUDIO',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
      ],
      googleServicesFile: './google-services.json',
      config: {
        googleMaps: {
          // Read at build time from env var (set in /app/frontend/.env)
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      'expo-secure-store',
      'expo-location',
      'expo-camera',
      'expo-image-picker',
      'expo-av',
      '@react-native-community/datetimepicker',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#a855f7',
        },
      ],
    ],
    platforms: ['ios', 'android', 'web'],
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/icon.png',
    },
    extra: {
      // External production backend — kept here (not in .env) so the
      // Emergent build pipeline does NOT sed-rewrite it to the deployment URL.
      apiBaseUrl: 'https://herenow-eas-android.emergent.host',
      eas: {
        projectId: 'hereandnow-5c927',
      },
    },
  },
};
