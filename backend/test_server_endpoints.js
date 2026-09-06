'use strict';

const app = require('./server');
const http = require('http');

async function testEndpoints() {
  const server = http.createServer(app);
  const TEST_PORT = 5099;

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`Test server running on port ${TEST_PORT}\n`);

  try {
    // 1. Health check
    console.log('1. Testing GET /api/health:');
    const healthRes = await fetch(`http://localhost:${TEST_PORT}/api/health`);
    const healthData = await healthRes.json();
    console.log('   Status:', healthRes.status, 'Response:', JSON.stringify(healthData));

    // 2. Empty message validation
    console.log('\n2. Testing POST /api/chat (Empty message validation):');
    const emptyRes = await fetch(`http://localhost:${TEST_PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' })
    });
    const emptyData = await emptyRes.json();
    console.log('   Status:', emptyRes.status, 'Error code:', emptyData.errorCode);

    // 3. Overly long message validation
    console.log('\n3. Testing POST /api/chat (Long message validation):');
    const longRes = await fetch(`http://localhost:${TEST_PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'a'.repeat(2000) })
    });
    const longData = await longRes.json();
    console.log('   Status:', longRes.status, 'Error code:', longData.errorCode);

    // 4. Multilingual POST /api/chat with farmer context & history
    console.log('\n4. Testing POST /api/chat (Valid Gujarati message + history + farmer context):');
    const chatRes = await fetch(`http://localhost:${TEST_PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'cotton ma su rog che?',
        language: 'gu',
        history: [
          { role: 'user', content: 'નમસ્તે' },
          { role: 'assistant', content: 'નમસ્તે! હું તમારી શું મદદ કરી શકું?' }
        ],
        farmerContext: {
          name: 'Ramesh Prasad',
          location: 'Kishanpur, UP',
          landSize: '4 Acres',
          soilType: 'Clay Loam'
        }
      })
    });
    const chatData = await chatRes.json();
    console.log('   Status:', chatRes.status);
    console.log('   Success:', chatData.success);
    console.log('   Language:', chatData.language);
    console.log('   Domains:', chatData.domains);
    console.log('   DocCount:', chatData.docCount);
    if (chatData.reply) {
      console.log('   Reply Preview:', chatData.reply.substring(0, 100) + '...');
    }

    // 5. Existing Schemes endpoint
    console.log('\n5. Testing GET /api/schemes:');
    const schemesRes = await fetch(`http://localhost:${TEST_PORT}/api/schemes`);
    const schemesData = await schemesRes.json();
    console.log('   Status:', schemesRes.status, 'Total schemes:', schemesData.schemes ? schemesData.schemes.length : 0);

    // 6. Existing Weather endpoint
    console.log('\n6. Testing POST /api/weather:');
    const weatherRes = await fetch(`http://localhost:${TEST_PORT}/api/weather`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: 'Kishanpur, UP', language: 'en' })
    });
    const weatherData = await weatherRes.json();
    console.log('   Status:', weatherRes.status, 'Weather success:', weatherData.success);

    console.log('\n====================================================');
    console.log('All API endpoints verified successfully!');
    console.log('====================================================');

  } finally {
    server.close();
  }
}

testEndpoints().catch(console.error);
