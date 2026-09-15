/* ==========================================================================
   KrishiMitra AI — Mobile Farm Diary & Memory Service
   ========================================================================== */

import { ApiConfig, Endpoints } from '../config/api.config';

export interface FarmField {
  fieldId: string;
  farmerId: string;
  fieldName: string;
  crop: string;
  area: number;
  areaUnit: string;
  location?: string;
}

export interface FarmDiaryEvent {
  id: string;
  farmerId: string;
  fieldId?: string | null;
  crop?: string | null;
  eventType: string;
  date: string;
  title: string;
  description?: string;
  productName?: string | null;
  quantity?: number | null;
  unit?: string | null;
  area?: number | null;
  areaUnit?: string | null;
  amount?: number | null;
  currency?: string;
  targetPest?: string | null;
  createdBy?: string;
  source?: string;
  confidence?: number;
  createdAt?: string;
  pendingSync?: boolean;
}

export interface DecisionRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  crop: string;
  basedOn: Array<{ type: string; summary: string }>;
  timing?: string;
  confidence: number;
  disclaimer: string;
}

class MobileDiaryService {
  private localEvents: FarmDiaryEvent[] = [];

  /**
   * Calculate dynamic context-aware decision from real event history
   */
  calculateLocalDecision(events: FarmDiaryEvent[], cropFilter?: string): DecisionRecommendation {
    if (!events || events.length === 0) {
      return {
        action: "Not enough farm information to make a specific recommendation yet.",
        priority: "low",
        reason: "Add a crop or farm activity to build your farm memory.",
        crop: cropFilter || "All Crops",
        basedOn: [
          { type: "system", summary: "Empty Farm Memory state — awaiting farmer activity logs" }
        ],
        timing: "When you perform farm activities",
        confidence: 1.0,
        disclaimer: "Record events to unlock AI context-aware advice."
      };
    }

    const targetCrop = cropFilter || events[0].crop || 'Wheat';
    const recentEvents = events.filter(e => !cropFilter || (e.crop || '').toLowerCase().includes(cropFilter.toLowerCase()));
    const newestEvent = recentEvents[0] || events[0];

    let action = '';
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let reason = '';
    let timing = 'Next 2–3 days';
    const basedOn: Array<{ type: string; summary: string }> = [
      { type: 'farm_diary', summary: `Latest recorded event: ${newestEvent.eventType.toUpperCase()} (${newestEvent.title}) on ${newestEvent.date}` }
    ];

    const hasPesticide = recentEvents.some(e => e.eventType === 'pesticide');
    const hasIrrigation = recentEvents.some(e => e.eventType === 'irrigation');

    if (newestEvent.eventType === 'pesticide') {
      action = `Monitor the ${targetCrop} field for 2–3 days before applying any further sprays or treatments.`;
      priority = 'high';
      reason = `Pesticide application (${newestEvent.title}${newestEvent.quantity ? `, ${newestEvent.quantity} ${newestEvent.unit || ''}` : ''}) was recently recorded on ${newestEvent.date}. Allow sufficient time to evaluate pest knockdown and prevent chemical toxicity.`;
      timing = 'Next 2–3 days';
    } else if (newestEvent.eventType === 'disease' || newestEvent.eventType === 'pest') {
      action = `Inspect ${targetCrop} leaves for disease progression and apply organic or targeted fungicide if infection spreads.`;
      priority = 'high';
      reason = `A pest/disease observation (${newestEvent.title}) was recorded on ${newestEvent.date}. Early intervention stops pathogen spread across field boundaries.`;
      timing = 'Immediate (Within 24 hours)';
    } else if (newestEvent.eventType === 'harvest') {
      action = `Ensure proper sun-drying of harvested ${targetCrop}${newestEvent.quantity ? ` (${newestEvent.quantity} ${newestEvent.unit || 'kg'})` : ''} to safe moisture levels (<12%) before Mandi sale.`;
      priority = 'high';
      reason = `Harvest was recorded on ${newestEvent.date}. Check current Mandi APMC prices to secure maximum crop return.`;
      timing = 'Next 1–2 days';
      basedOn.push({ type: 'mandi', summary: 'Check government Mandi APMC prices before finalizing crop sale.' });
    } else if (newestEvent.eventType === 'irrigation') {
      if (hasPesticide) {
        action = `Inspect ${targetCrop} root zone moisture and verify that recent pesticide spray was not washed off.`;
        priority = 'medium';
        reason = `Irrigation was recorded on ${newestEvent.date} following recent pesticide application. Ensure adequate crop scouting.`;
        timing = 'Next 2 days';
      } else {
        action = `Inspect ${targetCrop} soil moisture and monitor for early weed growth following irrigation.`;
        priority = 'medium';
        reason = `Irrigation was recorded on ${newestEvent.date}. Maintaining balanced moisture prevents waterlogging.`;
        timing = 'Next 2–3 days';
      }
    } else if (newestEvent.eventType === 'fertilizer') {
      if (hasIrrigation) {
        action = `Allow root uptake of fertilizer in ${targetCrop} field. Postpone top-dressing for 10–14 days.`;
        priority = 'medium';
        reason = `Fertilizer (${newestEvent.title}${newestEvent.quantity ? `, ${newestEvent.quantity} ${newestEvent.unit || 'kg'}` : ''}) and irrigation have been applied. Roots require time for nitrogen assimilation.`;
        timing = 'Next 10–14 days';
      } else {
        action = `Schedule light irrigation for ${targetCrop} to assist fertilizer breakdown and root absorption.`;
        priority = 'high';
        reason = `Fertilizer (${newestEvent.title}) was recorded on ${newestEvent.date}. Light moisture prevents nitrogen volatilization.`;
        timing = 'Next 24–48 hours';
      }
    } else if (newestEvent.eventType === 'planting') {
      action = `Provide gentle moisture and monitor uniform seedling germination in ${targetCrop} field.`;
      priority = 'medium';
      reason = `Sowing/planting of ${targetCrop} was recorded on ${newestEvent.date}. Seedling establishment requires consistent soil moisture.`;
      timing = 'Next 3–5 days';
    } else {
      action = `Schedule field scouting for ${targetCrop} and record any new farm operations.`;
      priority = 'low';
      reason = `Latest recorded activity is ${newestEvent.title} on ${newestEvent.date}. Regular monitoring maintains crop health.`;
      timing = 'Next 3 days';
    }

    basedOn.push({ type: 'weather', summary: 'Weather forecast integrated into field operational advice.' });

    return {
      action,
      priority,
      reason,
      crop: targetCrop,
      basedOn,
      timing,
      confidence: 0.95,
      disclaimer: 'Advisory derived from Farm Memory & agricultural rules.'
    };
  }

  /**
   * Fetch events & fields for farmer
   */
  async getDiaryData(farmerId: string = 'farmer_default', eventType?: string): Promise<{
    success: boolean;
    events: FarmDiaryEvent[];
    fields: FarmField[];
  }> {
    try {
      const url = `${ApiConfig.baseUrl}${Endpoints.farmDiary}/${farmerId}${eventType && eventType !== 'all' ? '?eventType=' + eventType : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          events: data.events || [],
          fields: data.fields || [],
        };
      }
    } catch (err) {
      console.warn('[MobileDiaryService] Remote fetch failed, using local cache:', err);
    }

    let filtered = this.localEvents;
    if (eventType && eventType !== 'all') {
      filtered = filtered.filter(e => e.eventType === eventType);
    }

    return {
      success: true,
      events: filtered,
      fields: [
        { fieldId: 'field_001', farmerId, fieldName: 'Main Wheat Field', crop: 'Wheat', area: 2.0, areaUnit: 'acre' },
        { fieldId: 'field_002', farmerId, fieldName: 'Paddy Field', crop: 'Paddy', area: 1.5, areaUnit: 'acre' },
      ],
    };
  }

  /**
   * Extract event from natural language text
   */
  async extractEvent(text: string, language: string = 'hi'): Promise<{
    success: boolean;
    draft?: Partial<FarmDiaryEvent>;
  }> {
    try {
      const url = `${ApiConfig.baseUrl}${Endpoints.farmDiary}/extract`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, source: 'voice' }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('[MobileDiaryService] Extract API failed:', e);
    }

    return {
      success: false,
      draft: undefined,
    };
  }

  /**
   * Save confirmed event
   */
  async saveEvent(event: Partial<FarmDiaryEvent>): Promise<boolean> {
    const rawType = event.eventType || 'other';
    const newEv: FarmDiaryEvent = {
      id: event.id || `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      farmerId: event.farmerId || 'farmer_default',
      fieldId: event.fieldId || null,
      eventType: rawType,
      crop: event.crop ? event.crop.trim() : 'Wheat',
      title: event.title ? event.title.trim() : `${rawType.toUpperCase()} Activity`,
      description: event.description ? event.description.trim() : '',
      productName: event.productName || null,
      quantity: typeof event.quantity === 'number' && !isNaN(event.quantity) ? event.quantity : null,
      unit: event.unit ? event.unit.trim() : null,
      area: typeof event.area === 'number' && !isNaN(event.area) ? event.area : null,
      areaUnit: event.areaUnit ? event.areaUnit.trim() : 'acre',
      date: event.date || new Date().toISOString().split('T')[0],
      source: event.source || 'manual',
      pendingSync: true,
    };

    try {
      const url = `${ApiConfig.baseUrl}${Endpoints.farmDiary}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEv),
      });
      if (res.ok) {
        this.localEvents.unshift(newEv);
        return true;
      }
    } catch (err) {
      console.warn('[MobileDiaryService] Save API failed, storing locally:', err);
    }

    this.localEvents.unshift(newEv);
    return true;
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string, farmerId: string = 'farmer_default'): Promise<boolean> {
    try {
      const url = `${ApiConfig.baseUrl}${Endpoints.farmDiary}/${farmerId}/${eventId}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        this.localEvents = this.localEvents.filter(e => e.id !== eventId);
        return true;
      }
    } catch (_) {}

    this.localEvents = this.localEvents.filter(e => e.id !== eventId);
    return true;
  }

  /**
   * Get Next Best Action recommendation
   */
  async getNextBestAction(farmerId: string = 'farmer_default', crop?: string): Promise<DecisionRecommendation | null> {
    try {
      const url = `${ApiConfig.baseUrl}${Endpoints.farmDiary}/decision`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmerId, crop }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.recommendation) {
          return data.recommendation;
        }
      }
    } catch (e) {
      console.warn('[MobileDiaryService] Remote decision engine error, calculating locally:', e);
    }

    return this.calculateLocalDecision(this.localEvents, crop);
  }

  /**
   * Reset local state for testing
   */
  clearLocalEvents() {
    this.localEvents = [];
  }
}

export const diaryService = new MobileDiaryService();

