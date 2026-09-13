/* ==========================================================================
   KrishiMitra AI — NetworkStatusBadge Component
   Top bar indicating ONLINE / OFFLINE / RECONNECTING connectivity.
   ========================================================================== */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { networkService, NetworkState } from '../services/networkService';

export const NetworkStatusBadge: React.FC = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(networkService.getState());

  useEffect(() => {
    const unsubscribe = networkService.subscribe(setNetworkState);
    return () => unsubscribe();
  }, []);

  // When online or actively checking, don't show an intrusive offline banner
  if (networkState.status === 'ONLINE' || networkState.status === 'CHECKING') {
    if (networkState.isDeviceConnected && !networkState.isBackendReachable) {
      // Backend temporarily slow/cold starting while device is connected
      return (
        <View style={[styles.badge, styles.reconnectingBadge]} accessibilityRole="text">
          <Text style={styles.reconnectingText}>
            ⚡ बैकएंड कनेक्ट हो रहा है... (Connecting to server...)
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <View style={[styles.badge, styles.offlineBadge]} accessibilityRole="text">
      <Text style={styles.offlineText}>
        📡 ऑफ़लाइन मोड — लोकल ज्ञान उपलब्ध (Offline Mode active)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBadge: {
    backgroundColor: '#FFF3E0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  reconnectingBadge: {
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  offlineText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: '#E65100',
  },
  reconnectingText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: '#2E7D32',
  },
});
