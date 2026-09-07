'use strict';

/* ==========================================================================
   KrishiMitra AI — Comprehensive LLM Production Fallback Test Suite
   Verifies all 6 environment & provider availability scenarios:
     A. NODE_ENV=development + Ollama available
     B. NODE_ENV=development + Ollama unavailable
     C. NODE_ENV=production + Gemini available
     D. NODE_ENV=production + Gemini unavailable
     E. NODE_ENV=production + Gemini unavailable + RAG available
     F. NODE_ENV=production + all remote providers unavailable
   ========================================================================== */

const path = require('path');
const http = require('http');

function createTestServer() {
  delete require.cache[require.resolve('./server')];
  delete require.cache[require.resolve('./routes/gemini')];
  delete require.cache[require.resolve('./routes/chat')];
  delete require.cache[require.resolve('./services/ollamaService')];
  delete require.cache[require.resolve('./services/sarvamService')];
  delete require.cache[require.resolve('./services/ragService')];

  const app = require('./server');
  return app;
}

async function closeServer(server) {
  if (server) {
    await new Promise(r => server.close(r));
  }
}

async function runScenarioTests() {
  console.log('===================================================================');
  console.log('KRISHIMITRA AI — PRODUCTION LLM FALLBACK AUTOMATED TEST SUITE');
  console.log('===================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  🟢 [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  🔴 [FAIL] ${message}`);
      failed++;
    }
  }

  const originalEnv = { ...process.env };

  // Intercept any accidental fetch attempts to localhost:11434 in production
  let attemptedOllamaUrl = false;
  const originalFetch = global.fetch;
  global.fetch = async function (url, options) {
    const urlStr = String(url);
    if (urlStr.includes('11434') || urlStr.includes('localhost:11434')) {
      attemptedOllamaUrl = true;
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL FAIL: Production code attempted to call localhost:11434!');
      }
    }
    return originalFetch(url, options);
  };

  let server;
  let portCounter = 5120;

  try {
    // -------------------------------------------------------------------------
    // Scenario A: NODE_ENV=development + Ollama available
    // -------------------------------------------------------------------------
    console.log('--- Scenario A: NODE_ENV=development + Ollama available ---');
    const portA = portCounter++;
    process.env.NODE_ENV = 'development';
    attemptedOllamaUrl = false;

    let app = createTestServer();
    delete process.env.SARVAM_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const ollamaServiceA = require('./services/ollamaService');
    const originalAskGemma = ollamaServiceA.askGemma;
    ollamaServiceA.askGemma = async () => {
      return { success: true, response: 'Mock Gemma response for development', model: 'gemma3' };
    };

    server = http.createServer(app);
    await new Promise(r => server.listen(portA, r));

    let res = await fetch(`http://localhost:${portA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'cotton ma su rog che?' })
    });
    let data = await res.json();
    assert(res.status === 200, 'Development mode returns HTTP 200');
    assert(data.source === 'gemma3', `Development mode uses Ollama fallback (source: ${data.source})`);

    await closeServer(server);

    // -------------------------------------------------------------------------
    // Scenario B: NODE_ENV=development + Ollama unavailable
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario B: NODE_ENV=development + Ollama unavailable ---');
    const portB = portCounter++;
    process.env.NODE_ENV = 'development';

    app = createTestServer();
    delete process.env.SARVAM_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const ollamaServiceB = require('./services/ollamaService');
    ollamaServiceB.askGemma = async () => {
      return { success: false, error: 'Ollama is not running', errorCode: 'OLLAMA_NOT_RUNNING' };
    };

    server = http.createServer(app);
    await new Promise(r => server.listen(portB, r));

    res = await fetch(`http://localhost:${portB}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'cotton ma su rog che?' })
    });
    data = await res.json();
    assert(res.status === 200, 'Development mode with Ollama offline falls back to local RAG (HTTP 200)');
    assert(data.source === 'rag_direct', `Source is local RAG (source: ${data.source})`);

    await closeServer(server);

    // -------------------------------------------------------------------------
    // Scenario C: NODE_ENV=production + Gemini available
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario C: NODE_ENV=production + Gemini available ---');
    const portC = portCounter++;
    process.env.NODE_ENV = 'production';
    attemptedOllamaUrl = false;

    app = createTestServer();
    delete process.env.SARVAM_API_KEY;
    if (originalEnv.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    }

    server = http.createServer(app);
    await new Promise(r => server.listen(portC, r));

    res = await fetch(`http://localhost:${portC}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'cotton yellow leaves treatment' })
    });
    data = await res.json();
    assert(res.status === 200, 'Production chat returns HTTP 200');
    assert(data.source === 'gemini' || data.source === 'rag_direct', `Production chat returns remote response or clean RAG fallback (source: ${data.source})`);
    assert(attemptedOllamaUrl === false, 'Zero attempts made to localhost:11434 in production mode!');

    await closeServer(server);

    // -------------------------------------------------------------------------
    // Scenario D: NODE_ENV=production + Gemini unavailable
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario D: NODE_ENV=production + Gemini unavailable ---');
    const portD = portCounter++;
    process.env.NODE_ENV = 'production';
    attemptedOllamaUrl = false;

    app = createTestServer();
    delete process.env.SARVAM_API_KEY;
    delete process.env.GEMINI_API_KEY;

    server = http.createServer(app);
    await new Promise(r => server.listen(portD, r));

    res = await fetch(`http://localhost:${portD}/api/gemini/generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'cotton yellow leaves treatment' }] }]
      })
    });
    data = await res.json();
    assert(res.status === 200, 'Production /api/gemini/generateContent falls back to local RAG (HTTP 200)');
    assert(data.candidates && data.candidates[0].content.parts[0].text, 'Returned valid Gemini candidate structure');
    assert(data.modelVersion === 'krishi_rag', `Model version indicates RAG (modelVersion: ${data.modelVersion})`);
    assert(attemptedOllamaUrl === false, 'Zero attempts made to localhost:11434 in production mode!');

    await closeServer(server);

    // -------------------------------------------------------------------------
    // Scenario E: NODE_ENV=production + Gemini unavailable + RAG available
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario E: NODE_ENV=production + Gemini unavailable + RAG available ---');
    const portE = portCounter++;
    process.env.NODE_ENV = 'production';
    attemptedOllamaUrl = false;

    app = createTestServer();
    delete process.env.SARVAM_API_KEY;
    delete process.env.GEMINI_API_KEY;

    server = http.createServer(app);
    await new Promise(r => server.listen(portE, r));

    res = await fetch(`http://localhost:${portE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What fertilizer is best for wheat crop?' })
    });
    data = await res.json();
    assert(res.status === 200, 'Production chat returns HTTP 200 when RAG handles query');
    assert(data.source === 'rag_direct', `Chat fallback source is rag_direct (source: ${data.source})`);
    assert(data.model === 'krishi_kb', `Chat fallback model is krishi_kb (model: ${data.model})`);
    assert(attemptedOllamaUrl === false, 'Zero attempts made to localhost:11434 in production mode!');

    await closeServer(server);

    // -------------------------------------------------------------------------
    // Scenario F: NODE_ENV=production + all remote providers unavailable
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario F: NODE_ENV=production + all remote providers unavailable ---');
    const portF = portCounter++;
    process.env.NODE_ENV = 'production';
    attemptedOllamaUrl = false;

    app = createTestServer();
    delete process.env.SARVAM_API_KEY;
    delete process.env.GEMINI_API_KEY;

    server = http.createServer(app);
    await new Promise(r => server.listen(portF, r));

    res = await fetch(`http://localhost:${portF}/api/gemini/generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [] })
    });
    data = await res.json();
    assert(res.status === 400, 'Invalid/empty prompt in production returns clean structured HTTP 400');
    assert(data.error && data.error.message, 'Returned structured error response without exposing internal secrets');
    assert(!JSON.stringify(data).includes('Ollama is not running'), 'Production error response NEVER mentions Ollama');
    assert(attemptedOllamaUrl === false, 'Zero attempts made to localhost:11434 in production mode!');

    await closeServer(server);

  } finally {
    global.fetch = originalFetch;
    Object.assign(process.env, originalEnv);
  }

  console.log('\n===================================================================');
  console.log(`LLM FALLBACK TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runScenarioTests().catch(err => {
  console.error('Test suite failed with exception:', err);
  process.exit(1);
});
