module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 3.x requires react-native-reanimated/plugin.
    // This plugin MUST be listed last.
    plugins: ['react-native-reanimated/plugin'],
  };
};
