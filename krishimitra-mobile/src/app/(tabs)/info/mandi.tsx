import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { AppHeader } from '../../../../components/AppHeader';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { NetworkStatusBadge } from '../../../../components/NetworkStatusBadge';
import { Card } from '../../../../components/Card';
import { LoadingIndicator } from '../../../../components/LoadingIndicator';
import { EmptyState } from '../../../../components/EmptyState';
import { ErrorState } from '../../../../components/ErrorState';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize } from '../../../../constants/theme';
import { apiClient } from '../../../../services/apiClient';
import { cacheService } from '../../../../services/cacheService';
import { storageService } from '../../../../services/storageService';
import { networkService } from '../../../../services/networkService';
import { getTranslation } from '../../../../i18n/languages';
import { MandiItem } from '../../../../types/info.types';

export default function MandiScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [mandis, setMandis] = useState<MandiItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [cachedTime, setCachedTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lang, setLang] = useState<string>('hi');

  const fetchMandiData = useCallback(async (query: string = '', forceRefresh: boolean = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    const netState = networkService.getState();
    const offline = !netState.isDeviceConnected;
    setIsOffline(offline);

    if (offline) {
      // Load from offline storage cache
      const cached = await cacheService.getMandiCache();
      if (cached && cached.data && cached.data.length > 0) {
        let list = cached.data;
        if (query.trim()) {
          const q = query.toLowerCase().trim();
          list = list.filter(item => 
            item.title.toLowerCase().includes(q) || 
            (item.title_hi && item.title_hi.toLowerCase().includes(q)) ||
            (item.metadata.cropPrices && Object.keys(item.metadata.cropPrices).some(c => c.toLowerCase().includes(q)))
          );
        }
        setMandis(list);
        setCachedTime(cached.timestamp);
      } else {
        // Fallback to apiClient mandi prices
        const res = await apiClient.getMandiPrices(query);
        setMandis(res.mandis || []);
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await apiClient.getMandiPrices(query);
      if (res.success && res.mandis) {
        setMandis(res.mandis);
        setCachedTime(null);
        await cacheService.saveMandiCache(res.mandis);
      } else {
        setErrorMsg('मंडी भाव लोड नहीं हो सके।');
      }
    } catch (err: any) {
      setErrorMsg('मंडी डेटा सर्वर त्रुटि।');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    storageService.getLanguage().then(setLang);
    fetchMandiData('', false);
  }, [fetchMandiData]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    fetchMandiData(text, false);
  };

  const onRefresh = () => {
    fetchMandiData(searchQuery, true);
  };

  const filteredMandis = mandis.filter(m => {
    if (selectedFilter === 'APMC') return m.metadata.type === 'Government APMC';
    if (selectedFilter === 'LOCAL') return m.metadata.type === 'Local Mandi';
    if (selectedFilter === 'MSP') return m.metadata.concept === 'MSP (Minimum Support Price)';
    return true;
  });

  const renderTrendBadge = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <Text style={[styles.trendBadge, styles.trendUp]}>📈 UP</Text>;
    if (trend === 'down') return <Text style={[styles.trendBadge, styles.trendDown]}>📉 DOWN</Text>;
    return <Text style={[styles.trendBadge, styles.trendStable]}>➡️ STABLE</Text>;
  };

  return (
    <View style={styles.flexOne}>
      <AppHeader title={getTranslation(lang, 'mandiTitle')} subtitle="Mandi Rates, Distance & MSP Standards" />
      <NetworkStatusBadge />

      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            accessibilityLabel="Refresh mandi prices"
          />
        }
      >
        <ScreenContainer>
          {/* Search Bar */}
          <Card style={styles.searchCard}>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={getTranslation(lang, 'mandiSearchPlaceholder')}
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchChange}
                accessibilityLabel="Search crop name or market"
                accessibilityRole="search"
              />
            </View>
          </Card>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[
              { id: 'ALL', label: getTranslation(lang, 'allMandis') },
              { id: 'APMC', label: 'Government APMC' },
              { id: 'LOCAL', label: 'Local Mandi' },
              { id: 'MSP', label: 'MSP & Advisory' },
            ].map(pill => (
              <TouchableOpacity
                key={pill.id}
                style={[styles.filterPill, selectedFilter === pill.id && styles.filterPillActive]}
                onPress={() => setSelectedFilter(pill.id)}
                accessibilityLabel={`Filter by ${pill.label}`}
                accessibilityRole="button"
              >
                <Text style={[styles.filterText, selectedFilter === pill.id && styles.filterTextActive]}>
                  {pill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Data Freshness Indicator */}
          <View style={styles.freshnessNotice}>
            <Text style={styles.freshnessText}>
              ℹ️ {getTranslation(lang, 'benchmarkNotice')}
            </Text>
          </View>

          {/* Offline Cached Banner */}
          {isOffline && cachedTime && (
            <View style={styles.cachedBanner}>
              <Text style={styles.cachedBannerText}>
                📶 {getTranslation(lang, 'offlineCachedBanner')} ({new Date(cachedTime).toLocaleTimeString()})
              </Text>
            </View>
          )}

          {/* Loading */}
          {loading && !refreshing && <LoadingIndicator message="मंडी भाव लोड हो रहे हैं..." />}

          {/* Error */}
          {errorMsg && !loading && (
            <ErrorState title="मंडी डेटा लोड विफल" message={errorMsg} onRetry={onRefresh} />
          )}

          {/* Empty State */}
          {!loading && filteredMandis.length === 0 && (
            <EmptyState
              title="कोई मंडी परिणाम नहीं मिला"
              description="कृपया अन्य फसल या मंडी नाम खोजें।"
            />
          )}

          {/* Mandi Cards List */}
          {!loading &&
            filteredMandis.map(item => (
              <Card key={item.id} style={styles.mandiCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.titleCol}>
                    <Text style={styles.mandiTitle}>{lang === 'hi' && item.title_hi ? item.title_hi : item.title}</Text>
                    {item.metadata.distance && (
                      <Text style={styles.distanceBadge}>📍 दूरी: {item.metadata.distance}</Text>
                    )}
                  </View>

                  {item.metadata.type && (
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.metadata.type}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.mandiDesc}>
                  {lang === 'hi' && item.description_hi ? item.description_hi : item.description}
                </Text>

                {/* Crop Prices Table / Grid */}
                {item.metadata.cropPrices && Object.keys(item.metadata.cropPrices).length > 0 && (
                  <View style={styles.cropGrid}>
                    <Text style={styles.cropGridHeader}>ताजा फसल दरें (APMC Rates):</Text>
                    {Object.entries(item.metadata.cropPrices).map(([cropName, priceObj]) => (
                      <View key={cropName} style={styles.cropRow}>
                        <Text style={styles.cropName}>
                          🌾 {cropName.toUpperCase()}
                        </Text>
                        <Text style={styles.cropPrice}>
                          ₹{priceObj.price} {priceObj.unit || '/Qtl'}
                        </Text>
                        {renderTrendBadge(priceObj.trend)}
                      </View>
                    ))}
                  </View>
                )}

                {/* Advisory / Note */}
                {(item.metadata.advisory_hi || item.metadata.advisory) && (
                  <View style={styles.advisoryBox}>
                    <Text style={styles.advisoryHeader}>💡 सलाह (Advisory):</Text>
                    <Text style={styles.advisoryBody}>
                      {lang === 'hi' && item.metadata.advisory_hi
                        ? item.metadata.advisory_hi
                        : item.metadata.advisory}
                    </Text>
                  </View>
                )}

                {item.metadata.updatedAt && (
                  <Text style={styles.updateTime}>
                    📅 अपडेट तिथि: {item.metadata.updatedAt} (APMC Rate)
                  </Text>
                )}
              </Card>
            ))}
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
  searchCard: {
    marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: ComponentSize.minTouchTarget,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  filterScroll: {
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    height: ComponentSize.minTouchTarget,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.bold,
  },
  freshnessNotice: {
    backgroundColor: '#FFFDE7',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FFF59D',
  },
  freshnessText: {
    fontSize: Typography.fontSize.xs,
    color: '#F57F17',
    lineHeight: 18,
  },
  cachedBanner: {
    backgroundColor: '#EFEBE9',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  cachedBannerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
  },
  mandiCard: {
    backgroundColor: Colors.mandiCard,
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  titleCol: {
    flex: 1,
  },
  mandiTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  distanceBadge: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primaryDark,
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: Typography.fontWeight.bold,
  },
  mandiDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  cropGrid: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs,
  },
  cropGridHeader: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cropName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    width: '35%',
  },
  cropPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
    width: '35%',
    textAlign: 'right',
  },
  trendBadge: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
    fontWeight: Typography.fontWeight.bold,
  },
  trendUp: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  trendDown: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
  },
  trendStable: {
    backgroundColor: '#ECEFF1',
    color: '#455A64',
  },
  advisoryBox: {
    backgroundColor: '#FFF8E1',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  advisoryHeader: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#F57F17',
  },
  advisoryBody: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  updateTime: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
});
