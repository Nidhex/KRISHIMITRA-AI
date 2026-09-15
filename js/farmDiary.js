/* ==========================================================================
   KrishiMitra AI — Frontend Farm Diary Controller
   Manages timeline, AI extraction, confirmation modals, & decision engine.
   ========================================================================== */

'use strict';

(function () {
  const FARMER_ID = 'farmer_default';
  let activeFilter = 'all';
  let currentEvents = [];
  let currentFields = [];
  let currentDraftEvent = null;

  // ── Core Initializer ────────────────────────────────────────────────────────
  function initFarmDiary() {
    console.log('[FarmDiary] Initializing Farm Diary module...');
    loadDiaryData();
    setupEventListeners();
  }

  // ── Load Diary Data from API or Cache ───────────────────────────────────────
  async function loadDiaryData() {
    const timelineContainer = document.getElementById('diary-timeline-list');
    if (timelineContainer) {
      timelineContainer.innerHTML = '<div class="diary-loading">🌾 Loading Farm Memory...</div>';
    }

    try {
      const api = window.KrishiMitraAPI || window.KrishiAPI;
      if (api && typeof api.getFarmDiary === 'function') {
        const res = await api.getFarmDiary(FARMER_ID, { eventType: activeFilter });
        if (res && res.success) {
          currentEvents = res.events || [];
          currentFields = res.fields || [];
          renderTimeline(currentEvents);
          renderDecisionEngine(FARMER_ID);
          return;
        }
      }
    } catch (err) {
      console.warn('[FarmDiary] Remote fetch failed, fallback to local storage:', err);
    }

    // Local Storage Fallback for Offline Mode
    const offlineEvents = getOfflineEvents();
    renderTimeline(offlineEvents);
    renderDecisionEngine(FARMER_ID);
  }

  // ── Render Timeline Events ──────────────────────────────────────────────────
  function renderTimeline(events) {
    const timelineContainer = document.getElementById('diary-timeline-list');
    if (!timelineContainer) return;

    if (!events || events.length === 0) {
      timelineContainer.innerHTML = `
        <div class="diary-empty-card card" style="text-align:center; padding:32px 16px;">
          <span style="font-size:2.8rem; display:block; margin-bottom:8px;">🌱</span>
          <h3 style="margin:0 0 6px; color:var(--text-primary); font-size:1.1rem; font-weight:700;">No farm activities recorded yet.</h3>
          <p style="margin:0 0 16px; color:var(--text-secondary); font-size:0.9rem;">
            Start building your Farm Memory.
          </p>
          <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
            <button class="btn-primary" onclick="document.getElementById('btn-manual-diary').click()">➕ Add Activity</button>
            <button class="btn-outline-primary" onclick="document.getElementById('btn-voice-diary').click()">🎤 Add with Voice</button>
          </div>
        </div>
      `;
      return;
    }

    const typeIcons = {
      planting: '🌱',
      irrigation: '💧',
      fertilizer: '🧪',
      pesticide: '🛡️',
      disease: '🔬',
      pest: '🐛',
      soil_test: '🟤',
      crop_observation: '👁️',
      harvest: '🌾',
      expense: '💰',
      income: '💵',
      other: '📝'
    };

    const cardsHtml = events.map(e => {
      const icon = typeIcons[e.eventType] || '📝';
      const dateFormatted = e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';
      const quantityBadge = e.quantity ? `<span class="diary-qty-tag">${e.quantity} ${e.unit || ''}</span>` : '';
      const areaBadge = e.area ? `<span class="diary-area-tag" style="background:#FEF3C7; color:#92400E; font-weight:700; font-size:0.75rem; padding:2px 6px; border-radius:4px;">${e.area} ${e.areaUnit || 'acre'}</span>` : '';
      const sourceBadge = `<span class="diary-source-tag">${(e.source || 'manual').toUpperCase()}</span>`;

      return `
        <div class="diary-event-card card" id="event-${e.id}">
          <div class="diary-event-header">
            <div class="diary-event-type">
              <span class="diary-type-icon">${icon}</span>
              <strong>${(e.eventType || 'activity').toUpperCase()}</strong>
              ${e.crop ? `<span class="diary-crop-pill">${e.crop}</span>` : ''}
            </div>
            <div class="diary-event-meta">
              <span class="diary-date">${dateFormatted}</span>
              <button class="btn-delete-event" onclick="window.KrishiFarmDiary.deleteEvent('${e.id}')" title="Delete entry">✕</button>
            </div>
          </div>

          <h4 class="diary-event-title">${e.title || 'Farm Activity'}</h4>
          ${e.description ? `<p class="diary-event-desc">${e.description}</p>` : ''}

          <div class="diary-event-footer" style="display:flex; gap:6px; align-items:center; margin-top:8px;">
            ${quantityBadge}
            ${areaBadge}
            ${sourceBadge}
          </div>
        </div>
      `;
    }).join('');

    timelineContainer.innerHTML = cardsHtml;
  }

  // ── Render Next Best Action Decision Card ───────────────────────────────────
  async function renderDecisionEngine(farmerId) {
    const decisionContainer = document.getElementById('diary-decision-container');
    if (!decisionContainer) return;

    try {
      const api = window.KrishiMitraAPI || window.KrishiAPI;
      if (api && typeof api.getDecisionEngine === 'function') {
        const res = await api.getDecisionEngine(farmerId);
        if (res && res.success && res.recommendation) {
          const r = res.recommendation;
          const basedOnList = (r.basedOn || []).map(b => `<li>✓ ${b.summary}</li>`).join('');

          decisionContainer.innerHTML = `
            <div class="decision-card card" style="background:#1E293B; color:#F8FAFC; border:1px solid #3B82F6; border-radius:12px; padding:18px; margin-bottom:20px; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="background:#2563EB; color:#FFF; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:4px; letter-spacing:0.5px;">🌾 WHAT SHOULD I DO NEXT?</span>
                <span style="font-size:0.8rem; color:#93C5FD; font-weight:600;">${r.crop || 'Crop Advisory'}</span>
              </div>
              <h3 style="margin:8px 0; color:#FFFFFF; font-size:1.1rem; font-weight:700; line-height:1.4;">${r.action}</h3>
              <div style="background:rgba(255,255,255,0.07); padding:12px; border-radius:8px; margin-top:10px;">
                <strong style="color:#93C5FD; font-size:0.85rem; display:block; margin-bottom:4px;">WHY?</strong>
                <p style="margin:0 0 6px; font-size:0.85rem; color:#E2E8F0; line-height:1.4;">${r.reason}</p>
                ${basedOnList ? `<div style="margin-top:6px; font-size:0.8rem; color:#CBD5E1;"><strong style="color:#93C5FD;">Based on:</strong><ul style="margin:4px 0 0; padding-left:18px;">${basedOnList}</ul></div>` : ''}
              </div>
              <div style="margin-top:10px; font-size:0.75rem; color:#94A3B8; text-align:right;">
                ${r.disclaimer || 'Based on Farm Memory & Agricultural RAG'}
              </div>
            </div>
          `;
          return;
        }
      }
    } catch (err) {
      console.warn('[FarmDiary] Decision engine query error:', err);
    }

    decisionContainer.innerHTML = '';
  }

  // ── Setup Event Listeners ───────────────────────────────────────────────────
  function setupEventListeners() {
    // Filter Pills
    document.querySelectorAll('.diary-filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.diary-filter-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        activeFilter = e.target.getAttribute('data-filter') || 'all';
        loadDiaryData();
      });
    });

    // Voice Entry Button in Diary Tab
    const btnVoiceDiary = document.getElementById('btn-voice-diary');
    if (btnVoiceDiary) {
      btnVoiceDiary.addEventListener('click', () => {
        startVoiceExtraction();
      });
    }

    // Manual Entry Button in Diary Tab
    const btnManualDiary = document.getElementById('btn-manual-diary');
    if (btnManualDiary) {
      btnManualDiary.addEventListener('click', () => {
        openManualEntryModal();
      });
    }

    // Keyboard shortcut (Escape key to close open modals)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModals();
      }
    });
  }

  // ── Voice Extraction Flow ───────────────────────────────────────────────────
  async function startVoiceExtraction() {
    const textInput = prompt("Record Farm Activity (Voice / Text):\nExample: 'आज मैंने अपने गेहूं के खेत में 40 किलो यूरिया डाला'");
    if (!textInput || !textInput.trim()) return;

    const api = window.KrishiMitraAPI || window.KrishiAPI;
    let result = null;

    if (api && typeof api.extractDiaryEvent === 'function') {
      result = await api.extractDiaryEvent(textInput, 'hi', 'voice');
    }

    if (result && result.success && result.draft) {
      openConfirmationModal(result.draft);
    } else {
      alert("Could not extract activity cleanly. Please try typing the activity.");
    }
  }

  // ── Open Confirmation Modal for Extracted Draft Event ───────────────────────
  function openConfirmationModal(draft) {
    currentDraftEvent = draft;
    const modal = document.getElementById('modal-diary-confirm');
    if (!modal) return;

    document.getElementById('confirm-event-type').value = draft.eventType || 'fertilizer';
    document.getElementById('confirm-crop').value = draft.crop || 'Wheat';
    document.getElementById('confirm-title').value = draft.title || 'Farm Activity';
    document.getElementById('confirm-desc').value = draft.description || '';
    document.getElementById('confirm-quantity').value = draft.quantity !== null && draft.quantity !== undefined ? draft.quantity : '';
    document.getElementById('confirm-unit').value = draft.unit || 'kg';
    
    const confirmAreaEl = document.getElementById('confirm-area');
    if (confirmAreaEl) confirmAreaEl.value = draft.area !== null && draft.area !== undefined ? draft.area : '';
    const confirmAreaUnitEl = document.getElementById('confirm-area-unit');
    if (confirmAreaUnitEl) confirmAreaUnitEl.value = draft.areaUnit || 'acre';

    document.getElementById('confirm-date').value = draft.date || new Date().toISOString().split('T')[0];

    modal.classList.remove('hidden');
  }

  // ── Open Manual Entry Modal ─────────────────────────────────────────────────
  function openManualEntryModal() {
    const modal = document.getElementById('modal-diary-manual');
    if (!modal) return;
    document.getElementById('manual-date').value = new Date().toISOString().split('T')[0];
    modal.classList.remove('hidden');
  }

  // ── Save Confirmed Event ────────────────────────────────────────────────────
  async function saveConfirmedEvent() {
    const eventType = document.getElementById('confirm-event-type').value;
    const crop = document.getElementById('confirm-crop').value;
    const title = document.getElementById('confirm-title').value;
    const description = document.getElementById('confirm-desc').value;
    const rawQty = document.getElementById('confirm-quantity').value;
    const unit = document.getElementById('confirm-unit').value;
    const confirmAreaEl = document.getElementById('confirm-area');
    const rawArea = confirmAreaEl ? confirmAreaEl.value : '';
    const confirmAreaUnitEl = document.getElementById('confirm-area-unit');
    const areaUnit = confirmAreaUnitEl ? confirmAreaUnitEl.value : 'acre';
    const date = document.getElementById('confirm-date').value;

    const eventPayload = {
      farmerId: FARMER_ID,
      eventType,
      crop,
      title,
      description,
      quantity: rawQty ? parseFloat(rawQty) : null,
      unit: rawQty ? unit : null,
      area: rawArea ? parseFloat(rawArea) : null,
      areaUnit: rawArea ? areaUnit : 'acre',
      date,
      source: currentDraftEvent ? (currentDraftEvent.source || 'voice') : 'manual'
    };

    const api = window.KrishiMitraAPI || window.KrishiAPI;
    let saved = false;

    if (api && typeof api.saveDiaryEvent === 'function') {
      const res = await api.saveDiaryEvent(eventPayload);
      if (res && res.success) saved = true;
    }

    if (!saved) {
      saveOfflineEvent(eventPayload);
    }

    closeModals();
    loadDiaryData();
  }

  // ── Save Manual Event ───────────────────────────────────────────────────────
  async function saveManualEvent() {
    const eventType = document.getElementById('manual-event-type').value;
    const crop = document.getElementById('manual-crop').value;
    const title = document.getElementById('manual-title').value;
    const description = document.getElementById('manual-desc').value;
    const rawQty = document.getElementById('manual-quantity').value;
    const unit = document.getElementById('manual-unit').value;
    const manualAreaEl = document.getElementById('manual-area');
    const rawArea = manualAreaEl ? manualAreaEl.value : '';
    const manualAreaUnitEl = document.getElementById('manual-area-unit');
    const areaUnit = manualAreaUnitEl ? manualAreaUnitEl.value : 'acre';
    const date = document.getElementById('manual-date').value;

    const eventPayload = {
      farmerId: FARMER_ID,
      eventType,
      crop,
      title: title || `${eventType.toUpperCase()} recorded`,
      description,
      quantity: rawQty ? parseFloat(rawQty) : null,
      unit: rawQty ? unit : null,
      area: rawArea ? parseFloat(rawArea) : null,
      areaUnit: rawArea ? areaUnit : 'acre',
      date,
      source: 'manual'
    };

    const api = window.KrishiMitraAPI || window.KrishiAPI;
    let saved = false;

    if (api && typeof api.saveDiaryEvent === 'function') {
      const res = await api.saveDiaryEvent(eventPayload);
      if (res && res.success) saved = true;
    }

    if (!saved) {
      saveOfflineEvent(eventPayload);
    }

    closeModals();
    loadDiaryData();
  }

  // ── Delete Event ────────────────────────────────────────────────────────────
  async function deleteEvent(eventId) {
    if (!confirm("Are you sure you want to delete this Farm Diary entry?")) return;

    const api = window.KrishiMitraAPI || window.KrishiAPI;
    if (api && typeof api.deleteDiaryEvent === 'function') {
      await api.deleteDiaryEvent(FARMER_ID, eventId);
    }
    deleteOfflineEvent(eventId);
    loadDiaryData();
  }

  // ── Save Vision Result to Farm Diary ────────────────────────────────────────
  function saveVisionToDiary(visionData) {
    if (!visionData) return;
    const draft = {
      eventType: visionData.disease ? 'disease' : 'soil_test',
      crop: visionData.crop || 'Crop',
      title: visionData.disease ? (visionData.disease.disease_name_hi || visionData.disease.disease_name) : 'Soil Analysis',
      description: `Vision scan finding (Confidence: ${Math.round((visionData.confidence || 0) * 100)}%).`,
      quantity: null,
      unit: null,
      date: new Date().toISOString().split('T')[0],
      source: 'vision',
      confidence: visionData.confidence || 0.9
    };
    openConfirmationModal(draft);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function closeModals() {
    const confirmModal = document.getElementById('modal-diary-confirm');
    const manualModal = document.getElementById('modal-diary-manual');
    if (confirmModal) confirmModal.classList.add('hidden');
    if (manualModal) manualModal.classList.add('hidden');
    currentDraftEvent = null;
  }

  function getOfflineEvents() {
    try {
      const raw = localStorage.getItem('krishimitra_offline_events');
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveOfflineEvent(payload) {
    const offline = getOfflineEvents();
    payload.id = payload.id || `off_${Date.now()}`;
    payload.pendingSync = true;
    offline.unshift(payload);
    try {
      localStorage.setItem('krishimitra_offline_events', JSON.stringify(offline));
    } catch (_) {}
  }

  function deleteOfflineEvent(eventId) {
    let offline = getOfflineEvents();
    offline = offline.filter(e => e.id !== eventId);
    try {
      localStorage.setItem('krishimitra_offline_events', JSON.stringify(offline));
    } catch (_) {}
  }

  // ── Expose Public API ───────────────────────────────────────────────────────
  window.KrishiFarmDiary = {
    init: initFarmDiary,
    loadData: loadDiaryData,
    saveConfirmedEvent,
    saveManualEvent,
    deleteEvent,
    saveVisionToDiary,
    closeModals
  };

  // Auto initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFarmDiary);
  } else {
    initFarmDiary();
  }

})();
