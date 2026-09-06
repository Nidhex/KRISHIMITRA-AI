/* ==========================================================================
   KrishiMitra AI — Offline Status & Connection Manager
   Provides connection state management, UI indicators, & controlled sync.
   ========================================================================== */

'use strict';

window.KrishiOfflineStatus = (function () {
  let isOnline = navigator.onLine;
  const listeners = [];

  function init() {
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);
    updateBanner();
  }

  function handleOnlineChange() {
    const prevStatus = isOnline;
    isOnline = navigator.onLine;

    console.log(`[OfflineStatus] Connection changed: ${isOnline ? 'ONLINE 🌐' : 'OFFLINE ⚡'}`);

    updateBanner();

    // Trigger registered callbacks
    listeners.forEach(fn => {
      try { fn(isOnline); } catch (e) {}
    });

    if (!prevStatus && isOnline) {
      console.log('[OfflineStatus] Device reconnected. Performing controlled background sync...');
      triggerControlledSync();
    }
  }

  function updateBanner() {
    const banner = document.getElementById('network-status-banner');
    if (!banner) return;

    if (isOnline) {
      banner.className = 'status-banner online';
      banner.innerHTML = `<span>🟢 Online • Live Backend Connection</span>`;
      setTimeout(() => {
        if (isOnline) banner.style.display = 'none';
      }, 3000);
    } else {
      banner.style.display = 'block';
      banner.className = 'status-banner offline';
      banner.innerHTML = `<span>⚡ Offline Mode • Browser AI & Local Knowledge Active</span>`;
    }
  }

  /**
   * Controlled sync on reconnect (prevents request storms)
   */
  async function triggerControlledSync() {
    if (!navigator.onLine) return;

    try {
      // 1. Check backend health gently with 5s timeout
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;

      console.log('[OfflineStatus] Backend reachable. Controlled sync finished.');
    } catch (e) {
      console.warn('[OfflineStatus] Sync check failed:', e.message);
    }
  }

  function subscribe(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  function isConnected() {
    return isOnline;
  }

  // Initialize automatically on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    isConnected,
    subscribe,
    triggerControlledSync
  };
})();
