/* ==========================================================================
   KrishiMitra AI — UI Navigation Controller (uiNavigation.js)
   Handles page tab switching, bottom navigation bar, and deep links.
   ========================================================================== */

'use strict';

(function () {
  const KrishiNavigation = {
    /**
     * Switch application active tab/screen.
     * @param {string} tabId - 'home' | 'vision' | 'voice' | 'market' | 'schemes' | 'profile' | 'feed'
     */
    switchTab: function (tabId) {
      if (!tabId) return;

      if (typeof window.playSound === 'function') {
        window.playSound('snd-click');
      }

      // Hide active tab
      const activeView = document.querySelector('.tab-view.active-view');
      if (activeView) activeView.classList.remove('active-view');

      // Deactivate active nav button
      const activeNav = document.querySelector('.nav-item.active');
      if (activeNav) activeNav.classList.remove('active');

      // Show target tab
      const targetView = document.getElementById(`view-${tabId}`);
      if (targetView) targetView.classList.add('active-view');

      // Activate target nav button
      const targetNav = document.getElementById(`nav-btn-${tabId}`);
      if (targetNav) targetNav.classList.add('active');

      if (typeof window.appState !== 'undefined') {
        window.appState.currentTab = tabId;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Special triggers per tab activation
      if (tabId === 'vision' && typeof window.selectVisionModule === 'function') {
        window.selectVisionModule(window.appState?.activeVisionModule || 'disease');
      } else if (tabId === 'market' && typeof window.renderMarketBars === 'function') {
        window.renderMarketBars();
        if (typeof window.renderMandiList === 'function') window.renderMandiList();
      } else if (tabId === 'schemes' && typeof window.renderSchemes === 'function') {
        window.renderSchemes();
      }

      window.dispatchEvent(new CustomEvent('km:tabchange', { detail: { tab: tabId } }));
    },

    /**
     * Initialize navigation event bindings.
     */
    init: function () {
      document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.id ? btn.id.replace('nav-btn-', '') : null;
          if (id) {
            KrishiNavigation.switchTab(id);
          }
        });
      });
    }
  };

  window.KrishiNavigation = KrishiNavigation;
})();
