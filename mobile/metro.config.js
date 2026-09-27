const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// The apps have separate package files, so expose only their shared pure rules.
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../shared')];

module.exports = config;
