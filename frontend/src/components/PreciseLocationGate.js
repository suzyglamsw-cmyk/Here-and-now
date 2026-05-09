/**
 * PreciseLocationGate
 *
 * A blocking, full-screen overlay that prevents the wrapped screen from rendering
 * until the device returns a precise GPS reading.
 *
 * Use this in any screen that depends on geolocation (Discovery, Venues, Here & Now).
 *
 * Usage:
 *   <PreciseLocationGate
 *     onLocationReady={(coords) => fetchData(coords)}
 *   >
 *     <ScreenContents />
 *   </PreciseLocationGate>
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MapPin, AlertCircle } from 'lucide-react-native';
import { getPreciseLocation, PRECISE_LOCATION_THRESHOLD_METRES } from '../utils/location';

const PreciseLocationGate = ({ children, onLocationReady, loadingText }) => {
  const [state, setState] = useState({
    loading: true,
    precise: false,
    denied: false,
    accuracy: null,
    error: null,
  });

  const requestLocation = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const result = await getPreciseLocation();

    if (result.status === 'denied') {
      setState({
        loading: false,
        precise: false,
        denied: true,
        accuracy: null,
        error: result.error,
      });
      return;
    }

    if (!result.precise) {
      setState({
        loading: false,
        precise: false,
        denied: false,
        accuracy: result.accuracyMetres,
        error: null,
      });
      return;
    }

    // Precise! Hand the coords up to the screen and unmount the gate.
    setState({
      loading: false,
      precise: true,
      denied: false,
      accuracy: result.accuracyMetres,
      error: null,
    });
    onLocationReady?.(result.coords);
  }, [onLocationReady]);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While loading the FIRST permission prompt
  if (state.loading) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="large" color="#c084fc" />
        <Text style={styles.loadingText}>
          {loadingText || 'Getting your precise location...'}
        </Text>
      </View>
    );
  }

  // Permission granted AND precise — render the wrapped screen
  if (state.precise) {
    return children;
  }

  // Block: either denied or returned approximate
  return (
    <View style={styles.gate}>
      <View style={styles.iconWrap}>
        {state.denied ? (
          <AlertCircle size={48} color="#fbbf24" />
        ) : (
          <MapPin size={48} color="#c084fc" />
        )}
      </View>

      <Text style={styles.title}>
        {state.denied
          ? 'Location access needed'
          : 'We need precise location'}
      </Text>

      <Text style={styles.body}>
        {state.denied
          ? 'Here & Now needs your precise location to find nearby venues and people. Please allow location access in your browser/device settings, then tap Try again.'
          : 'We need precise location to find nearby venues and people. Tap below to enable precise location.'}
      </Text>

      {state.accuracy != null && !state.denied ? (
        <Text style={styles.accuracyHint}>
          Current accuracy: ±{Math.round(state.accuracy)}m · need ≤ {PRECISE_LOCATION_THRESHOLD_METRES}m
        </Text>
      ) : null}

      <Pressable style={styles.primaryBtn} onPress={requestLocation}>
        <Text style={styles.primaryBtnText}>
          {state.denied ? 'Try again' : 'Enable precise location'}
        </Text>
      </Pressable>

      {Platform.OS === 'web' && !state.denied ? (
        <Text style={styles.helperWeb}>
          On the web, click the location icon in your browser's address bar
          and select "Allow precise location" if it's currently set to "Approximate".
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    color: 'rgba(196, 181, 253, 0.85)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  accuracyHint: {
    color: 'rgba(196, 181, 253, 0.55)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: '#a855f7',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    marginBottom: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  helperWeb: {
    color: 'rgba(196, 181, 253, 0.55)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  loadingText: {
    color: 'rgba(196, 181, 253, 0.7)',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default PreciseLocationGate;
