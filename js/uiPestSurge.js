/* ==========================================================================
   KrishiMitra AI — Micro-Climate Pest Surge UI Banner (uiPestSurge.js)
   Renders automated plant-pathology alert cards on home & weather tabs.
   ========================================================================== */

'use strict';

(function () {
  const KrishiPestSurge = {
    /**
     * Render pest surge banner into the targeted container.
     * @param {Array<Object>} alerts
     * @param {string} [containerId='pest-surge-banner-container']
     */
    renderBanner: function (alerts, containerId = 'pest-surge-banner-container') {
      let container = document.getElementById(containerId);
      if (!container) {
        // Create container dynamically right before weather widget
        const weatherCard = document.querySelector('.weather-card-main') || document.querySelector('.weather-preview-card');
        if (weatherCard && weatherCard.parentNode) {
          container = document.createElement('div');
          container.id = containerId;
          weatherCard.parentNode.insertBefore(container, weatherCard);
        }
      }

      if (!container) return;

      if (!Array.isArray(alerts) || alerts.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
      }

      container.style.display = 'block';
      container.innerHTML = alerts.map(a => `
        <div class="pest-surge-card ${a.severity || 'warning'}" role="alert" style="
          margin: 12px 0;
          padding: 14px 16px;
          border-radius: 12px;
          border-left: 6px solid ${a.severity === 'critical' ? '#d32f2f' : '#f57c00'};
          background: ${a.severity === 'critical' ? '#ffebee' : '#fff3e0'};
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          font-family: inherit;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">⚠️</span>
              <strong style="color: ${a.severity === 'critical' ? '#b71c1c' : '#e65100'}; font-size: 0.95rem;">
                ${a.pestOrDisease || 'Crop Threat Surge Alert'} (${a.crop || 'Standing Crops'})
              </strong>
            </div>
            <span style="
              font-size: 0.75rem;
              padding: 2px 8px;
              border-radius: 10px;
              font-weight: 600;
              background: ${a.severity === 'critical' ? '#ef5350' : '#ffa726'};
              color: #ffffff;
            ">${(a.severity || 'warning').toUpperCase()}</span>
          </div>
          <p style="margin: 4px 0 6px 0; font-size: 0.88rem; line-height: 1.4; color: #263238;">
            ${a.advisory}
          </p>
          <div style="font-size: 0.78rem; color: #546e7a; display: flex; gap: 12px; margin-top: 4px;">
            <span>⏱️ <strong>Timing:</strong> ${a.timing || 'Immediate'}</span>
            <span>🌡️ <strong>Trigger:</strong> ${a.trigger || 'High Humidity'}</span>
          </div>
        </div>
      `).join('');
    },

    /**
     * Check alerts from backend based on current weather parameters.
     * @param {Object} weatherMetrics
     * @param {string} [crop='']
     * @param {string} [language='en']
     */
    checkAlerts: async function (weatherMetrics, crop = '', language = 'en') {
      try {
        const lang = language || (window.appState && window.appState.currentLanguage) || 'en';
        const temp = weatherMetrics.temp || weatherMetrics.tempC || 26;
        const humidity = weatherMetrics.humidity || 82;
        const condition = weatherMetrics.condition || '';

        const url = `/api/weather/alerts?temp=${encodeURIComponent(temp)}&humidity=${encodeURIComponent(humidity)}&crop=${encodeURIComponent(crop)}&language=${encodeURIComponent(lang)}&condition=${encodeURIComponent(condition)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.alerts)) {
            KrishiPestSurge.renderBanner(data.alerts);
            return data.alerts;
          }
        }
      } catch (err) {
        console.warn('[KrishiPestSurge] Could not fetch surge alerts:', err.message);
      }
      return [];
    }
  };

  window.KrishiPestSurge = KrishiPestSurge;
})();

