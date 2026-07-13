const crypto = require('crypto');

const secret = '44ae97f737651f0a9df9bda0588b3a13';
const payload = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1234567890',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: '1234567890'
            },
            contacts: [{ profile: { name: 'Test User' }, wa_id: '1234567890' }],
            messages: [
              {
                from: '1234567890',
                id: 'wamid.HBgLMTIzNDU2Nzg5MBUCABEYEFQ=',
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: { body: 'Hello test!' },
                type: 'text'
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
});

const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

async function testUrl(url) {
  console.log('---');
  console.log('Testing POST', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature
      },
      body: payload
    });
    const text = await res.text();
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body: ${text}`);
  } catch (err) {
    console.error(`Error connecting to ${url}:`, err.message);
  }
}

async function run() {
  await testUrl('http://localhost:3000/api/whatsapp/webhook');
  await testUrl('https://ng-tech-wcrm.vercel.app/api/whatsapp/webhook');
  await testUrl('https://ng-tech-wcrm-8wib.vercel.app/api/whatsapp/webhook');
}

run();
