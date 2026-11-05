const fs = require('fs');

function loadEnv(file) {
  const env = {};
  if (fs.existsSync(file)) {
    fs.readFileSync(file, 'utf8').split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const k = trimmed.slice(0, idx).trim();
          let v = trimmed.slice(idx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          env[k] = v;
        }
      }
    });
  }
  return env;
}

const env = loadEnv('farmer_ai/.env');
const geminiKey = env.GEMINI_API_KEY;
const sarvamKey = env.SARVAM_API_KEY;
const weatherKey = env.WEATHER_API_KEY;
const newsKey = env.NEWS_API_KEY;

async function testGemini() {
  if (!geminiKey) return { status: 'MISSING', message: 'No GEMINI_API_KEY set' };
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + geminiKey;
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) {
      const models = (data.models || []).slice(0, 5).map(m => m.name.replace('models/', ''));
      return { status: 'WORKING (VALID)', keyPrefix: geminiKey.slice(0, 6) + '...', sampleModels: models };
    } else {
      return { status: 'INVALID / FAILED', code: res.status, error: data.error?.message || res.statusText };
    }
  } catch (err) {
    return { status: 'NETWORK_ERROR', error: err.message };
  }
}

async function testSarvamChat() {
  if (!sarvamKey) return { status: 'MISSING', message: 'No SARVAM_API_KEY set' };
  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamKey
      },
      body: JSON.stringify({
        model: 'sarvam-105b',
        messages: [{ role: 'user', content: 'Say hello in Hindi' }],
        max_tokens: 100
      })
    });
    const data = await res.json();
    if (res.ok) {
      return { 
        status: 'WORKING (VALID)', 
        keyPrefix: sarvamKey.slice(0, 6) + '...',
        model: 'sarvam-105b',
        reply: data.choices?.[0]?.message?.content?.trim() 
      };
    } else {
      return { status: 'INVALID / FAILED', code: res.status, error: data };
    }
  } catch (err) {
    return { status: 'NETWORK_ERROR', error: err.message };
  }
}

async function testSarvamTTS() {
  if (!sarvamKey) return { status: 'MISSING', message: 'No SARVAM_API_KEY set' };
  try {
    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': sarvamKey
      },
      body: JSON.stringify({
        inputs: ['नमस्ते किसान भाई'],
        target_language_code: 'hi-IN',
        speaker: 'meera',
        model: 'bulbul:v1'
      })
    });
    const data = await res.json();
    if (res.ok && data.audios && data.audios.length > 0) {
      return { 
        status: 'WORKING (VALID)', 
        audioBase64Length: data.audios[0].length 
      };
    } else {
      return { status: 'INVALID / FAILED', code: res.status, error: data };
    }
  } catch (err) {
    return { status: 'NETWORK_ERROR', error: err.message };
  }
}

(async () => {
  console.log('Testing configured API keys...');
  const gemini = await testGemini();
  console.log('\n--- GEMINI API KEY ---');
  console.log(JSON.stringify(gemini, null, 2));

  const sarvamChat = await testSarvamChat();
  console.log('\n--- SARVAM API KEY (Chat Completion) ---');
  console.log(JSON.stringify(sarvamChat, null, 2));

  const sarvamTTS = await testSarvamTTS();
  console.log('\n--- SARVAM API KEY (Text-to-Speech) ---');
  console.log(JSON.stringify(sarvamTTS, null, 2));

  console.log('\n--- WEATHER_API_KEY ---');
  console.log({ status: weatherKey ? 'CONFIGURED' : 'NOT CONFIGURED (Using Open-Meteo free tier fallback without API key)' });

  console.log('\n--- NEWS_API_KEY ---');
  console.log({ status: newsKey ? 'CONFIGURED' : 'NOT CONFIGURED (Using curated SQLite/JSON news feed without API key)' });
})();

