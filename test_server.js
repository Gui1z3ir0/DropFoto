const http = require('http');

const urls = [
  'http://localhost:4000/',
  'http://localhost:4000/showcase',
  'http://localhost:4000/showcase.html',
  'http://localhost:4000/css/style.css',
  'http://localhost:4000/css/dashboard.css',
  'http://localhost:4000/js/notifications.js',
  'http://localhost:4000/js/app.js',
  'http://localhost:4000/assets/images/maria_clark.jpg'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let len = 0;
      res.on('data', chunk => len += chunk.length);
      res.on('end', () => {
        console.log(`[${res.statusCode}] ${url} (${len} bytes)`);
        resolve(res.statusCode === 200);
      });
    }).on('error', (err) => {
      console.error(`Error loading ${url}:`, err.message);
      resolve(false);
    });
  });
}

(async () => {
  console.log('Testing PicDrop local server endpoints...');
  for (const u of urls) {
    await checkUrl(u);
  }
  console.log('Test completed.');
})();
