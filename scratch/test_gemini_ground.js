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

async function testGeminiGrounding(model, toolObj) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Search for current Wheat mandi prices in India today Agmarknet September 2026. Extract APMC records from Agmarknet or data.gov.in. Return JSON format strictly.`
            }
          ]
        }
      ],
      tools: toolObj ? [toolObj] : undefined
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
        console.log(`[${model}] Tool: ${JSON.stringify(toolObj)} -> Status ${res.statusCode}`);
        try {
          const json = JSON.parse(b);
          if (json.error) {
            console.log('Error:', json.error.code, json.error.message.substring(0, 150));
          } else {
            const cand = json.candidates?.[0];
            console.log('Grounding metadata:', !!(cand?.groundingMetadata || cand?.grounding_metadata));
            console.log('Text snippet:\n', cand?.content?.parts?.[0]?.text?.substring(0, 300));
          }
        } catch (e) {
          console.log('JSON parse error');
        }
        resolve();
      });
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  await testGeminiGrounding('gemini-3.6-flash', { googleSearch: {} });
  await new Promise(r => setTimeout(r, 1000));
  await testGeminiGrounding('gemini-3.6-flash', { google_search: {} });
  await new Promise(r => setTimeout(r, 1000));
  await testGeminiGrounding('gemini-3.6-flash', null);
}

run();
