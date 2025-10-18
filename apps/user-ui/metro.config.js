// Learn more on how to setup config for the app: https://docs.expo.dev/guides/config-plugins/#metro-config
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root and workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..'); // Adjust this path as needed

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve modules from
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the top-level `node_modules`
config.resolver.disableHierarchicalLookup = true;

// 4. Ensure Metro correctly resolves the entry point for expo-router
// This is crucial for web builds in a monorepo with expo-router
config.resolver.entryExts = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'];

module.exports = config;
