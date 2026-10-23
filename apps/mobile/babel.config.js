module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Hermes v1 cannot compile rest-destructured parameters (`...[a, b]`), which @orpc/server ships.
    plugins: ['@babel/plugin-transform-parameters'],
  };
};
