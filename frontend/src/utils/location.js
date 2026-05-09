/**
 * Precise location helpers
 *
 * Browsers and devices return location with an `accuracy` value in METRES.
 * - GPS / device sensors:  ~5-50m   (precise)
 * - Wi-Fi / cell tower:    ~100-1000m (approximate)
 * - IP address only:       ~5000m+   (very approximate)
 *
 * Anything above PRECISE_LOCATION_THRESHOLD_METRES is treated as "not precise"
 * — Here & Now requires precise GPS to match users to nearby venues, so we
 * block the experience until the browser/OS returns a precise reading.
 */
import * as Location from 'expo-location';

export const PRECISE_LOCATION_THRESHOLD_METRES = 500;

/**
 * Request foreground location with the highest accuracy available, then
 * classify the result as precise / approximate / denied.
 *
 * @returns {Promise<{
 *   status: 'granted'|'denied',
 *   precise: boolean,
 *   coords: ?{latitude:number, longitude:number, accuracy:number},
 *   accuracyMetres: ?number,
 *   error: ?string,
 * }>}
 */
export const getPreciseLocation = async () => {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      return {
        status: 'denied',
        precise: false,
        coords: null,
        accuracyMetres: null,
        error: 'permission_denied',
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest, // = enableHighAccuracy:true on web
      // On Android, force a fresh fix instead of using a cached approximate one
      mayShowUserSettingsDialog: true,
    });

    const accuracyMetres = loc?.coords?.accuracy ?? null;
    const precise =
      accuracyMetres != null && accuracyMetres <= PRECISE_LOCATION_THRESHOLD_METRES;

    return {
      status: 'granted',
      precise,
      coords: loc.coords,
      accuracyMetres,
      error: null,
    };
  } catch (e) {
    return {
      status: 'denied',
      precise: false,
      coords: null,
      accuracyMetres: null,
      error: e?.message || 'location_error',
    };
  }
};
