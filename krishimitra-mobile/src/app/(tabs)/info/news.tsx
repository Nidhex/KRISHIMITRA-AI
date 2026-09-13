import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  RefreshControl,
  Image,
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
import { FeedArticle, FeedResponseData } from '../../../../types/api.types';

export default function NewsScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<FeedArticle | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [cachedTime, setCachedTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lang, setLang] = useState<string>('hi');

  const fetchNews = useCallback(async (forceRefresh: boolean = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    setErrorMsg(null);

    const netState = networkService.getState();
    const offline = !netState.isDeviceConnected;
    setIsOffline(offline);

    if (offline) {
      // Load from local storage cache
      const cached = await cacheService.getNewsCache();
      if (cached && cached.data && cached.data.length > 0) {
        setArticles(cached.data);
        setCachedTime(cached.timestamp);
      } else {
        setErrorMsg('कृषि समाचार लोड करने के लिए इंटरनेट आवश्यक है। (Offline — no news cache available)');
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res: FeedResponseData = await apiClient.getFeed();
      if (res.success && res.articles && res.articles.length > 0) {
        const mappedArticles: FeedArticle[] = res.articles.map((a: any, idx: number) => ({
          id: a.id || `news_${idx}`,
          headline: a.headline || a.title || 'Agri News Update',
          summary: a.summary || a.description || '',
          category: a.category || 'General',
          source: a.source || 'AgriNews',
          publishedAt: a.publishedAt || a.publishedDate || a.date || new Date().toISOString(),
          imageUrl: a.imageUrl || a.image || undefined,
          url: a.url || a.readMoreURL || a.sourceUrl || undefined,
        }));
        setArticles(mappedArticles);
        setCachedTime(null);
        // Save to mobile cache
        await cacheService.saveNewsCache(mappedArticles);
      } else {
        // Fallback to cache if API returns empty
        const cached = await cacheService.getNewsCache();
        if (cached && cached.data && cached.data.length > 0) {
          setArticles(cached.data);
          setCachedTime(cached.timestamp);
        } else {
          setErrorMsg('समाचार फ़ीड लोड नहीं हो सकी।');
        }
      }
    } catch (err: any) {
      setErrorMsg('कृषि समाचार लोड करने में असमर्थ।');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    storageService.getLanguage().then(setLang);
    fetchNews(false);
  }, [fetchNews]);

  const onRefresh = () => {
    fetchNews(true);
  };

  // Unique news categories
  const categories = ['ALL', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean))) as string[]];

  const filteredArticles = articles.filter(a => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleOpenArticleUrl = (url?: string) => {
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
      <AppHeader title={getTranslation(lang, 'newsTitle')} subtitle="Farming News, Tech & Market Updates" />
      <NetworkStatusBadge />

      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            accessibilityLabel="Refresh agri news feed"
          />
        }
      >
        <ScreenContainer>
          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, selectedCategory === cat && styles.filterPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  accessibilityLabel={`Filter news by ${cat}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                    {cat === 'ALL' ? getTranslation(lang, 'allNews') : cat}
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
          {loading && !refreshing && <LoadingIndicator message="कृषि समाचार लोड हो रहे हैं..." />}

          {/* Error */}
          {errorMsg && !loading && (
            <ErrorState title="त्रुटि" message={errorMsg} onRetry={onRefresh} />
          )}

          {/* Empty State */}
          {!loading && filteredArticles.length === 0 && (
            <EmptyState
              title="कोई समाचार नहीं मिला"
              description="फ़ीड को ताज़ा करने के लिए नीचे खींचें।"
            />
          )}

          {/* News List */}
          {!loading &&
            filteredArticles.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedArticle(item)}
                activeOpacity={0.85}
                accessibilityLabel={`Read article ${item.headline}`}
                accessibilityRole="button"
              >
                <Card style={styles.newsCard}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.newsImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.newsImagePlaceholder}>
                      <Text style={styles.placeholderEmoji}>📰</Text>
                    </View>
                  )}

                  <View style={styles.cardContent}>
                    <View style={styles.metaRow}>
                      {item.category && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                      )}
                      <Text style={styles.sourceText}>
                        {item.source || 'AgriNews'} • {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Today'}
                      </Text>
                    </View>

                    <Text style={styles.headline}>{item.headline}</Text>
                    <Text style={styles.summary} numberOfLines={2}>
                      {item.summary}
                    </Text>

                    <Text style={styles.readMore}>पूरा समाचार पढ़ें ➔</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
        </ScreenContainer>
      </ScrollView>

      {/* News Article Detail Modal */}
      {selectedArticle && (
        <Modal
          visible={!!selectedArticle}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedArticle(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView contentContainerStyle={styles.modalScroll}>
                {selectedArticle.imageUrl ? (
                  <Image source={{ uri: selectedArticle.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Text style={styles.modalPlaceholderEmoji}>📰</Text>
                  </View>
                )}

                <View style={styles.modalMetaRow}>
                  {selectedArticle.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{selectedArticle.category}</Text>
                    </View>
                  )}
                  <Text style={styles.sourceText}>
                    {selectedArticle.source} • {selectedArticle.publishedAt ? new Date(selectedArticle.publishedAt).toLocaleDateString() : ''}
                  </Text>
                </View>

                <Text style={styles.modalHeadline}>{selectedArticle.headline}</Text>
                <Text style={styles.modalBody}>{selectedArticle.summary}</Text>

                {selectedArticle.url && (
                  <View style={styles.openUrlBtnContainer}>
                    <PrimaryButton
                      title={getTranslation(lang, 'readOriginal')}
                      onPress={() => handleOpenArticleUrl(selectedArticle.url)}
                    />
                  </View>
                )}

                <View style={styles.closeBtnContainer}>
                  <SecondaryButton title="बंद करें (Close)" onPress={() => setSelectedArticle(null)} />
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
  newsCard: {
    backgroundColor: '#E8EAF6',
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 160,
  },
  newsImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#C5CAE9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  cardContent: {
    padding: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    backgroundColor: '#C5CAE9',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 10,
    color: '#1A237E',
    fontWeight: Typography.fontWeight.bold,
  },
  sourceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  headline: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  summary: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  readMore: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'right',
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
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#C5CAE9',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalPlaceholderEmoji: {
    fontSize: 48,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  modalHeadline: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  modalBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  openUrlBtnContainer: {
    marginTop: Spacing.lg,
  },
  closeBtnContainer: {
    marginTop: Spacing.sm,
  },
});
