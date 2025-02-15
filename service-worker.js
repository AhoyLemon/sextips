const cacheName = 'v2.06';
const offlineUrl = '/index.html';
const offlineFiles = [
  '/index.html',
  '/manifest.json',
  '/css/tips.css',
  '/js/libraries/vue.full.js',
  '/js/libraries/vue.min.js',
  '/js/libraries/html2canvas.min.js',
  '/js/libraries/canvas2image.js',
  '/js/min/tips.min.js',
  '/svg/logo-red.svg',
  '/svg/logo-white.svg',
  '/svg/logo-duotone.svg',
  '/svg/lemon.svg',
  '/audio/bylemon.mp3',
  '/img/bg1.jpg',
  '/img/bg2.jpg',
  '/img/bg3.jpg',
  '/img/bg4.jpg',
  '/img/bg5.jpg',
  '/img/bg6.jpg',
  '/img/bg7.jpg',
  '/img/bg8.jpg',
  '/img/bg9.jpg',
  '/img/bg10.jpg',
];

self.addEventListener('install', function(event) {
  // Put `offline.html` page into cache
  var offlineRequest = new Request(offlineFiles);
  event.waitUntil(
    fetch(offlineRequest).then(function(response) {
      return caches.open('offline').then(function(cache) {
        console.log('[oninstall] Cached offline page', response.url);
        return cache.put(offlineRequest, response);
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Only fall back for HTML documents.
  var request = event.request;
  // && request.headers.get('accept').includes('text/html')
  if (request.method === 'GET') {
    // `fetch()` will use the cache when possible, to this examples
    // depends on cache-busting URL parameter to avoid the cache.
    event.respondWith(
      fetch(request).catch(function(error) {
        // `fetch()` throws an exception when the server is unreachable but not
        // for valid HTTP responses, even `4xx` or `5xx` range.
        console.error(
          '[onfetch] Failed. Serving cached offline fallback ' +
          error
        );
        return caches.open('offline').then(function(cache) {
          return cache.match(offlineUrl);
        });
      })
    );
  }
  // Any other handlers come here. Without calls to `event.respondWith()` the
  // request will be handled without the ServiceWorker.
});