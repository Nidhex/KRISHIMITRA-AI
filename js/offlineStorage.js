/* ==========================================================================
   KrishiMitra AI — Offline Storage Manager (IndexedDB + localStorage)
   Centralized offline data persistence for Weather, Mandi, News, Reports & Profile.
   ========================================================================== */

'use strict';

window.KrishiOfflineStorage = (function () {
  const DB_NAME = 'KrishiMitraDB';
  const DB_VERSION = 1;
  let dbPromise = null;

  // Initialize IndexedDB
  function getDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('[OfflineStorage] IndexedDB not supported in this browser. Falling back to localStorage.');
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('weather')) {
          db.createObjectStore('weather', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('mandi')) {
          db.createObjectStore('mandi', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('news')) {
          db.createObjectStore('news', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('[OfflineStorage] IndexedDB open error:', event.target.error);
        resolve(null);
      };
    });

    return dbPromise;
  }

  // --- Weather Storage ---
  async function saveWeather(data, locationName) {
    const record = {
      id: 'current_weather',
      data,
      locationName,
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    };

    localStorage.setItem('km_weather_cache', JSON.stringify(record));

    const db = await getDB();
    if (db) {
      try {
        const tx = db.transaction('weather', 'readwrite');
        tx.objectStore('weather').put(record);
      } catch (e) {
        console.warn('[OfflineStorage] Failed to save weather to IndexedDB:', e);
      }
    }
    return record;
  }

  async function getWeather() {
    const local = localStorage.getItem('km_weather_cache');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }

    const db = await getDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('weather', 'readonly');
          const request = tx.objectStore('weather').get('current_weather');
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }
    return null;
  }

  // --- Mandi Storage ---
  async function saveMandi(records) {
    const data = {
      id: 'current_mandi',
      records,
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    };

    localStorage.setItem('km_mandi_cache', JSON.stringify(data));

    const db = await getDB();
    if (db) {
      try {
        const tx = db.transaction('mandi', 'readwrite');
        tx.objectStore('mandi').put(data);
      } catch (e) {}
    }
    return data;
  }

  async function getMandi() {
    const local = localStorage.getItem('km_mandi_cache');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return null;
  }

  // --- News Storage ---
  async function saveNews(articles) {
    const data = {
      id: 'cached_news',
      articles,
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
    };

    localStorage.setItem('km_news_cache', JSON.stringify(articles));

    const db = await getDB();
    if (db) {
      try {
        const tx = db.transaction('news', 'readwrite');
        tx.objectStore('news').put(data);
      } catch (e) {}
    }
    return data;
  }

  async function getNews() {
    const local = localStorage.getItem('km_news_cache');
    if (local) {
      try {
        const articles = JSON.parse(local);
        return {
          articles,
          timestamp: Date.now(),
          formattedDate: new Date().toLocaleDateString('en-IN')
        };
      } catch (e) {}
    }
    return null;
  }

  // --- Crop Reports Storage (PMFBY Evidence) ---
  async function saveCropReport(report) {
    if (!report.id) report.id = 'REP-' + Date.now().toString().slice(-6);
    report.savedOfflineAt = Date.now();
    report.formattedDate = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const localReports = getLocalReports();
    localReports.unshift(report);
    localStorage.setItem('km_saved_reports', JSON.stringify(localReports.slice(0, 50)));

    const db = await getDB();
    if (db) {
      try {
        const tx = db.transaction('reports', 'readwrite');
        tx.objectStore('reports').put(report);
      } catch (e) {}
    }
    return report;
  }

  function getLocalReports() {
    const data = localStorage.getItem('km_saved_reports');
    return data ? JSON.parse(data) : [];
  }

  async function getAllReports() {
    return getLocalReports();
  }

  // --- Farmer Profile Storage ---
  function saveProfile(profile) {
    localStorage.setItem('km_farmer_profile', JSON.stringify(profile));
  }

  function getProfile() {
    const data = localStorage.getItem('km_farmer_profile');
    return data ? JSON.parse(data) : null;
  }

  return {
    saveWeather,
    getWeather,
    saveMandi,
    getMandi,
    saveNews,
    getNews,
    saveCropReport,
    getAllReports,
    saveProfile,
    getProfile
  };
})();
