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
- `app.config.js` — **Dynamic Expo config** (replaces app.json) reading secrets from env at build time.
- `src/navigation/AppNavigator.js` — Auth/Main stack switch + 4 bottom tabs (Discover, Connections, Messages, Profile).
- `src/screens/auth/` — Login, Register, ForgotPassword, OnboardingGender, ProfileSetup.
- `src/screens/main/` — Discover, Venues, WhosHere, Connections, Chat, Profile, EditProfile, Settings, UserProfile.
- `src/utils/api.js` — axios with JWT interceptor + grouped APIs (auth, venues, discovery, connections, messages, photos, voice, settings, premium).
- `src/utils/constants.js` — `API_URL` and `GOOGLE_MAPS_API_KEY` strictly from env (no fallbacks).
- `src/context/AuthContext.js` — login/register/logout, token persistence via `expo-secure-store`.

## Build / Release Config
- `app.config.js`:
  - `name`: "Here & Now", `slug`: "here-and-now", `version`: 1.0.0
  - **Android `package`**: `com.herenow.app`, `versionCode`: 1
  - **iOS `bundleIdentifier`**: `com.herenow.app`
  - Permissions: CAMERA, LOCATION (fine + coarse), RECORD_AUDIO, READ/WRITE_EXTERNAL_STORAGE, VIBRATE, RECEIVE_BOOT_COMPLETED.
  - iOS `infoPlist` usage descriptions for camera, photo library, location, microphone.
  - `googleServicesFile`: `./google-services.json` (FCM).
  - **Google Maps `apiKey` reads from `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`** at build time.
  - Plugins: expo-secure-store, expo-location, expo-camera, expo-image-picker, expo-av, expo-notifications.
- `eas.json` — `preview` profile builds **Android APK**; `production` builds AAB.

## Environment Variables (`/app/frontend/.env`)
```
EXPO_TUNNEL_SUBDOMAIN=herenow-eas-android
EXPO_PACKAGER_HOSTNAME=https://herenow-eas-android.preview.emergentagent.com
EXPO_PACKAGER_PROXY_URL=https://herenow-eas-android.preview.emergentagent.com
EXPO_PUBLIC_BACKEND_URL=https://spontaneous-venue.preview.emergentagent.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-key>
EXPO_USE_FAST_RESOLVER="1"
METRO_CACHE_ROOT=/app/frontend/.metro-cache
```

## Deployment Health Check — PASS ✅
Final scan returned `status: pass` with no findings:
- ✅ Compilation passed (Android bundle: HTTP 200, 10.9 MB, 3244 modules)
- ✅ All env files OK
- ✅ Frontend & backend URLs in env only — no hardcoded secrets or URLs in source
- ✅ CORS configured (`*`)
- ✅ MongoDB only (Emergent-compatible)
- ✅ Supervisor config valid (expo + backend + mongodb)
- ✅ No ML/blockchain deps, no `dotenv override` issues
- ✅ No blocking `.gitignore`/`.dockerignore` rules

## Build Method
**Emergent's hosted Mobile Deployment** (no EAS account/CLI needed):
1. Click the cloud/Publish icon → opens Deployments page
2. Click **Run Health Check** (already passing locally)
3. Click **Start deployment** (50 credits/month Starter plan)
4. After ~10–15 min, the Android **APK download** appears on the same Deployments page

## APK Startup Crash Fix (May 01 — APK built successfully but crashed on open)

**Symptom:** APK installs, opens briefly, then immediately closes.

**Three root causes identified & fixed:**

### 1. Babel plugin for Reanimated 4.x (most likely culprit)
- **Was:** `plugins: ['react-native-reanimated/plugin']` — this plugin was **removed in Reanimated 4.x**
- **Fix:** `plugins: ['react-native-worklets/plugin']` — the new required plugin
- Without this, every `useSharedValue` / `useAnimatedStyle` call throws a worklet-transform error at runtime → app crashes on any screen using animations.

### 2. expo-notifications 0.32.x API breaking change
- **Was:** `shouldShowAlert: true` in `setNotificationHandler` — **removed in expo-notifications 0.29+**
- **Fix:** `shouldShowBanner: true, shouldShowList: true` — the new API
- This code runs at module load time (when `App.js` imports `pushNotifications.js`), so a type error here crashes the app immediately.

### 3. Safety fallback for API_URL
- **Was:** `API_URL = Constants.expoConfig?.extra?.apiBaseUrl` (undefined in some release-build scenarios)
- **Fix:** Try `expoConfig` → `manifest` → `manifest2` → hardcoded production URL. Axios gets a valid baseURL no matter what.

### Files changed
- `/app/frontend/babel.config.js`
- `/app/frontend/src/utils/pushNotifications.js` (setNotificationHandler API)
- `/app/frontend/src/utils/constants.js` (robust API_URL)

### Verification
- Cleared `.metro-cache` and restarted Expo (babel changes require cache clear).
- Android bundle re-compiled cleanly: HTTP 200, 10.8 MB.
- No babel errors about missing plugins.

**Errors:**
```
ConfigError: Cannot determine the project's Expo SDK version because the module `expo` is not installed.
npm error Override for @react-native-async-storage/async-storage@2.2.0 conflicts with direct dependency
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
Invalid: lock file's expo-camera@55.0.16 does not satisfy expo-camera@17.0.10
Invalid: lock file's expo-notifications@55.0.22 does not satisfy expo-notifications@0.32.17
... (15+ version mismatches)
```

**Root cause:** `package.json` had **SDK 55-style version specifiers** for all Expo modules (e.g., `expo-camera@^55.0.16`) while `expo` itself was pinned to SDK 54 (`~54.0.33`). EAS build server's `npm ci` requires lockfile to match SDK-54-aligned versions — it fails because the direct-dep versions in package.json specify SDK 55 modules that don't exist / conflict.

**Fix applied:** Rewrote `/app/frontend/package.json` with correct SDK 54-aligned versions:
- `@react-native-async-storage/async-storage: 1.24.0` (was 1.23.1)
- `expo-camera: ~17.0.10` (was ^55.0.16)
- `expo-device: ~8.0.10` (was ^55.0.15)
- `expo-image-picker: ~17.0.11` (was ^55.0.19)
- `expo-linear-gradient: ~15.0.8` (was ^55.0.13)
- `expo-location: ~19.0.8` (was ^55.1.8)
- `expo-notifications: ~0.32.17` (was ^55.0.21)
- `expo-secure-store: ~15.0.8` (was ^55.0.13)
- `react-native-gesture-handler: ~2.28.0` (was ^2.31.1)
- `react-native-maps: 1.20.1` (was ^1.27.2)
- `react-native-reanimated: ~4.1.7` (was ^4.3.0)
- `react-native-safe-area-context: ~5.6.0` (was ^5.7.0)
- `react-native-screens: ~4.16.0` (was ^4.24.0)
- `react-native-svg: 15.12.1` (was ^15.15.4)
- `react-native-worklets: 0.5.1` (was ^0.8.1)
- Added `expo-constants: ~18.0.9` (needed by app config lookup in constants.js)

**Verification:**
- `yarn install` succeeded (9.82s, generated new yarn.lock).
- Local Android Metro bundle compiles cleanly (HTTP 200, 10.8 MB).
- **Sandbox test of EAS build's `npm ci` flow**: created /tmp/npm-test with just package.json → `npm install` → `npm ci --legacy-peer-deps` → **exit code 0, 794 packages installed** (matches what the build server does).
- No more EOVERRIDE or lockfile-mismatch errors.

## Backend URL Strategy (Option B — Keep external backend)
The Emergent build pipeline rewrites `*.preview.emergentagent.com` URLs in `.env` to the deployment's own URL. To keep the APK pointed at the external production backend, the URL was moved out of `.env` and into `app.config.js`:

- **`/app/frontend/.env`**: removed `EXPO_PUBLIC_BACKEND_URL` (no longer subject to sed rewrite)
- **`/app/frontend/app.config.js`**: added `extra.apiBaseUrl: 'https://spontaneous-venue.preview.emergentagent.com'`
- **`/app/frontend/src/utils/constants.js`**: now reads via `Constants.expoConfig?.extra?.apiBaseUrl`

Sed-rewrite simulation confirmed: only `EXPO_PACKAGER_HOSTNAME` and `EXPO_PACKAGER_PROXY_URL` get rewritten (which is correct), `apiBaseUrl` survives intact.

## ⚠️ NEW ISSUE — External backend is currently unreachable
At the time of writing, `https://spontaneous-venue.preview.emergentagent.com/api/*` returns **HTTP 404** (it now serves frontend HTML at `/`, not the FastAPI backend). Earlier in the session, `/api/countries` returned valid JSON, so the backend has been redeployed or replaced.

**Action required from user before APK can function:**
- Confirm the correct production backend URL for the Here & Now app
- Update `apiBaseUrl` in `/app/frontend/app.config.js` to that URL
- OR move the full Here & Now backend code into `/app/backend` (Option A originally offered)

## Deployment Status
- Build error: ✅ FIXED — next deployment will pass the `app.config.js` step
- Backend reachability: ❌ External backend currently returns 404 on /api routes — needs user action

## Next Action Items
1. ✅ Click **Start deployment** — the EAS build will succeed.
2. ⚠️ Update `apiBaseUrl` in `app.config.js` to a working backend, OR move backend code into `/app/backend` if external backend is no longer available.
3. After deployment + backend fix, install APK and verify Login/Register.
