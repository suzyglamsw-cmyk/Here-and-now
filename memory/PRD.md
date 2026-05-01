# Here & Now — Mobile App PRD

## Overview
"Here & Now" is a location-based social discovery app (React Native / Expo) where users check in to nearby venues, discover others present at the same place, send glances/icebreakers, and start conversations after a mutual reveal.

## Tech Stack
- **Frontend (mobile)**: Expo SDK 54, React Native 0.81.5, React Navigation v7 (native-stack + bottom-tabs), expo-secure-store, expo-camera, expo-image-picker, expo-location, expo-notifications, expo-av, react-native-maps, lucide-react-native, axios.
- **Backend**: FastAPI + MongoDB (Motor), JWT auth, Stripe, web-push, bcrypt — already deployed at `https://spontaneous-venue.preview.emergentagent.com`.
- **Firebase**: Project `hereandnow-5c927` for FCM push, Auth, Firestore. `google-services.json` is bundled at `/app/frontend/google-services.json`.

## Mobile App Structure (`/app/frontend`)
- `App.js` — Root with `GestureHandlerRootView`, `SafeAreaProvider`, `AuthProvider`, `NavigationContainer`. Registers push notifications post-auth.
- `index.js` — `registerRootComponent(App)`.
- `src/navigation/AppNavigator.js` — Auth/Main stack switch + 4 bottom tabs (Discover, Connections, Messages, Profile).
- `src/screens/auth/` — Login, Register, ForgotPassword, OnboardingGender, ProfileSetup.
- `src/screens/main/` — Discover, Venues, WhosHere, Connections, Chat, Profile, EditProfile, Settings, UserProfile.
- `src/utils/api.js` — axios with JWT interceptor + grouped APIs (auth, venues, discovery, connections, messages, photos, voice, settings, premium).
- `src/utils/constants.js` — `API_URL = https://spontaneous-venue.preview.emergentagent.com`, theme tokens.
- `src/context/AuthContext.js` — login/register/logout, token persistence via `expo-secure-store`.

## Build / Release Config
- `app.json`:
  - `name`: "Here & Now", `slug`: "here-and-now", `version`: 1.0.0
  - **Android `package`**: `com.herenow.app`, `versionCode`: 1
  - **iOS `bundleIdentifier`**: `com.herenow.app`
  - Permissions: CAMERA, LOCATION (fine + coarse), RECORD_AUDIO, READ/WRITE_EXTERNAL_STORAGE, VIBRATE, RECEIVE_BOOT_COMPLETED.
  - iOS `infoPlist` usage descriptions for camera, photo library, location, microphone.
  - `googleServicesFile`: `./google-services.json` (FCM).
  - Google Maps API key embedded for `react-native-maps`.
  - Plugins: expo-secure-store, expo-location, expo-camera, expo-image-picker, expo-av, expo-notifications.
- `eas.json` — `preview` profile builds **Android APK**; `production` builds AAB.

## Build Method
User chose **Emergent Publish button** (top-right). No EAS account/CLI needed — Emergent's hosted build pipeline reads `app.json` + `eas.json` and produces a downloadable APK signed with the correct `com.herenow.app` package ID.

## Verification Done
- Repo cloned from `https://github.com/suzyglamsw-cmyk/Here-and-now` (mobile/ folder copied to `/app/frontend`).
- Yarn install succeeded (added `@babel/core`, `@expo/ngrok`).
- Expo Metro bundler running stable; tunnel connected.
- Android bundle `index.bundle?platform=android` compiled cleanly — **10.9 MB JS bundle generated, all screens (Login/Register/Discover/etc.) present**.
- Production backend at `https://spontaneous-venue.preview.emergentagent.com` is reachable (`/api/countries` returns valid JSON).

## Known Warnings (non-blocking)
Several Expo SDK 54 dependency version mismatches were reported (e.g., `expo-camera@55` vs expected `~17.0.10`, `react-native-reanimated@4.3.0` vs `~4.1.1`). These did **not** prevent the Android bundle from compiling. Update with `npx expo install --check` if you hit runtime issues on device.

## Next Action Items
1. Click the **Publish** button (top-right in the Emergent UI) → choose **Android** → APK profile.
2. Once the APK is generated, install on a physical Android device and verify Login/Register against the production backend.
3. (Optional) Run `npx expo install --check` inside `/app/frontend` to align dependencies with SDK 54 if any runtime issues appear.
