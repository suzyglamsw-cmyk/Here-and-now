module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4.x requires react-native-worklets/plugin (not the old
    // react-native-reanimated/plugin which was removed in v4). This plugin
    // MUST be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
