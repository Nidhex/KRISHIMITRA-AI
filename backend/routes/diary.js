/* ==========================================================================
   KrishiMitra AI — Farm Diary Routes (/api/farm-diary)
   Endpoints for event management, natural language extraction, & decision engine.
   ========================================================================== */

'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('../middleware/logger');
const farmDiaryService = require('../services/farmDiaryService');

/**
 * GET /api/farm-diary/:farmerId
 * Retrieve fields, timeline events, and current decision for a farmer.
 */
router.get('/:farmerId', (req, res) => {
  try {
    const { farmerId } = req.params;
    const { crop, eventType, fieldId, limit } = req.query;

    const fields = farmDiaryService.getFields(farmerId);
    const events = farmDiaryService.getEvents(farmerId, {
      crop,
      eventType,
      fieldId,
      limit: limit ? parseInt(limit, 10) : undefined
    });

    return res.json({
      success: true,
      farmerId,
      fields,
      events,
      totalCount: events.length
    });
  } catch (err) {
    logger.error('[DIARY_ROUTE] Error getting diary events:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve Farm Diary events.',
      userError: 'फार्म डायरी डेटा लोड करने में समस्या हुई।'
    });
  }
});

/**
 * POST /api/farm-diary
 * Save a confirmed Farm Diary Event.
 */
router.post('/', (req, res) => {
  try {
    const eventData = req.body;

    if (!eventData || typeof eventData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Event payload is required.',
        userError: 'डायरी डेटा प्रदान करें।'
      });
    }

    const event = farmDiaryService.createEvent(eventData);
    return res.status(201).json({
      success: true,
      event
    });
  } catch (err) {
    logger.error('[DIARY_ROUTE] Error creating diary event:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save Farm Diary event.',
      userError: 'फार्म डायरी इवेंट सहेजने में समस्या हुई।'
    });
  }
});

/**
 * DELETE /api/farm-diary/:farmerId/:eventId
 * Delete a specific Farm Diary Event.
 */
router.delete('/:farmerId/:eventId', (req, res) => {
  try {
    const { farmerId, eventId } = req.params;
    const deleted = farmDiaryService.deleteEvent(farmerId, eventId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Event not found or already deleted.'
      });
    }

    return res.json({
      success: true,
      message: 'Event deleted successfully.'
    });
  } catch (err) {
    logger.error('[DIARY_ROUTE] Error deleting event:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete event.'
    });
  }
});

/**
 * POST /api/farm-diary/extract
 * Convert natural language text (Hindi/English/Hinglish) to structured diary event draft.
 */
router.post('/extract', async (req, res) => {
  try {
    const { text, language = 'hi', source = 'voice' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Text input is required for AI extraction.'
      });
    }

    const result = await farmDiaryService.extractEventFromText(text, { language, source });
    return res.json(result);
  } catch (err) {
    logger.error('[DIARY_ROUTE] Error extracting event:', err);
    return res.status(500).json({
      success: false,
      error: 'AI extraction failed.'
    });
  }
});

/**
 * POST /api/farm-diary/decision
 * Run Next Best Action Decision Engine based on stored farm memory & weather/crop context.
 */
router.post('/decision', async (req, res) => {
  try {
    const { farmerId = farmDiaryService.DEFAULT_FARMER_ID, crop } = req.body;
    const decision = await farmDiaryService.generateNextBestAction(farmerId, crop);
    return res.json(decision);
  } catch (err) {
    logger.error('[DIARY_ROUTE] Error generating decision:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Next Best Action recommendation.'
    });
  }
});

module.exports = router;
