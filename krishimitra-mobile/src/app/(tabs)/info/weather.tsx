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
import { ErrorState } from '../../../../components/ErrorState';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize } from '../../../../constants/theme';
import { apiClient } from '../../../../services/apiClient';
import { locationService, LocationResult } from '../../../../services/locationService';
import { cacheService } from '../../../../services/cacheService';
import { storageService } from '../../../../services/storageService';
import { networkService } from '../../../../services/networkService';
import { getTranslation } from '../../../../i18n/languages';
import { WeatherResponseData, WeatherData } from '../../../../types/api.types';

export default function WeatherScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState<string>('Gorakhpur, Uttar Pradesh');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<LocationResult | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [cachedTime, setCachedTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lang, setLang] = useState<string>('hi');

  const fetchWeather = useCallback(
    async (loc: string, forceRefresh: boolean = false) => {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      setErrorMsg(null);

      const netState = networkService.getState();
      const offline = !netState.isDeviceConnected || !netState.isBackendReachable;
      setIsOffline(offline);

      if (offline) {
        // Load from local storage cache
        const cached = await cacheService.getWeatherCache();
        if (cached && cached.data && cached.data.weather) {
          setWeatherData(cached.data.weather);
          setLocationName(cached.location || loc);
          setCachedTime(cached.timestamp);
        } else {
          setErrorMsg('मौसम डेटा लोड करने के लिए इंटरनेट आवश्यक है। (Internet connection required)');
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        const res: WeatherResponseData = await apiClient.getWeather(loc, lang);

        if (res.success && res.weather) {
          setWeatherData(res.weather);
          setLocationName(res.weather.location || loc);
          setCachedTime(null);
          // Save to local cache for offline reuse
          await cacheService.saveWeatherCache(res.weather.location || loc, res);
        } else {
          // Fallback to cache if API returns error
          const cached = await cacheService.getWeatherCache();
          if (cached && cached.data && cached.data.weather) {
            setWeatherData(cached.data.weather);
            setCachedTime(cached.timestamp);
          } else {
            setErrorMsg('मौसम की जानकारी लोड नहीं हो सकी। (Weather API error)');
          }
        }
      } catch (err: any) {
        setErrorMsg('मौसम डेटा प्राप्त करने में विफलता।');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lang]
  );

  const initLocationAndWeather = useCallback(async () => {
    setLoading(true);
    const userLang = await storageService.getLanguage();
    setLang(userLang);

    // Get current GPS location
    const locRes = await locationService.getCurrentLocation();
    setLocationStatus(locRes);
    const targetLoc = locRes.locationName || 'Gorakhpur, Uttar Pradesh';
    setLocationName(targetLoc);

    await fetchWeather(targetLoc, false);
  }, [fetchWeather]);

  useEffect(() => {
    initLocationAndWeather();
  }, [initLocationAndWeather]);

  const handleManualSearch = () => {
    if (searchQuery.trim().length > 0) {
      setLocationName(searchQuery.trim());
      fetchWeather(searchQuery.trim(), false);
    }
  };

  const onRefresh = () => {
    fetchWeather(locationName, true);
  };

  return (
    <View style={styles.flexOne}>
      <AppHeader title={getTranslation(lang, 'weatherTitle')} subtitle="Live Weather & Farm Advisory" />
      <NetworkStatusBadge />

      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            accessibilityLabel={getTranslation(lang, 'pullToRefresh')}
          />
        }
      >
        <ScreenContainer>
          {/* Location Permission / Manual Input Bar */}
          <Card style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationTitle}>{locationName}</Text>
            </View>

            {locationStatus && locationStatus.status !== 'GRANTED' && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ {locationStatus.userMessage || 'GPS location unavailable. Using fallback location.'}
                </Text>
              </View>
            )}

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder={getTranslation(lang, 'locationPlaceholder')}
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleManualSearch}
                accessibilityLabel="Search city or village location"
                accessibilityRole="search"
              />
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleManualSearch}
                accessibilityLabel="Search location weather"
                accessibilityRole="button"
              >
                <Text style={styles.searchBtnText}>खोजें</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Offline / Cached status banner */}
          {isOffline && cachedTime && (
            <View style={styles.cachedBanner}>
              <Text style={styles.cachedBannerText}>
                📶 {getTranslation(lang, 'offlineCachedBanner')} ({new Date(cachedTime).toLocaleTimeString()})
              </Text>
            </View>
          )}

          {/* Loading state */}
          {loading && !refreshing && <LoadingIndicator message="मौसम पूर्वानुमान लोड हो रहा है..." />}

          {/* Error State */}
          {errorMsg && !loading && (
            <ErrorState
              title="मौसम डेटा अनुपलब्ध"
              message={errorMsg}
              onRetry={() => fetchWeather(locationName, true)}
            />
          )}

          {/* Weather Content */}
          {!loading && weatherData && (
            <>
              {/* Today's Weather Hero Card */}
              <Card style={styles.todayCard}>
                <Text style={styles.weatherEmoji}>{weatherData.today?.emoji || '🌦'}</Text>
                <Text style={styles.temperature}>
                  {weatherData.today?.tempC !== undefined ? `${weatherData.today.tempC}°C` : '--'}
                </Text>
                <Text style={styles.condition}>{weatherData.today?.condition || 'Partly Cloudy'}</Text>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{getTranslation(lang, 'humidity')}</Text>
                    <Text style={styles.metricVal}>{weatherData.today?.humidity || '--'}</Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{getTranslation(lang, 'rainChance')}</Text>
                    <Text style={styles.metricVal}>{weatherData.today?.rainChance || '--'}</Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{getTranslation(lang, 'wind')}</Text>
                    <Text style={styles.metricVal}>
                      {weatherData.today?.windKmh !== undefined ? `${weatherData.today.windKmh} km/h` : '--'}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{getTranslation(lang, 'uvIndex')}</Text>
                    <Text style={styles.metricVal}>{weatherData.today?.uvIndex ?? '--'}</Text>
                  </View>
                </View>
              </Card>

              {/* 7-Day Forecast */}
              {weatherData.forecast && weatherData.forecast.length > 0 && (
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>{getTranslation(lang, 'forecastHeader')}</Text>
                  {weatherData.forecast.map((item, idx) => (
                    <View key={idx} style={styles.forecastRow}>
                      <Text style={styles.forecastDay}>{item.day}</Text>
                      <Text style={styles.forecastEmoji}>{item.emoji}</Text>
                      <Text style={styles.forecastCond}>{item.condition}</Text>
                      <Text style={styles.forecastTemp}>{item.tempC}°C</Text>
                      <Text style={styles.forecastRain}>🌧 {item.rainChance}</Text>
                    </View>
                  ))}
                </Card>
              )}

              {/* Agricultural Advisory */}
              {weatherData.advisory && (
                <Card style={styles.advisoryCard}>
                  <Text style={styles.advisoryTitle}>{getTranslation(lang, 'advisoryHeader')}</Text>
                  <Text style={styles.advisoryText}>{weatherData.advisory}</Text>
                </Card>
              )}
            </>
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
  locationCard: {
    marginBottom: Spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  locationPin: {
    fontSize: 22,
    marginRight: Spacing.xs,
  },
  locationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  warningText: {
    fontSize: Typography.fontSize.xs,
    color: '#E65100',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: ComponentSize.minTouchTarget,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  searchBtn: {
    height: ComponentSize.minTouchTarget,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.sm,
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
  todayCard: {
    alignItems: 'center',
    backgroundColor: Colors.weatherCard,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  weatherEmoji: {
    fontSize: 64,
  },
  temperature: {
    fontSize: 42,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  condition: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  metricItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  metricVal: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  forecastDay: {
    width: '25%',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  forecastEmoji: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  forecastCond: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  forecastTemp: {
    width: '18%',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
    textAlign: 'right',
  },
  forecastRain: {
    width: '20%',
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  advisoryCard: {
    backgroundColor: '#E8F5E9',
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  advisoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  advisoryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});
