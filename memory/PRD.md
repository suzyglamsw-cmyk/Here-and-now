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

## Build Error Fix (May 01 deployment attempt)
**Error:** `[EAS_LOG] ERROR: Failed to generate app.json from app.config.js` — `JSON.stringify` returned `undefined` because `app.config.js` exported a function `({config}) => ({...})`.

**Fix:** Changed `app.config.js` to export the config **object directly** (not a function). Verified locally: `JSON.stringify(require('./app.config.js'))` produces a valid 2023-byte JSON string with `apiKey: "<env value>"` correctly substituted.

## ⚠️ KNOWN DEPLOYMENT CAVEAT — Backend URL rewrite
Emergent's build pipeline rewrites all `*.preview.emergentagent.com` URLs in `.env` to the deployment's own URL `herenow-eas-android.emergent.host`. This means:
- After deploy, the mobile APK will call `herenow-eas-android.emergent.host/api/*`
- But `/app/backend/server.py` is the **empty Emergent template** (just `/api/` + `/api/status`)
- The real Here & Now backend (auth, venues, connections, photos, etc.) is at `/tmp/here-and-now/backend/` and was NOT moved into `/app/backend`

**To make the deployed APK functional, ONE of:**
1. Replace `/app/backend` with the full Here & Now backend code from the cloned repo (`/tmp/here-and-now/backend/`). Update `requirements.txt` to add `pywebpush`, `py-vapid`, `Pillow`, `stripe`. Set up Atlas MongoDB connection string in deployed env.
2. Keep using the external backend at `spontaneous-venue.preview.emergentagent.com` — but this requires preventing the sed rewrite (e.g., via `app.config.js` `extra` field or `EXPO_PUBLIC_API_BASE` with a non-emergentagent.com hostname).

## Next Action Items
1. Click **Start deployment** again — the EAS step will now succeed.
2. Decide on backend strategy (move backend OR keep external) — see caveat above.
3. After deployment succeeds, install APK on Android device and verify Login/Register.
