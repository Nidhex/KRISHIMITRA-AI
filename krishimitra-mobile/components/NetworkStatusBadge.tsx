/* ==========================================================================
   KrishiMitra AI — NetworkStatusBadge Component
   Top bar indicating ONLINE / OFFLINE / DEGRADED connectivity.
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

  if (networkState.status === 'ONLINE') {
    return null; // Don't block screen when online
  }

  const isDegraded = networkState.status === 'DEGRADED';

  return (
    <View
      style={[
        styles.badge,
        isDegraded ? styles.degradedBadge : styles.offlineBadge,
      ]}
      accessibilityRole="text"
    >
      <Text style={styles.badgeText}>
        {isDegraded
          ? '⚡ ऑफ़लाइन ज्ञान मोड (Offline Local Knowledge Ready)'
          : '📡 ऑफ़लाइन मोड — लोकल ज्ञान उपलब्ध (Offline Mode active)'}
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
  degradedBadge: {
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: '#E65100',
  },
});
