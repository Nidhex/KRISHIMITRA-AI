/* ==========================================================================
   KrishiMitra AI — Diagnostic Test: Gemini + Google Grounding Mandi Pipeline
   ========================================================================== */

'use strict';

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

const mandiService = require('../backend/services/mandiService');

async function runDiagnostic() {
  console.log('\n==================================================');
  console.log('       KRISHIMITRA GEMINI MANDI DIAGNOSTIC       ');
  console.log('==================================================\n');

  const testCrops = ['Wheat', 'Paddy', 'Tomato', 'Potato', 'Mustard'];
  const summaryReport = {};

  for (const crop of testCrops) {
    console.log(`\n--------------------------------------------------`);
    console.log(` Testing Crop: ${crop}`);
    console.log(`--------------------------------------------------`);

    const result = await mandiService.getMandiPrices({ commodity: crop });

    const count = result.records ? result.records.length : 0;
    const isGrounded = result.grounded ? 'YES' : 'NO (Fallback Active)';
    const dataDate = result.dataDate || 'N/A';
    const source = result.source || 'N/A';
    const model = result.modelUsed || 'N/A';

    console.log(`Commodity        : ${result.commodity || crop}`);
    console.log(`Grounded Search  : ${isGrounded}`);
    console.log(`Model Used       : ${model}`);
    console.log(`Validated Records: ${count}`);
    console.log(`Latest Data Date : ${dataDate}`);
    console.log(`Primary Source   : ${source}`);

    if (result.summary && result.summary.highest) {
      console.log(`Highest Modal    : ₹${result.summary.highest.modalPrice} / quintal (${result.summary.highest.market})`);
      console.log(`Lowest Modal     : ₹${result.summary.lowest.modalPrice} / quintal (${result.summary.lowest.market})`);
    }

    if (count > 0) {
      console.log(`\nSample Validated Records (Up to 3):`);
      result.records.slice(0, 3).forEach((r, idx) => {
        console.log(`  [${idx + 1}] ${r.market} (${r.district}, ${r.state}) | ${r.commodity} (${r.variety}) | Modal: ₹${r.modalPrice} | Min: ₹${r.minPrice} | Max: ₹${r.maxPrice} | Date: ${r.arrivalDate} | Source: ${r.source}`);
      });
    } else {
      console.log(`  ⚠️ No valid records found.`);
    }

    summaryReport[crop] = {
      records: count,
      grounded: isGrounded,
      dataDate,
      source,
      sample: result.records ? result.records.slice(0, 3) : []
    };
  }

  console.log('\n==================================================');
  console.log('             DIAGNOSTIC SUMMARY                   ');
  console.log('==================================================');
  console.table(
    Object.keys(summaryReport).map(c => ({
      Crop: c,
      Records: summaryReport[c].records,
      Grounded: summaryReport[c].grounded,
      DataDate: summaryReport[c].dataDate,
      Source: summaryReport[c].source.substring(0, 30)
    }))
  );

  return summaryReport;
}

if (require.main === module) {
  runDiagnostic().then(() => {
    console.log('\nDiagnostic Completed Successfully.\n');
    process.exit(0);
  }).catch(err => {
    console.error('\nDiagnostic Failed:', err);
    process.exit(1);
  });
}

module.exports = { runDiagnostic };
