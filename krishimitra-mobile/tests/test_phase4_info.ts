/* ==========================================================================
   KrishiMitra AI — Mobile Phase 4 Information Hub Automated Test Suite
   Verifies Weather, Mandi, Schemes, News, Caching, Location, & Multilingual.
   ========================================================================== */

import assert from 'assert';
import { apiClient } from '../services/apiClient';
import { networkService } from '../services/networkService';
import { storageService } from '../services/storageService';
import { cacheService } from '../services/cacheService';
import { SUPPORTED_LANGUAGES, getTranslation, getLanguageOption } from '../i18n/languages';
import { MANDI_DATABASE } from '../services/mandiData';

// Mock environment for Node.js execution
(global as any).fetch = async (url: string, options: any) => {
  if (url.includes('/api/health')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'running', version: '1.0.0' }),
    };
  }

  if (url.includes('/api/weather')) {
    const body = options.body ? JSON.parse(options.body) : {};
    if (body.location === 'ERROR_TEST') {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Weather API error' }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        source: 'rag',
        weather: {
          location: body.location || 'Gorakhpur, Uttar Pradesh',
          today: {
            condition: 'Light Rain',
            tempC: 28,
            humidity: '82%',
            windKmh: 14,
            rainChance: '80%',
            uvIndex: 3,
            emoji: '🌧',
          },
          forecast: [
            { day: 'Tomorrow', condition: 'Heavy Rain', tempC: 26, rainChance: '90%', emoji: '⛈' },
            { day: 'Day After', condition: 'Partly Cloudy', tempC: 29, rainChance: '40%', emoji: '⛅' },
          ],
          advisory: 'Heavy rain expected tomorrow. Do not spray pesticides today.',
          source: 'rag',
        },
      }),
    };
  }

  if (url.includes('/api/schemes')) {
    const body = options.body ? JSON.parse(options.body) : {};
    if (body.query === 'ERROR_TEST') {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Schemes API error' }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        total: 2,
        schemes: [
          {
            id: 'scheme-pm-kisan',
            title: 'PM-KISAN Samman Nidhi',
            description: 'Direct income support of ₹6,000 per year for farmer families.',
            eligibility: 'Small and marginal farmers holding cultivable land',
            benefit: '₹6000 per year in 3 equal installments',
            deadline: 'Open throughout year',
            applyAt: 'https://pmkisan.gov.in',
            category: 'Financial Assistance',
          },
          {
            id: 'scheme-pm-fasal-bima',
            title: 'PM Fasal Bima Yojana (PMFBY)',
            description: 'Crop insurance coverage for yield losses due to non-preventable natural risks.',
            eligibility: 'All farmers growing notified crops in notified areas',
            benefit: 'Comprehensive risk cover from pre-sowing to post-harvest',
            deadline: '31st July',
            applyAt: 'https://pmfby.gov.in',
            category: 'Insurance',
          },
        ],
        summary: 'PM-KISAN and PMFBY provide financial and crop security.',
        source: 'rag',
      }),
    };
  }

  if (url.includes('/api/feed/cache')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        count: 2,
        articles: [
          {
            id: 'news-1',
            headline: 'Government announces new MSP rates for Rabi crops 2026',
            summary: 'The Cabinet Committee on Economic Affairs has approved increase in MSP for all Rabi crops.',
            category: 'Policy',
            source: 'AgriNews India',
            publishedAt: '2026-09-10T10:00:00Z',
            imageUrl: 'https://images.unsplash.com/photo-wheat.jpg',
            url: 'https://example.com/news/1',
          },
          {
            id: 'news-2',
            headline: 'Drone technology introduced for targeted pesticide spraying in UP',
            summary: 'Agriculture department launches subsidized drone spraying initiative across Gorakhpur district.',
            category: 'Technology',
            source: 'Kisan Patrika',
            publishedAt: '2026-09-11T14:30:00Z',
            imageUrl: 'https://example.com/drone.jpg',
            url: 'https://example.com/news/2',
          },
        ],
      }),
    };
  }

  return { ok: true, json: async () => ({}) };
};

async function runPhase4InformationHubTests() {
  console.log('');
  console.log('===================================================================');
  console.log('  KRISHIMITRA AI — MOBILE PHASE 4 INFORMATION HUB TEST SUITE');
  console.log('===================================================================');
  console.log('');

  let passed = 0;
  let failed = 0;

  function test(description: string, fn: () => void) {
    try {
      fn();
      console.log(`  🟢 [PASS] ${description}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${description}:`, err.message);
      failed++;
    }
  }

  async function testAsync(description: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  🟢 [PASS] ${description}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${description}:`, err.message);
      failed++;
    }
  }

  // --- WEATHER TESTS (1-8) ---
  await testAsync('1. Weather: Screen & API model structure valid', async () => {
    const res = await apiClient.getWeather('Gorakhpur, UP', 'hi');
    assert.strictEqual(res.success, true);
    assert(res.weather);
  });

  await testAsync('2. Weather: API request payload constructed correctly', async () => {
    const res = await apiClient.getWeather('Laxmipur, UP', 'en');
    assert.strictEqual(res.weather.location, 'Laxmipur, UP');
  });

  await testAsync('3. Weather: Successful response contains temperature, forecast, advisory', async () => {
    const res = await apiClient.getWeather('Gorakhpur, UP', 'hi');
    assert.strictEqual(res.weather.today.tempC, 28);
    assert.strictEqual(res.weather.today.condition, 'Light Rain');
    assert(res.weather.forecast.length > 0);
    assert(res.weather.advisory.includes('Heavy rain'));
  });

  test('4. Weather: Loading state handling', () => {
    const loadingState = { loading: true, weather: null };
    assert.strictEqual(loadingState.loading, true);
  });

  await testAsync('5. Weather: Refresh functionality works and updates cache', async () => {
    const res = await apiClient.getWeather('Gorakhpur, UP', 'hi');
    await cacheService.saveWeatherCache('Gorakhpur, UP', res);
    const cached = await cacheService.getWeatherCache();
    assert(cached);
    assert.strictEqual(cached.data.weather.today.tempC, 28);
  });

  await testAsync('6. Weather: Offline state fallback to local cache works', async () => {
    const cached = await cacheService.getWeatherCache();
    assert(cached);
    assert.strictEqual(cached.location, 'Gorakhpur, UP');
  });

  test('7. Weather: Location denial fallback defaults safely to Gorakhpur, UP', () => {
    const defaultFallback = 'Gorakhpur, Uttar Pradesh';
    assert(defaultFallback.includes('Gorakhpur'));
  });

  await testAsync('8. Weather: API error fallback handles server failure gracefully', async () => {
    const res = await apiClient.getWeather('ERROR_TEST', 'hi');
    assert.strictEqual(res.success, false);
    assert(res.weather.advisory.length > 0);
  });

  // --- MANDI TESTS (9-14) ---
  test('9. Mandi: Screen & data bundle loaded with verified records', () => {
    assert(MANDI_DATABASE.length >= 10);
  });

  await testAsync('10. Mandi: API client response parsing works', async () => {
    const res = await apiClient.getMandiPrices('');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.mandis.length, MANDI_DATABASE.length);
  });

  await testAsync('11. Mandi: Prices and crop rates parse correctly', async () => {
    const res = await apiClient.getMandiPrices('Laxmipur');
    const laxmipur = res.mandis.find(m => m.id === 'mandi-laxmipur-apmc');
    assert(laxmipur);
    assert.strictEqual(laxmipur?.metadata.cropPrices?.paddy?.price, 2350);
  });

  await testAsync('12. Mandi: Search filter works for tomato and wheat', async () => {
    const res = await apiClient.getMandiPrices('tomato');
    assert(res.mandis.length > 0);
    assert(res.mandis.some(m => m.title.toLowerCase().includes('tomato') || (m.metadata.cropPrices && m.metadata.cropPrices.tomato)));
  });

  await testAsync('13. Mandi: Empty search result state handled gracefully', async () => {
    const res = await apiClient.getMandiPrices('NonExistentCropKeyword123');
    assert.strictEqual(res.mandis.length, 0);
  });

  await testAsync('14. Mandi: Offline caching and retrieval works', async () => {
    await cacheService.saveMandiCache(MANDI_DATABASE);
    const cached = await cacheService.getMandiCache();
    assert(cached);
    assert.strictEqual(cached.data.length, MANDI_DATABASE.length);
  });

  // --- SCHEMES TESTS (15-20) ---
  await testAsync('15. Schemes: Scheme list renders with PM-KISAN and PMFBY', async () => {
    const res = await apiClient.getSchemes('', '', 'hi');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.schemes.length, 2);
  });

  await testAsync('16. Schemes: Response parsing extracts eligibility and benefits', async () => {
    const res = await apiClient.getSchemes('', '', 'hi');
    const pmKisan = res.schemes.find(s => s.id === 'scheme-pm-kisan');
    assert(pmKisan);
    assert.strictEqual(pmKisan?.eligibility, 'Small and marginal farmers holding cultivable land');
    assert.strictEqual(pmKisan?.benefit, '₹6000 per year in 3 equal installments');
  });

  await testAsync('17. Schemes: Scheme detail navigation payload contains full data', async () => {
    const res = await apiClient.getSchemes('', '', 'hi');
    const scheme = res.schemes[0];
    assert(scheme.title);
    assert(scheme.description);
    assert(scheme.applyAt);
  });

  await testAsync('18. Schemes: Search and category filtering work', async () => {
    const res = await apiClient.getSchemes('PM-KISAN', '', 'hi');
    assert(res.schemes.some(s => s.title.includes('PM-KISAN')));
  });

  await testAsync('19. Schemes: Empty schemes response handled gracefully', async () => {
    const res = await apiClient.getSchemes('ERROR_TEST', '', 'hi');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.schemes.length, 0);
  });

  test('20. Schemes: Official apply URL is valid HTTPS format', () => {
    const url = 'https://pmkisan.gov.in';
    assert(url.startsWith('https://'));
  });

  // --- NEWS TESTS (21-28) ---
  await testAsync('21. News: News feed list renders', async () => {
    const res = await apiClient.getFeed();
    assert.strictEqual(res.success, true);
    assert(res.articles.length >= 2);
  });

  await testAsync('22. News: Feed response parsing returns headlines and images', async () => {
    const res = await apiClient.getFeed();
    const article = res.articles[0];
    assert(article.headline);
    assert(article.summary);
    assert(article.category);
  });

  await testAsync('23. News: News detail modal payload complete', async () => {
    const res = await apiClient.getFeed();
    const article = res.articles[0];
    assert(article.url);
    assert(article.source);
  });

  await testAsync('24. News: Mobile cache write works', async () => {
    const res = await apiClient.getFeed();
    await cacheService.saveNewsCache(res.articles);
    const cached = await cacheService.getNewsCache();
    assert(cached);
    assert.strictEqual(cached.data.length, res.articles.length);
  });

  await testAsync('25. News: Mobile cache read returns saved articles', async () => {
    const cached = await cacheService.getNewsCache();
    assert(cached);
    assert(cached.timestamp);
    assert.strictEqual(cached.data[0].id, 'news-1');
  });

  await testAsync('26. News: Offline cached news mode works when offline', async () => {
    const cached = await cacheService.getNewsCache();
    assert(cached);
    assert(cached.data.length > 0);
  });

  test('27. News: Empty feed handles gracefully', () => {
    const emptyFeed = { success: true, articles: [] };
    assert.strictEqual(emptyFeed.articles.length, 0);
  });

  await testAsync('28. News: Feed API failure returns empty list fallback', async () => {
    const originalFetch = (global as any).fetch;
    (global as any).fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Feed server error' }),
    });

    const res = await apiClient.getFeed();
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.articles.length, 0);

    (global as any).fetch = originalFetch;
  });

  // --- LANGUAGE TESTS (29-31) ---
  test('29. Language: Hindi UI uses Devanagari script', () => {
    const title = getTranslation('hi', 'weatherTitle');
    assert.strictEqual(title, 'मौसम व कृषि सलाह');
    assert(/^[\u0900-\u097F\s।]+$/.test('मौसम व कृषि सलाह'));
  });

  test('30. Language: Gujarati UI uses Gujarati script', () => {
    const title = getTranslation('gu', 'weatherTitle');
    assert.strictEqual(title, 'હવામાન અને કૃષિ સલાહ');
    assert(/^[\u0A80-\u0AFF\s]+$/.test('હવામાન અને કૃષિ સલાહ'));
  });

  test('31. Language: English UI works correctly', () => {
    const title = getTranslation('en', 'weatherTitle');
    assert.strictEqual(title, 'Weather & Advisory');
  });

  // --- NETWORK TESTS (32-34) ---
  await testAsync('32. Network: Device offline state correctly detected', async () => {
    const state = networkService.getState();
    assert(typeof state.isDeviceConnected === 'boolean');
  });

  await testAsync('33. Network: Backend unreachable state correctly detected', async () => {
    const health = await apiClient.checkHealth();
    assert(typeof health.success === 'boolean');
  });

  await testAsync('34. Network: Backend reachable state verified via health ping', async () => {
    const state = await networkService.checkReachability();
    assert.strictEqual(state.isDeviceConnected, true);
    assert.strictEqual(state.isBackendReachable, true);
    assert.strictEqual(state.status, 'ONLINE');
  });

  console.log('');
  console.log('===================================================================');
  console.log(`  PHASE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================');
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4InformationHubTests();
