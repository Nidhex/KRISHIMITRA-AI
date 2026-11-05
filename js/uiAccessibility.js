/* ==========================================================================
   KrishiMitra AI — Accessibility Controller (uiAccessibility.js)
   Text resizer, High Contrast mode, screen-reader helpers, and sound effects.
   ========================================================================== */

'use strict';

(function () {
  const KrishiAccessibility = {
    /**
     * Play localized interface audio feedback safely.
     * @param {string} soundId
     */
    playSound: function (soundId) {
      try {
        const audio = document.getElementById(soundId);
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      } catch (_) {}
    },

    /**
     * Set font size across the entire application interface.
     * @param {'small'|'medium'|'large'} size
     */
    setFontSize: function (size) {
      const body = document.body;
      if (!body) return;

      const decreaseBtn = document.getElementById('btn-text-decrease');
      const resetBtn = document.getElementById('btn-text-reset');
      const increaseBtn = document.getElementById('btn-text-increase');

      body.classList.remove('font-small', 'font-normal', 'font-large');
      if (decreaseBtn) decreaseBtn.classList.remove('active');
      if (resetBtn) resetBtn.classList.remove('active');
      if (increaseBtn) increaseBtn.classList.remove('active');

      if (size === 'small') {
        body.classList.add('font-small');
        if (decreaseBtn) decreaseBtn.classList.add('active');
      } else if (size === 'large') {
        body.classList.add('font-large');
        if (increaseBtn) increaseBtn.classList.add('active');
      } else {
        body.classList.add('font-normal');
        if (resetBtn) resetBtn.classList.add('active');
      }

      if (typeof window.appState !== 'undefined') {
        window.appState.fontSize = size;
      }

      try {
        localStorage.setItem('km_fontSize', size);
      } catch (_) {}
    },

    /**
     * Toggle high contrast mode for enhanced outdoor sunlight readability.
     */
    toggleHighContrast: function () {
      const body = document.body;
      if (!body) return;

      const isHighContrast = body.classList.toggle('high-contrast');

      if (typeof window.appState !== 'undefined') {
        window.appState.highContrast = isHighContrast;
      }

      try {
        localStorage.setItem('km_highContrast', isHighContrast ? 'true' : 'false');
      } catch (_) {}

      const btn = document.getElementById('btn-high-contrast');
      if (btn) {
        if (isHighContrast) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    },

    /**
     * Restore saved accessibility preferences on page load.
     */
    init: function () {
      try {
        const savedSize = localStorage.getItem('km_fontSize');
        if (savedSize && ['small', 'medium', 'large'].includes(savedSize)) {
          KrishiAccessibility.setFontSize(savedSize);
        }

        const savedContrast = localStorage.getItem('km_highContrast');
        if (savedContrast === 'true') {
          KrishiAccessibility.toggleHighContrast();
        }
      } catch (_) {}
    }
  };

  window.KrishiAccessibility = KrishiAccessibility;
  if (typeof window.playSound === 'undefined') {
    window.playSound = KrishiAccessibility.playSound;
  }
})();
