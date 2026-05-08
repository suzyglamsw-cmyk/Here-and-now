// Polyfills for Expo SDK 55 — must be imported BEFORE any other code
// that may use Buffer or crypto.getRandomValues (e.g. react-native-svg's
// fetchData uses Buffer internally on web/SSR paths).
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
