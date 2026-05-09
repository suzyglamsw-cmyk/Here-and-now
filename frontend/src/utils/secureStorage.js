import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cross-platform secure-ish storage adapter.
 *
 * - Native (iOS/Android): uses expo-secure-store (Keychain / EncryptedSharedPreferences)
 * - Web: falls back to AsyncStorage (localStorage shim) so the web preview & PWA work
 *
 * This unblocks local web testing of authenticated flows without paying for APK builds.
 */
const isWeb = Platform.OS === 'web';

export const secureGet = async (key) => {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
};

export const secureSet = async (key, value) => {
  if (isWeb) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
};

export const secureDelete = async (key) => {
  if (isWeb) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
};

export default { get: secureGet, set: secureSet, delete: secureDelete };
