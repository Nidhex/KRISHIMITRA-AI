import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
  RefreshControl,
} from 'react-native';
import { AppHeader } from '../../../../components/AppHeader';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { NetworkStatusBadge } from '../../../../components/NetworkStatusBadge';
import { Card } from '../../../../components/Card';
import { PrimaryButton } from '../../../../components/PrimaryButton';
import { SecondaryButton } from '../../../../components/SecondaryButton';
import { LoadingIndicator } from '../../../../components/LoadingIndicator';
import { EmptyState } from '../../../../components/EmptyState';
import { ErrorState } from '../../../../components/ErrorState';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize } from '../../../../constants/theme';
import { apiClient } from '../../../../services/apiClient';
import { cacheService } from '../../../../services/cacheService';
import { storageService } from '../../../../services/storageService';
import { networkService } from '../../../../services/networkService';
import { getTranslation } from '../../../../i18n/languages';
import { SchemeItem, SchemesResponseData } from '../../../../types/api.types';

export default function SchemesScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedScheme, setSelectedScheme] = useState<SchemeItem | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [cachedTime, setCachedTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lang, setLang] = useState<string>('hi');

  const fetchSchemes = useCallback(
    async (query: string = '', forceRefresh: boolean = false) => {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      setErrorMsg(null);

      const netState = networkService.getState();
      const offline = !netState.isDeviceConnected || !netState.isBackendReachable;
      setIsOffline(offline);

      if (offline) {
        // Load from storage cache
        const cached = await cacheService.getSchemesCache();
        if (cached && cached.data && cached.data.schemes) {
          let list = cached.data.schemes;
          if (query.trim()) {
            const q = query.toLowerCase().trim();
            list = list.filter(
              (s: SchemeItem) =>
                s.title.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                (s.category && s.category.toLowerCase().includes(q))
            );
          }
          setSchemes(list);
          setCachedTime(cached.timestamp);
        } else {
          setErrorMsg('सरकारी योजनाएं लोड करने के लिए नेटवर्क कनेक्शन आवश्यक है।');
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        const res: SchemesResponseData = await apiClient.getSchemes(query, '', lang);
        if (res.success && res.schemes) {
          setSchemes(res.schemes);
          setCachedTime(null);
          await cacheService.saveSchemesCache(res);
        } else {
          setErrorMsg('योजना सूची प्राप्त करने में विफलता।');
        }
      } catch (err: any) {
        setErrorMsg('सरकारी योजनाएं लोड नहीं हो सकीं।');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lang]
  );

  useEffect(() => {
    storageService.getLanguage().then(setLang);
    fetchSchemes('', false);
  }, [fetchSchemes]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    fetchSchemes(text, false);
  };

  const onRefresh = () => {
    fetchSchemes(searchQuery, true);
  };

  // Extract unique categories dynamically from API items
  const categories = ['ALL', ...Array.from(new Set(schemes.map((s: SchemeItem) => s.category).filter(Boolean))) as string[]];

  const filteredSchemes = schemes.filter(s => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleOpenOfficialUrl = (url?: string | null) => {
    if (!url) return;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(url).catch(() => {});
        }
      })
      .catch(() => {});
  };

  return (
    <View style={styles.flexOne}>
      <AppHeader title={getTranslation(lang, 'schemesTitle')} subtitle="PM-KISAN, Subsidies & Benefits" />
      <NetworkStatusBadge />

      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            accessibilityLabel="Refresh government schemes"
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
                placeholder={getTranslation(lang, 'schemesSearchPlaceholder')}
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                accessibilityLabel="Search government scheme keyword"
                accessibilityRole="search"
              />
            </View>
          </Card>

          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, selectedCategory === cat && styles.filterPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  accessibilityLabel={`Filter schemes by ${cat}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                    {cat === 'ALL' ? getTranslation(lang, 'allCategories') : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Offline Cached Banner */}
          {isOffline && cachedTime && (
            <View style={styles.cachedBanner}>
              <Text style={styles.cachedBannerText}>
                📶 {getTranslation(lang, 'offlineCachedBanner')} ({new Date(cachedTime).toLocaleTimeString()})
              </Text>
            </View>
          )}

          {/* Loading */}
          {loading && !refreshing && <LoadingIndicator message="योजनाएं लोड हो रही हैं..." />}

          {/* Error */}
          {errorMsg && !loading && (
            <ErrorState title="त्रुटि" message={errorMsg} onRetry={onRefresh} />
          )}

          {/* Empty State */}
          {!loading && filteredSchemes.length === 0 && (
            <EmptyState
              title="कोई योजना नहीं मिली"
              description="कृपया अन्य कीवर्ड खोजें या श्रेणी बदलें।"
            />
          )}

          {/* Schemes List */}
          {!loading &&
            filteredSchemes.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedScheme(item)}
                activeOpacity={0.85}
                accessibilityLabel={`View details for scheme ${item.title}`}
                accessibilityRole="button"
              >
                <Card style={styles.schemeCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.schemeTitle}>{item.title}</Text>
                    {item.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.schemeDesc} numberOfLines={3}>
                    {item.description}
                  </Text>

                  {item.benefit && (
                    <Text style={styles.benefitSummary}>
                      🎁 {getTranslation(lang, 'benefits')}: {item.benefit}
                    </Text>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.tapDetailsText}>विवरण देखें (Tap for details) ➔</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
        </ScreenContainer>
      </ScrollView>

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <Modal
          visible={!!selectedScheme}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedScheme(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <Text style={styles.modalEmoji}>🏛</Text>
                <Text style={styles.modalTitle}>{selectedScheme.title}</Text>

                {selectedScheme.category && (
                  <View style={styles.modalCategoryBadge}>
                    <Text style={styles.modalCategoryText}>{selectedScheme.category}</Text>
                  </View>
                )}

                <Text style={styles.modalSectionTitle}>विवरण (Description)</Text>
                <Text style={styles.modalBody}>{selectedScheme.description}</Text>

                {selectedScheme.eligibility && (
                  <>
                    <Text style={styles.modalSectionTitle}>{getTranslation(lang, 'eligibility')}</Text>
                    <Text style={styles.modalBody}>{selectedScheme.eligibility}</Text>
                  </>
                )}

                {selectedScheme.benefit && (
                  <>
                    <Text style={styles.modalSectionTitle}>{getTranslation(lang, 'benefits')}</Text>
                    <Text style={styles.modalBody}>{selectedScheme.benefit}</Text>
                  </>
                )}

                {selectedScheme.deadline && (
                  <>
                    <Text style={styles.modalSectionTitle}>आवेदन अंतिम तिथि (Deadline)</Text>
                    <Text style={styles.modalBody}>📅 {selectedScheme.deadline}</Text>
                  </>
                )}

                {selectedScheme.applyAt && (
                  <View style={styles.applyBtnContainer}>
                    <PrimaryButton
                      title={getTranslation(lang, 'applyOnline')}
                      onPress={() => handleOpenOfficialUrl(selectedScheme.applyAt)}
                    />
                  </View>
                )}

                <View style={styles.closeBtnContainer}>
                  <SecondaryButton title="बंद करें (Close)" onPress={() => setSelectedScheme(null)} />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  schemeCard: {
    backgroundColor: '#F3E5F5',
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  schemeTitle: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  categoryBadge: {
    backgroundColor: '#E1BEE7',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  categoryText: {
    fontSize: 10,
    color: '#4A148C',
    fontWeight: Typography.fontWeight.bold,
  },
  schemeDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  benefitSummary: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  tapDetailsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    padding: Spacing.lg,
  },
  modalScroll: {
    paddingBottom: Spacing.xl,
  },
  modalEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalCategoryBadge: {
    alignSelf: 'center',
    backgroundColor: '#E1BEE7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  modalCategoryText: {
    fontSize: Typography.fontSize.xs,
    color: '#4A148C',
    fontWeight: Typography.fontWeight.bold,
  },
  modalSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  modalBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  applyBtnContainer: {
    marginTop: Spacing.lg,
  },
  closeBtnContainer: {
    marginTop: Spacing.sm,
  },
});
