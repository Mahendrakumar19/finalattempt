const http = require('http');

const payload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '123456789',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: '1234567890'
            },
            contacts: [
              {
                profile: {
                  name: 'Test User'
                },
                wa_id: '1234567890'
              }
            ],
            messages: [
              {
                from: '1234567890',
                id: 'wamid.HBgLMTIzNDU2Nzg5MBUCABIYIjdENTVFMDFEMjExQjNCNzI5Mzg0RTFEMTIzNDU2Nzg5AA==',
                timestamp: '1620000000',
                type: 'text',
                text: {
                  body: 'Hello!'
                }
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/whatsapp/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(payload))
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(JSON.stringify(payload));
req.end();
