'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const voiceService = require('./services/sarvamVoiceService');
const http = require('http');
const app = require('./server');

async function testVoiceIntegration() {
  console.log('====================================================');
  console.log('KrishiMitra AI - Call Sarvam AI Voice Tests');
  console.log('====================================================\n');

  // 1. Language code BCP47 conversions
  console.log('1. Testing Language BCP-47 Mapping:');
  const langs = ['en', 'hi', 'gu', 'mr', 'bn', 'ta', 'te', 'kn', 'ml', 'pa', 'or'];
  langs.forEach(l => {
    console.log(`   ${l} -> ${voiceService.toBCP47(l)}`);
  });

  // 2. Start test server
  const server = http.createServer(app);
  const TEST_PORT = 5098;
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`\n2. Test Server running on port ${TEST_PORT}\n`);

  try {
    // 3. Test /api/voice/call-turn validation (empty request)
    console.log('3. Testing POST /api/voice/call-turn (Validation check):');
    const emptyRes = await fetch(`http://localhost:${TEST_PORT}/api/voice/call-turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const emptyData = await emptyRes.json();
    console.log('   Status:', emptyRes.status, 'Error Code:', emptyData.errorCode);

    // 4. Test /api/voice/synthesize validation
    console.log('\n4. Testing POST /api/voice/synthesize:');
    const synthRes = await fetch(`http://localhost:${TEST_PORT}/api/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'નમસ્તે રમેશભાઈ! તમારી કપાસની ખેતીમાં પાંદડા પીળા થવાનો ઉપાય.',
        language_code: 'gu-IN',
        speaker: 'shubh'
      })
    });
    const synthData = await synthRes.json();
    console.log('   Status:', synthRes.status);
    if (synthData.success) {
      console.log('   Audio synthesized successfully ✅ (Length:', synthData.audioBase64 ? synthData.audioBase64.length : 0, 'bytes)');
    } else {
      console.log('   Synthesis API response (handled gracefully):', synthData.error || synthData.userError);
    }

    // 5. Test complete end-to-end Call Turn with sample voice audio buffer
    console.log('\n5. Testing POST /api/voice/call-turn with sample voice buffer:');
    // Create a 1-second dummy audio buffer
    const mockWavBuffer = Buffer.alloc(16000 * 2); // 16kHz 16-bit
    const formData = new FormData();
    const blob = new Blob([mockWavBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'sample_farmer_voice.wav');
    formData.append('language', 'gu');
    formData.append('history', JSON.stringify([
      { role: 'user', content: 'નમસ્તે' },
      { role: 'assistant', content: 'નમસ્તે! હું તમારી શું મદદ કરી શકું?' }
    ]));
    formData.append('farmerContext', JSON.stringify({
      name: 'Ramesh Prasad',
      location: 'Kishanpur, UP',
      crops: 'Cotton'
    }));

    const turnRes = await fetch(`http://localhost:${TEST_PORT}/api/voice/call-turn`, {
      method: 'POST',
      body: formData
    });
    const turnData = await turnRes.json();
    console.log('   Status:', turnRes.status);
    console.log('   Result Success:', turnData.success);
    if (!turnData.success) {
      console.log('   Turn Response (gracefully handled):', turnData.userError || turnData.error);
    } else {
      console.log('   Transcript:', turnData.transcript);
      console.log('   Reply:', turnData.reply);
    }

    console.log('\n====================================================');
    console.log('Voice Service Integration Tests Completed!');
    console.log('====================================================');

  } finally {
    server.close();
  }
}

testVoiceIntegration().catch(console.error);
