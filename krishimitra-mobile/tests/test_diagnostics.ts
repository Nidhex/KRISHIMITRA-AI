import { diagnosticService } from '../services/diagnosticService';

async function testDiagnostics() {
  console.log('Running mobile diagnostic suite against production backend...');
  const report = await diagnosticService.runAllDiagnostics();

  console.log('\n==================================================');
  console.log(`DIAGNOSTIC REPORT — Target: ${report.baseUrl}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('==================================================');

  report.results.forEach((r) => {
    const symbol = r.status === 'PASS' ? '🟢 [PASS]' : r.status === 'FAIL' ? '🔴 [FAIL]' : '⚪ [SKIP]';
    console.log(`${symbol} ${r.name}: ${r.details}`);
  });

  console.log('==================================================');
  console.log(`OVERALL STATUS: ${report.overallStatus}`);
  console.log('==================================================\n');

  if (report.overallStatus !== 'PASS') {
    process.exit(1);
  }
}

testDiagnostics();
