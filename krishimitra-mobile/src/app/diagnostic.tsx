/* ==========================================================================
   KrishiMitra AI — Mobile Diagnostic Screen
   Development tool to verify mobile network, API health & backend routes.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../components/AppHeader';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { diagnosticService, DiagnosticReport } from '../../services/diagnosticService';

export default function DiagnosticScreen() {
  const router = useRouter();
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const runCheck = async () => {
    setLoading(true);
    const res = await diagnosticService.runAllDiagnostics();
    setReport(res);
    setLoading(false);
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <View style={styles.flexOne}>
      <AppHeader title="सिस्टम निदान (Diagnostics)" subtitle="Mobile Network & API Health Verification" />

      <ScrollView style={styles.flexOne} contentContainerStyle={styles.scrollContent}>
        <ScreenContainer>
          <Card style={styles.headerCard}>
            <Text style={styles.targetTitle}>🎯 Production API Target:</Text>
            <Text style={styles.targetUrl}>{report?.baseUrl || 'https://krishimitra-ai-1-4gtj.onrender.com'}</Text>
            {report && (
              <View style={[styles.statusBanner, report.overallStatus === 'PASS' ? styles.passBanner : styles.failBanner]}>
                <Text style={styles.bannerText}>
                  Overall Diagnostic Result: {report.overallStatus === 'PASS' ? '🟢 PASS' : '🔴 FAIL'}
                </Text>
              </View>
            )}
            <PrimaryButton title="🔄 दोबारा जांच करें (Run Diagnostics)" onPress={runCheck} style={styles.refreshBtn} />
          </Card>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>जांच चल रही है... (Running System Checks...)</Text>
            </View>
          ) : (
            report?.results.map((item) => (
              <Card key={item.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'PASS'
                        ? styles.passBadge
                        : item.status === 'FAIL'
                        ? styles.failBadge
                        : styles.untestedBadge,
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.categoryText}>Category: {item.category}</Text>
                <Text style={styles.detailsText}>{item.details}</Text>
                {item.latencyMs !== undefined && (
                  <Text style={styles.latencyText}>⚡ Latency: {item.latencyMs}ms</Text>
                )}
              </Card>
            ))
          )}
        </ScreenContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  targetTitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  targetUrl: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
    marginVertical: 4,
  },
  statusBanner: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs,
    alignItems: 'center',
  },
  passBanner: {
    backgroundColor: '#E8F5E9',
  },
  failBanner: {
    backgroundColor: '#FFEBEE',
  },
  bannerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  refreshBtn: {
    marginTop: Spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  resultCard: {
    marginBottom: Spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  passBadge: {
    backgroundColor: '#C8E6C9',
  },
  failBadge: {
    backgroundColor: '#FFCDD2',
  },
  untestedBadge: {
    backgroundColor: '#E0E0E0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  latencyText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: Typography.fontWeight.bold,
    marginTop: 4,
  },
});
