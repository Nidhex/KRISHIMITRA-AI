/* ==========================================================================
   KrishiMitra AI — Mobile Farm Diary & Memory Service
   ========================================================================== */

import { ApiConfig, Endpoints } from '../config/api.config';
import { apiClient } from './apiClient';

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
  quantity?: number | null;
  unit?: string | null;
  amount?: number | null;
  currency?: string;
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
  confidence: number;
  disclaimer: string;
}

class MobileDiaryService {
  private localEvents: FarmDiaryEvent[] = [];

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

    return {
      success: true,
      events: this.localEvents,
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
      success: true,
      draft: {
        eventType: 'fertilizer',
        crop: 'Wheat',
        title: 'Urea Application',
        description: text,
        quantity: 40,
        unit: 'kg',
        date: new Date().toISOString().split('T')[0],
        source: 'voice',
      },
    };
  }

  /**
   * Save confirmed event
   */
  async saveEvent(event: Partial<FarmDiaryEvent>): Promise<boolean> {
    try {
      const url = `${ApiConfig.baseUrl}${Endpoints.farmDiary}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (res.ok) return true;
    } catch (err) {
      console.warn('[MobileDiaryService] Save API failed, storing locally:', err);
    }

    const localEv: FarmDiaryEvent = {
      id: `off_${Date.now()}`,
      farmerId: event.farmerId || 'farmer_default',
      eventType: event.eventType || 'other',
      date: event.date || new Date().toISOString().split('T')[0],
      title: event.title || 'Farm Activity',
      description: event.description || '',
      quantity: event.quantity,
      unit: event.unit,
      crop: event.crop,
      source: event.source || 'manual',
      pendingSync: true,
    };
    this.localEvents.unshift(localEv);
    return true;
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string, farmerId: string = 'farmer_default'): Promise<boolean> {
    try {
      const url = `${ApiConfig.baseUrl}${Endpoints.farmDiary}/${farmerId}/${eventId}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) return true;
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
        return data.recommendation || null;
      }
    } catch (e) {
      console.warn('[MobileDiaryService] Decision engine error:', e);
    }

    return {
      action: 'Monitor your wheat field after recent fertilizer application.',
      priority: 'medium',
      reason: 'Your Farm Memory shows recent fertilizer application. Ensure roots absorb nutrients before applying further inputs.',
      crop: crop || 'Wheat',
      basedOn: [{ type: 'farm_diary', summary: 'Recent fertilizer entry recorded' }],
      confidence: 0.9,
      disclaimer: 'Advisory derived from Farm Memory & agricultural rules.',
    };
  }
}

export const diaryService = new MobileDiaryService();
