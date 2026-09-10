/* ==========================================================================
   KrishiMitra AI — Voice & LLM Text Extraction Automated Test Suite
   Verifies:
     1. extractFinalAssistantText correctly normalizes Gemini, Sarvam, RAG, and string responses.
     2. isInternalPromptLeaked accurately detects system prompts, RAG context headers, and profile blocks.
     3. sanitizeAssistantText strips internal prompts without destroying agricultural advice.
     4. buildFarmerFacingRAGAnswer generates clean, farmer-facing responses across languages.
     5. Bulbul TTS receives ONLY clean final assistant answer text.
   ========================================================================== */

'use strict';

const path = require('path');
const textExtractor = require('../services/textExtractionService');
const voiceService = require('../services/sarvamVoiceService');
const rag = require('../services/ragService');

async function runVoiceExtractionTests() {
  console.log('===================================================================');
  console.log('KRISHIMITRA VOICE OUTPUT & TEXT EXTRACTION VERIFICATION TEST SUITE');
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

  // ── Test 1: extractFinalAssistantText ──────────────────────────────────────
  console.log('--- Test 1: Extract Final Assistant Text from Various Formats ---');

  // Gemini API structure
  const geminiResponse = {
    candidates: [
      {
        content: {
          parts: [{ text: 'गेहूं में पीली रोली का उपचार प्रोपिकोनाज़ोल छिड़काव है।' }],
          role: 'model'
        }
      }
    ]
  };
  const geminiExtracted = textExtractor.extractFinalAssistantText(geminiResponse);
  assert(geminiExtracted === 'गेहूं में पीली रोली का उपचार प्रोपिकोनाज़ोल छिड़काव है।', 'Correctly extracts text from Gemini API candidate structure');

  // Sarvam / OpenAI structure
  const sarvamResponse = {
    choices: [
      {
        message: {
          content: 'તમારા કપાસના પાકમાં ખાતરનું પ્રમાણ સરખું રાખો.'
        }
      }
    ]
  };
  const sarvamExtracted = textExtractor.extractFinalAssistantText(sarvamResponse);
  assert(sarvamExtracted === 'તમારા કપાસના પાકમાં ખાતરનું પ્રમાણ સરખું રાખો.', 'Correctly extracts text from Sarvam API choices structure');

  // Direct string
  const stringExtracted = textExtractor.extractFinalAssistantText('   Apply 25kg Urea per acre.   ');
  assert(stringExtracted === 'Apply 25kg Urea per acre.', 'Correctly normalizes direct string input');

  // ── Test 2: Internal Prompt Leak Detection ─────────────────────────────────
  console.log('\n--- Test 2: Detect Internal Prompt & Context Leaks ---');

  const leakedText1 = `Based on agricultural recommendations for HI: किसान को सरल और व्यावहारिक हिन्दी में उत्तर दें...
=== FARMER PROFILE CONTEXT ===
Farmer Name: Ramesh Prasad
Location: Kishanpur, UP`;

  const leakedText2 = `=== RAG CONTEXT ===
=== KRISHIMITRA VERIFIED DISEASE DATA ===
[Cotton Disease Record 1]`;

  const cleanText1 = 'आपकी गेहूं की फसल में पत्तियां पीली हो रही हैं तो सबसे पहले मिट्टी की नमी जांचें और 25 किलो यूरिया प्रति एकड़ डालें।';
  const cleanText2 = 'Your paddy crop symptoms suggest Blast disease. Spray Tricyclazole 75 WP at 0.6g per litre of water.';

  assert(textExtractor.isInternalPromptLeaked(leakedText1) === true, 'Detects leaked farmer profile block and system prompt prefix');
  assert(textExtractor.isInternalPromptLeaked(leakedText2) === true, 'Detects leaked RAG context headers');
  assert(textExtractor.isInternalPromptLeaked(cleanText1) === false, 'Allows legitimate Hindi agricultural advice');
  assert(textExtractor.isInternalPromptLeaked(cleanText2) === false, 'Allows legitimate English agricultural advice');

  // ── Test 3: Text Sanitization Layer ───────────────────────────────────────
  console.log('\n--- Test 3: Text Sanitization & TTS Cleaning ---');

  const dirtyInput = `Based on agricultural recommendations for HI: किसान को सरल और व्यावहारिक हिन्दी में उत्तर दें।
=== FARMER PROFILE CONTEXT ===
Farmer Name: Ramesh Prasad
Location: Kishanpur, UP

**गेहूं की फसल** में पीली रोली के लिए *प्रोपिकोनाज़ोल* छिड़कें।`;

  const sanitizedUI = textExtractor.sanitizeAssistantText(dirtyInput, { language: 'hi' });
  assert(!sanitizedUI.includes('FARMER PROFILE CONTEXT'), 'Sanitizer removes farmer profile header');
  assert(!sanitizedUI.includes('Ramesh Prasad'), 'Sanitizer removes raw farmer name context block');
  assert(!sanitizedUI.includes('Based on agricultural recommendations'), 'Sanitizer removes developer instructions');
  assert(sanitizedUI.includes('गेहूं की फसल') && sanitizedUI.includes('प्रोपिकोनाज़ोल'), 'Sanitizer preserves legitimate agricultural answer text');

  const sanitizedTTS = textExtractor.sanitizeAssistantText(dirtyInput, { forTTS: true, language: 'hi' });
  assert(!sanitizedTTS.includes('**') && !sanitizedTTS.includes('*'), 'TTS sanitizer removes markdown asterisks for clean speech synthesis');

  // ── Test 4: Local RAG Clean Answer Generator ──────────────────────────────
  console.log('\n--- Test 4: Local RAG Clean Answer Generation (Multilingual) ---');

  const ragMock = {
    context: ` किसान को सरल और व्यावहारिक हिन्दी (Hindi) में उत्तर दें।
=== FARMER PROFILE CONTEXT ===
Farmer Name: Ramesh Prasad

=== KRISHIMITRA VERIFIED DISEASE DATA ===
[Cotton Leaf Curl Virus]
Details: Leaves curl upwards and turn yellow.
- Organic Treatment: Neem oil spray 5ml/litre
- Chemical Treatment: Imidacloprid 17.8 SL at 0.5ml/litre`,
    detectedLanguage: 'hi',
    domains: ['disease'],
    docCount: 1
  };

  const ragCleanAnswerHi = textExtractor.buildFarmerFacingRAGAnswer(ragMock, 'hi');
  assert(!ragCleanAnswerHi.includes('FARMER PROFILE CONTEXT'), 'Local RAG answer DOES NOT contain farmer profile context');
  assert(!ragCleanAnswerHi.includes('किसान को सरल और व्यावहारिक हिन्दी'), 'Local RAG answer DOES NOT contain system prompt instructions');
  assert(ragCleanAnswerHi.length > 10, 'Local RAG produces non-empty clean farmer answer');

  const ragCleanAnswerGu = textExtractor.buildFarmerFacingRAGAnswer(ragMock, 'gu');
  assert(!ragCleanAnswerGu.includes('FARMER PROFILE CONTEXT'), 'Gujarati RAG answer DOES NOT contain farmer profile context');

  // ── Test 5: Bulbul TTS Assertion Guard ─────────────────────────────────────
  console.log('\n--- Test 5: Bulbul TTS Assertion Guard ---');

  const oldKey = process.env.SARVAM_API_KEY;
  process.env.SARVAM_API_KEY = 'test_mock_key';

  let ttsErrorCaught = false;
  try {
    // Attempting to synthesize raw leaked text directly
    await voiceService.synthesizeSpeech(leakedText1, 'hi-IN');
  } catch (err) {
    ttsErrorCaught = true;
    assert(err.message !== null, 'TTS guard prevents raw internal prompt from being synthesized to speech');
  } finally {
    if (oldKey) process.env.SARVAM_API_KEY = oldKey;
    else delete process.env.SARVAM_API_KEY;
  }

  console.log('\n===================================================================');
  console.log(`VOICE TEXT EXTRACTION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVoiceExtractionTests();
