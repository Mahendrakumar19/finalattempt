const https = require('https');
const fs = require('fs');
const path = require('path');

const dest = 'd:/FInalAttempt/frontend/public/vidhan_sabha.png';
const file = fs.createWriteStream(dest);

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

https.get('https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/e/e6/Front_view_of_bihar_vidhan_sabha.jpg', options, (response) => {
  if (response.statusCode !== 200) {
    console.error('Request failed. Status Code: ' + response.statusCode);
    return;
  }
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download complete!');
  });
}).on('error', (err) => {
  console.error('Error: ' + err.message);
});
