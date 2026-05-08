module.exports = function(api) {
  api.cache(true);
  return {
    // Disable babel-preset-expo's auto-injection of worklets and reanimated
    // plugins. In Expo SDK 55, expo-modules-core declares react-native-worklets
    // as a peer dep; npm 7+ auto-installs it during EAS builds, which makes
    // babel-preset-expo try to load 'react-native-worklets/plugin' — but the
    // installed peer version (0.7.x/0.8.x) has a different export layout, so
    // the require fails and the build crashes.
    // We explicitly add react-native-reanimated/plugin ourselves below.
    presets: [['babel-preset-expo', { worklets: false, reanimated: false }]],
    // Reanimated 3.x plugin — added explicitly. MUST be listed last.
    plugins: ['react-native-reanimated/plugin'],
  };
};
