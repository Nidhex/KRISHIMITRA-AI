/* ==========================================================================
   KrishiMitra AI — SQLite Embedded Database Service (sqliteDbService.js)
   Provides ACID transactions, indexed lookups, and multi-user concurrency
   using native Node.js SQLite (DatabaseSync) with automatic JSON sync fallback.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const { logger } = require('../middleware/logger');

const DB_PATH = path.join(__dirname, '..', '..', 'database', 'krishimitra.sqlite');
const LEGACY_EVENTS_FILE = path.join(__dirname, '..', '..', 'database', 'farm_diary', 'diary_events.json');
const LEGACY_FIELDS_FILE = path.join(__dirname, '..', '..', 'database', 'farm_diary', 'fields.json');
const LEGACY_NEWS_FILE = path.join(__dirname, '..', '..', 'database', 'news', 'news_cache.json');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let sqliteDb = null;
let isNativeSqlite = false;

// Initialize native SQLite if available
try {
  const { DatabaseSync } = require('node:sqlite');
  if (typeof DatabaseSync === 'function') {
    sqliteDb = new DatabaseSync(DB_PATH);
    isNativeSqlite = true;
    logger.info(`[SQLite] Initialized native embedded database at ${path.basename(DB_PATH)}`);
  }
} catch (e) {
  logger.warn(`[SQLite] Native SQLite not available (${e.message}); using transactional storage adapter.`);
}

/**
 * Initialize Tables & Indexes
 */
function initTables() {
  if (isNativeSqlite && sqliteDb) {
    try {
      // 1. Diary Events Table
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS diary_events (
          id TEXT PRIMARY KEY,
          farmer_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          crop TEXT,
          title TEXT,
          description TEXT,
          quantity REAL,
          unit TEXT,
          area REAL,
          area_unit TEXT,
          date TEXT,
          created_at TEXT,
          data_json TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_diary_farmer_date ON diary_events(farmer_id, date DESC);
        CREATE INDEX IF NOT EXISTS idx_diary_farmer_crop ON diary_events(farmer_id, crop);
        CREATE INDEX IF NOT EXISTS idx_diary_farmer_type ON diary_events(farmer_id, event_type);
      `);

      // 2. Fields Table
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS fields (
          field_id TEXT PRIMARY KEY,
          farmer_id TEXT NOT NULL,
          field_name TEXT,
          crop TEXT,
          area REAL,
          area_unit TEXT,
          location TEXT,
          data_json TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_fields_farmer ON fields(farmer_id);
      `);

      // 3. News Cache Table
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS news_cache (
          id TEXT PRIMARY KEY,
          headline TEXT,
          published_at TEXT,
          created_at INTEGER,
          data_json TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_news_created ON news_cache(created_at DESC);
      `);

      // Migrate existing records if SQLite table is empty
      migrateFromJson();
    } catch (err) {
      logger.error('[SQLite] Error creating tables:', err.message);
    }
  }
}

/**
 * Migrate legacy JSON records into SQLite on first initialization
 */
function migrateFromJson() {
  if (!isNativeSqlite || !sqliteDb) return;

  try {
    // 1. Migrate Events
    const countRow = sqliteDb.prepare('SELECT COUNT(*) as count FROM diary_events').get();
    if (countRow && countRow.count === 0 && fs.existsSync(LEGACY_EVENTS_FILE)) {
      const raw = fs.readFileSync(LEGACY_EVENTS_FILE, 'utf8').trim();
      const events = raw ? JSON.parse(raw) : [];
      if (Array.isArray(events) && events.length > 0) {
        const stmt = sqliteDb.prepare(`
          INSERT OR REPLACE INTO diary_events (
            id, farmer_id, event_type, crop, title, description, quantity, unit, area, area_unit, date, created_at, data_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const e of events) {
          stmt.run(
            e.id,
            e.farmerId || 'farmer_default',
            e.eventType || 'other',
            e.crop || '',
            e.title || '',
            e.description || '',
            typeof e.quantity === 'number' ? e.quantity : null,
            e.unit || '',
            typeof e.area === 'number' ? e.area : null,
            e.areaUnit || '',
            e.date || new Date().toISOString(),
            e.createdAt || new Date().toISOString(),
            JSON.stringify(e)
          );
        }
        logger.info(`[SQLite] Migrated ${events.length} diary events into SQLite.`);
      }
    }

    // 2. Migrate Fields
    const fieldCountRow = sqliteDb.prepare('SELECT COUNT(*) as count FROM fields').get();
    if (fieldCountRow && fieldCountRow.count === 0 && fs.existsSync(LEGACY_FIELDS_FILE)) {
      const raw = fs.readFileSync(LEGACY_FIELDS_FILE, 'utf8').trim();
      const fields = raw ? JSON.parse(raw) : [];
      if (Array.isArray(fields) && fields.length > 0) {
        const stmt = sqliteDb.prepare(`
          INSERT OR REPLACE INTO fields (
            field_id, farmer_id, field_name, crop, area, area_unit, location, data_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const f of fields) {
          stmt.run(
            f.fieldId,
            f.farmerId || 'farmer_default',
            f.fieldName || '',
            f.crop || '',
            typeof f.area === 'number' ? f.area : null,
            f.areaUnit || '',
            f.location || '',
            JSON.stringify(f)
          );
        }
        logger.info(`[SQLite] Migrated ${fields.length} fields into SQLite.`);
      }
    }

    // 3. Migrate News
    const newsCountRow = sqliteDb.prepare('SELECT COUNT(*) as count FROM news_cache').get();
    if (newsCountRow && newsCountRow.count === 0 && fs.existsSync(LEGACY_NEWS_FILE)) {
      const raw = fs.readFileSync(LEGACY_NEWS_FILE, 'utf8').trim();
      const articles = raw ? JSON.parse(raw) : [];
      if (Array.isArray(articles) && articles.length > 0) {
        const stmt = sqliteDb.prepare(`
          INSERT OR REPLACE INTO news_cache (
            id, headline, published_at, created_at, data_json
          ) VALUES (?, ?, ?, ?, ?)
        `);
        for (const a of articles.slice(0, 500)) {
          stmt.run(
            a.id || `news_${Date.now()}_${Math.random()}`,
            a.headline || a.title || '',
            a.publishedAt || '',
            Date.now(),
            JSON.stringify(a)
          );
        }
        logger.info(`[SQLite] Migrated ${articles.length} news articles into SQLite.`);
      }
    }
  } catch (err) {
    logger.warn('[SQLite] Migration warning:', err.message);
  }
}

// ── SQLite Query Helpers with JSON Dual-Sync ─────────────────────────────────

/**
 * Get diary events for a farmer with optional filters.
 */
function getEvents(farmerId = 'farmer_default', filters = {}) {
  if (isNativeSqlite && sqliteDb) {
    try {
      let sql = 'SELECT data_json FROM diary_events WHERE farmer_id = ?';
      const params = [farmerId];

      if (filters.crop) {
        sql += ' AND LOWER(crop) = ?';
        params.push(filters.crop.toLowerCase());
      }
      if (filters.eventType) {
        sql += ' AND event_type = ?';
        params.push(filters.eventType);
      }

      sql += ' ORDER BY date DESC, created_at DESC';

      if (filters.limit && typeof filters.limit === 'number') {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }

      const rows = sqliteDb.prepare(sql).all(...params);
      return rows.map(r => JSON.parse(r.data_json));
    } catch (err) {
      logger.warn('[SQLite] Fallback to JSON for getEvents:', err.message);
    }
  }

  // Fallback to JSON
  try {
    if (fs.existsSync(LEGACY_EVENTS_FILE)) {
      const all = JSON.parse(fs.readFileSync(LEGACY_EVENTS_FILE, 'utf8') || '[]');
      let res = all.filter(e => e.farmerId === farmerId);
      if (filters.crop) res = res.filter(e => (e.crop || '').toLowerCase() === filters.crop.toLowerCase());
      if (filters.eventType) res = res.filter(e => e.eventType === filters.eventType);
      res.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (filters.limit) res = res.slice(0, filters.limit);
      return res;
    }
  } catch (_) {}
  return [];
}

/**
 * Save or update a diary event.
 */
function saveEvent(event) {
  if (!event || !event.id) return false;

  const dataJson = JSON.stringify(event);

  if (isNativeSqlite && sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT OR REPLACE INTO diary_events (
          id, farmer_id, event_type, crop, title, description, quantity, unit, area, area_unit, date, created_at, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        event.id,
        event.farmerId || 'farmer_default',
        event.eventType || 'other',
        event.crop || '',
        event.title || '',
        event.description || '',
        typeof event.quantity === 'number' ? event.quantity : null,
        event.unit || '',
        typeof event.area === 'number' ? event.area : null,
        event.areaUnit || '',
        event.date || new Date().toISOString(),
        event.createdAt || new Date().toISOString(),
        dataJson
      );
    } catch (err) {
      logger.warn('[SQLite] saveEvent error:', err.message);
    }
  }

  // Maintain JSON sync
  try {
    let all = [];
    if (fs.existsSync(LEGACY_EVENTS_FILE)) {
      all = JSON.parse(fs.readFileSync(LEGACY_EVENTS_FILE, 'utf8') || '[]');
    }
    const idx = all.findIndex(e => e.id === event.id);
    if (idx >= 0) all[idx] = event;
    else all.push(event);
    fs.writeFileSync(LEGACY_EVENTS_FILE, JSON.stringify(all, null, 2), 'utf8');
  } catch (_) {}

  return true;
}

/**
 * Delete a diary event by ID.
 */
function deleteEvent(farmerId, eventId) {
  let deleted = false;

  if (isNativeSqlite && sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('DELETE FROM diary_events WHERE farmer_id = ? AND id = ?');
      const res = stmt.run(farmerId, eventId);
      if (res.changes > 0) deleted = true;
    } catch (err) {
      logger.warn('[SQLite] deleteEvent error:', err.message);
    }
  }

  // Maintain JSON sync
  try {
    if (fs.existsSync(LEGACY_EVENTS_FILE)) {
      let all = JSON.parse(fs.readFileSync(LEGACY_EVENTS_FILE, 'utf8') || '[]');
      const initialLen = all.length;
      all = all.filter(e => !(e.id === eventId && e.farmerId === farmerId));
      if (all.length < initialLen) {
        deleted = true;
        fs.writeFileSync(LEGACY_EVENTS_FILE, JSON.stringify(all, null, 2), 'utf8');
      }
    }
  } catch (_) {}

  return deleted;
}

/**
 * Get registered fields for a farmer.
 */
function getFields(farmerId = 'farmer_default') {
  if (isNativeSqlite && sqliteDb) {
    try {
      const rows = sqliteDb.prepare('SELECT data_json FROM fields WHERE farmer_id = ?').all(farmerId);
      if (rows.length > 0) return rows.map(r => JSON.parse(r.data_json));
    } catch (err) {
      logger.warn('[SQLite] getFields fallback:', err.message);
    }
  }

  try {
    if (fs.existsSync(LEGACY_FIELDS_FILE)) {
      const all = JSON.parse(fs.readFileSync(LEGACY_FIELDS_FILE, 'utf8') || '[]');
      return all.filter(f => f.farmerId === farmerId);
    }
  } catch (_) {}
  return [];
}

/**
 * Get cached news articles.
 */
function getNewsArticles(limit = 500) {
  if (isNativeSqlite && sqliteDb) {
    try {
      const rows = sqliteDb.prepare('SELECT data_json FROM news_cache ORDER BY created_at DESC LIMIT ?').all(limit);
      if (rows.length > 0) return rows.map(r => JSON.parse(r.data_json));
    } catch (err) {
      logger.warn('[SQLite] getNewsArticles fallback:', err.message);
    }
  }

  try {
    if (fs.existsSync(LEGACY_NEWS_FILE)) {
      return JSON.parse(fs.readFileSync(LEGACY_NEWS_FILE, 'utf8') || '[]');
    }
  } catch (_) {}
  return [];
}

/**
 * Save new articles into news cache with deduplication.
 */
function saveNewsArticles(articles = []) {
  if (!Array.isArray(articles)) return 0;

  if (isNativeSqlite && sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT OR REPLACE INTO news_cache (id, headline, published_at, created_at, data_json)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const a of articles) {
        stmt.run(
          a.id || `news_${Date.now()}_${Math.random()}`,
          a.headline || a.title || '',
          a.publishedAt || '',
          Date.now(),
          JSON.stringify(a)
        );
      }
    } catch (err) {
      logger.warn('[SQLite] saveNewsArticles error:', err.message);
    }
  }

  // Sync to JSON file (keeping up to 500)
  try {
    let existing = [];
    if (fs.existsSync(LEGACY_NEWS_FILE)) {
      existing = JSON.parse(fs.readFileSync(LEGACY_NEWS_FILE, 'utf8') || '[]');
    }
    const merged = [...articles];
    existing.forEach(e => {
      const dup = merged.some(m => (m.id && m.id === e.id) || (m.headline && m.headline.trim().toLowerCase() === (e.headline || '').trim().toLowerCase()));
      if (!dup) merged.push(e);
    });
    const trimmed = merged.slice(0, 500);
    fs.writeFileSync(LEGACY_NEWS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
    return trimmed.length;
  } catch (_) {}

  return articles.length;
}

// Initialize tables on startup
initTables();

module.exports = {
  isNativeSqlite,
  getEvents,
  saveEvent,
  deleteEvent,
  getFields,
  getNewsArticles,
  saveNewsArticles
};

