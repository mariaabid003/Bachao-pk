// metro.config.js — Expo SDK 51 with web support
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enable web platform support alongside native
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Stub out native-only packages on web so the bundle doesn't break
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // react-native-maps has no web support — return empty stub
    if (moduleName === 'react-native-maps') {
      return { type: 'empty' };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
