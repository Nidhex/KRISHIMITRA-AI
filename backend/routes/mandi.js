/* ==========================================================================
   KrishiMitra AI — Mandi / Krishi Market Routes (/api/mandi)
   Endpoints for government daily market rates & crop price queries.
   ========================================================================== */

'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('../middleware/logger');
const mandiService = require('../services/mandiService');

/**
 * GET /api/mandi
 * Query Mandi prices by commodity, state, or district.
 */
router.get('/', async (req, res) => {
  try {
    const { commodity = 'wheat', state, district } = req.query;

    const result = await mandiService.getMandiPrices({ commodity, state, district });
    return res.json(result);
  } catch (err) {
    logger.error('[MANDI_ROUTE] Error fetching Mandi prices:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve Mandi prices.',
      userError: 'मंडी भाव डेटा लोड करने में समस्या हुई।'
    });
  }
});

/**
 * POST /api/mandi/search
 * Search Mandi prices with POST body.
 */
router.post('/search', async (req, res) => {
  try {
    const { commodity = 'wheat', state, district } = req.body || {};

    const result = await mandiService.getMandiPrices({ commodity, state, district });
    return res.json(result);
  } catch (err) {
    logger.error('[MANDI_ROUTE] Error searching Mandi prices:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to search Mandi prices.'
    });
  }
});

module.exports = router;
