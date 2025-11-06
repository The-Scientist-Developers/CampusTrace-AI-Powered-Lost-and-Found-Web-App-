// Metro configuration for Expo (web + native) in a monorepo
const path = require("path");
const { getDefaultConfig } = require("@expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../../");

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so local packages are picked up
config.watchFolders = [workspaceRoot];

// Ensure Metro resolves dependencies from the app's node_modules first
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Force single instances of react, react-dom, react-native-web
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
  "react-native-web": path.resolve(
    projectRoot,
    "node_modules/react-native-web"
  ),
};

module.exports = config;
