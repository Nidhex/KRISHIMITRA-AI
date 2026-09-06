/* ==========================================================================
   KrishiMitra AI — PWA Service Worker
   Provides true offline shell capability and caches AI browser model assets.
   ========================================================================== */

const CACHE_NAME_STATIC = 'krishimitra-static-v1';
const CACHE_NAME_MODELS = 'krishimitra-models-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/css/feed.css',
  '/script.js',
  '/weatherService.js',
  '/weatherAIService.js',
  '/js/api.js',
  '/js/offlineStorage.js',
  '/js/offlineStatus.js',
  '/js/offlineVision.js',
  '/js/gemmaChat.js',
  '/js/sarvamCall.js',
  '/js/newsCache.js',
  '/js/newsAI.js',
  '/js/feedService.js',
  '/js/feed.js',
  '/manifest.json',
  '/schemes.json',
  '/js/lib/tf.min.js'
];


const MODEL_ASSETS = [
  '/ai/browser-models/disease/model.json',
  '/ai/browser-models/disease/labels.json',
  '/ai/browser-models/disease/group1-shard1of3.bin',
  '/ai/browser-models/disease/group1-shard2of3.bin',
  '/ai/browser-models/disease/group1-shard3of3.bin',
  '/ai/browser-models/soil/model.json',
  '/ai/browser-models/soil/soil_labels_v4.json',
  '/ai/browser-models/soil/group1-shard1of3.bin',
  '/ai/browser-models/soil/group1-shard2of3.bin',
  '/ai/browser-models/soil/group1-shard3of3.bin'
];

// Install Event — Pre-cache App Shell
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing KrishiMitra AI Service Worker...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME_STATIC).then((cache) => {
        console.log('[ServiceWorker] Caching static app shell...');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(CACHE_NAME_MODELS).then((cache) => {
        console.log('[ServiceWorker] Pre-caching AI browser models...');
        return cache.addAll(MODEL_ASSETS).catch((err) => {
          console.warn('[ServiceWorker] Pre-caching model shards deferred (lazy loaded on use):', err);
        });
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating new Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME_STATIC && cacheName !== CACHE_NAME_MODELS) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — Offline Routing Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER cache dynamic backend API requests (e.g. /api/chat, /api/weather, /api/vision)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. AI Model Assets Strategy: Cache-first with network fallback
  if (url.pathname.includes('/ai/browser-models/')) {
    event.respondWith(
      caches.open(CACHE_NAME_MODELS).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          console.error('[ServiceWorker] Failed to fetch model file offline:', url.pathname);
          throw fetchErr;
        }
      })
    );
    return;
  }

  // 3. Static App Shell Strategy: Cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME_STATIC).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* ignore background update failures when offline */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
