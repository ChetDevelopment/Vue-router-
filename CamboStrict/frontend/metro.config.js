const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.unstable_allowRequireContext = true;
config.transformer.unstable_transformProfile = 'default';

module.exports = config;
