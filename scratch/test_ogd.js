const https = require('https');

const OGD_API_URL = 'https://api.data.gov.in/resource/9ef74154-7634-42a3-9881-43d773041000';
const OGD_API_KEY = '579b464db66ec23bdd000001cdd39463285f472364c070942aa2bf3d';

function testAgmarknet(commodity = 'Wheat') {
  const url = `${OGD_API_URL}?api-key=${OGD_API_KEY}&format=json&limit=10&filters[commodity]=${encodeURIComponent(commodity)}`;
  console.log('Fetching:', url);

  https.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const data = JSON.parse(body);
        console.log('Total records:', data.total || data.records?.length || 0);
        console.log('Sample record:', JSON.stringify(data.records?.[0] || 'No records'));
      } catch (e) {
        console.log('Error parsing JSON:', body.substring(0, 300));
      }
    });
  }).on('error', (e) => {
    console.log('Fetch error:', e.message);
  });
}

testAgmarknet('Wheat');
