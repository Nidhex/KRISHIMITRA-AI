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

async function testModel(modelName) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "Wheat mandi price in India Agmarknet today September 2026. Search Agmarknet / data.gov.in."
            }
          ]
        }
      ],
      tools: [
        {
          googleSearch: {}
        }
      ]
    });

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Model ${modelName} -> Status ${res.statusCode}`);
        console.log(body.substring(0, 500));
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`Error:`, e.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  await testModel('gemini-3.5-flash');
  await new Promise(r => setTimeout(r, 2000));
  await testModel('gemini-3.6-flash');
  await new Promise(r => setTimeout(r, 2000));
  await testModel('gemini-2.5-flash');
}

run();
