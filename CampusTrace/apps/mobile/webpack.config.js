const path = require("path");
const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({ ...env }, argv);

  // Add .jsx resolution explicitly (sometimes missing)
  if (config.resolve && Array.isArray(config.resolve.extensions)) {
    if (!config.resolve.extensions.includes(".jsx")) {
      config.resolve.extensions.push(".jsx");
    }
  }

  // Ensure monorepo package @campustrace/core (JS/JSX) is transpiled for web
  const coreSrc = path.resolve(__dirname, "../../packages/core/src");

  // Prepend a rule so it runs before source-map-loader
  config.module.rules.unshift({
    test: /\.[jt]sx?$/,
    include: [coreSrc],
    use: [
      {
        loader: "babel-loader",
        options: {
          presets: ["babel-preset-expo"],
        },
      },
    ],
  });

  // Optional: alias @campustrace/core to its src to avoid pointing at an untranspiled build variant
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    "@campustrace/core": coreSrc,
  };

  return config;
};
