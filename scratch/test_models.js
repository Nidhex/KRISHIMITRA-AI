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

const models = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

async function check(m) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: "Hello" }] }]
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
        console.log(`Model ${m} -> Status ${res.statusCode}`);
        if (res.statusCode !== 200) console.log(b.substring(0, 150));
        resolve();
      });
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  for (const m of models) {
    await check(m);
  }
}
run();
