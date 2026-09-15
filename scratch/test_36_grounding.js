const https = require('https');
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '../.env');
if (fs.existsSync(envFile)) {
  const envText = fs.readFileSync(envFile, 'utf8');
  envText.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const k = line.substring(0, idx).trim();
      const v = line.substring(idx + 1).trim();
      process.env[k] = v;
    }
  });
}

const apiKey = process.env.GEMINI_API_KEY;

async function testGrounding(toolConfig, toolNameStr) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const payload = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Search for current daily mandi prices for Wheat in India (Uttar Pradesh, Orai APMC, Sehjanwa APMC) from Agmarknet or data.gov.in. Return structured information with market name, state, district, date, min price, max price, modal price, and source.`
            }
          ]
        }
      ],
      tools: toolConfig
    });

    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        console.log(`Tool ${toolNameStr} -> Status ${res.statusCode}`);
        try {
          const json = JSON.parse(b);
          if (json.error) {
            console.log('Error:', JSON.stringify(json.error));
          } else {
            console.log('Candidates:', json.candidates?.length);
            const cand = json.candidates?.[0];
            console.log('Grounding metadata present:', !!(cand?.groundingMetadata || cand?.grounding_metadata));
            if (cand?.groundingMetadata) {
              console.log('Grounding metadata:', JSON.stringify(cand.groundingMetadata).substring(0, 300));
            }
            console.log('Response text:\n', cand?.content?.parts?.[0]?.text?.substring(0, 500));
          }
        } catch (e) {
          console.log('Error parsing JSON');
        }
        resolve();
      });
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing googleSearch...');
  await testGrounding([{ googleSearch: {} }], 'googleSearch');
  await new Promise(r => setTimeout(r, 2000));
  console.log('Testing google_search...');
  await testGrounding([{ google_search: {} }], 'google_search');
}

run();
