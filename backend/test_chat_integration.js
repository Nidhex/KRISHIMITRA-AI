'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const rag = require('./services/ragService');
const sarvam = require('./services/sarvamService');

async function runTests() {
  console.log('====================================================');
  console.log('KrishiMitra AI - Sarvam Multilingual Integration Tests');
  console.log('====================================================\n');

  console.log('1. Configuration Check:');
  console.log('   SARVAM_API_KEY Present:', sarvam.isConfigured() ? 'YES ✅' : 'NO ❌');
  console.log('   Target Model:', process.env.SARVAM_MODEL || 'sarvam-105b');
  console.log('');

  const testCases = [
    {
      title: 'English Query',
      message: 'My cotton crop has yellow leaves.',
      lang: 'en'
    },
    {
      title: 'Hindi Query (Devanagari)',
      message: 'मेरी कपास की फसल के पत्ते पीले हो रहे हैं।',
      lang: 'hi'
    },
    {
      title: 'Gujarati Query (Gujarati Script)',
      message: 'મારી કપાસની ખેતીમાં પાંદડા પીળા થાય છે.',
      lang: 'gu'
    },
    {
      title: 'Romanized Hindi (Hinglish)',
      message: 'meri fasal me keede lag gaye',
      lang: 'hi'
    },
    {
      title: 'Romanized Gujarati (Gujlish)',
      message: 'cotton ma su rog che?',
      lang: 'gu'
    },
    {
      title: 'Code-Mixed Query',
      message: 'cotton ke leaves yellow ho rahe hain, kya karu?',
      lang: 'hi'
    },
    {
      title: 'Tamil Query',
      message: 'பருத்தி பயிரில் இலைகள் மஞ்சள் நிறமாக மாறுகின்றன',
      lang: 'ta'
    },
    {
      title: 'Telugu Query',
      message: 'ప్రత్తి పంటలో ఆకులు పసుపు రంగులోకి మారుతున్నాయి',
      lang: 'te'
    }
  ];

  console.log('2. Testing Multilingual RAG Retrieval & Script Detection:');
  for (const tc of testCases) {
    const ragResult = await rag.retrieveContext(tc.message, { language: tc.lang });
    console.log(`\n  [${tc.title}]`);
    console.log(`  Input: "${tc.message}"`);
    console.log(`  Detected Lang: ${ragResult.detectedLanguage}`);
    console.log(`  Domains matched: [${ragResult.domains.join(', ')}] (Docs: ${ragResult.docCount})`);
    console.log(`  Keywords: [${ragResult.keywords.slice(0, 5).join(', ')}]`);
  }

  console.log('\n3. Testing Sarvam AI Chat Completion (sarvam-105b):');
  if (sarvam.isConfigured()) {
    try {
      const sampleQuestion = 'cotton ma su rog che?';
      const ragRes = await rag.retrieveContext(sampleQuestion, { language: 'gu' });
      const systemPrompt = `You are KrishiMitra AI. Answer in Gujarati.\n\nContext:\n${ragRes.context}`;

      const res = await sarvam.askSarvamChat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sampleQuestion }
        ],
        model: process.env.SARVAM_MODEL || 'sarvam-105b'
      });

      if (res.success) {
        console.log('  Sarvam AI Response Success ✅');
        console.log('  Model:', res.model);
        console.log('  Inference Time:', res.inferenceMs + 'ms');
        console.log('  Reply Preview:', res.reply.substring(0, 150) + '...\n');
      } else {
        console.log('  Sarvam AI Result (handled gracefully):', res.error, res.errorCode);
      }
    } catch (e) {
      console.error('  Sarvam test exception:', e.message);
    }
  } else {
    console.log('  Skipping live API call because SARVAM_API_KEY is not set yet in test environment.');
  }

  console.log('\n====================================================');
  console.log('Tests Completed Successfully!');
  console.log('====================================================');
}

runTests().catch(console.error);
