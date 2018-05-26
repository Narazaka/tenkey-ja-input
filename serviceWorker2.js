const VERSION = "5";
const ORIGIN = location.protocol + '//' + location.hostname + "/tenkey-ja-input";

const STATIC_CACHE_KEY = 'static-' + VERSION;
const STATIC_FILES = [
  ORIGIN + '/index2.html',
  ORIGIN + '/tenkey-ja-2-2.js',
];

const CACHE_KEYS = [
  STATIC_CACHE_KEY
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_KEY).then(cache => {
      return Promise.all(
        STATIC_FILES.map(url => {
          return fetch(new Request(url, { cache: 'no-cache', mode: 'no-cors' })).then(response => {
            return cache.put(url, response);
          });
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => {
          return !CACHE_KEYS.includes(key);
        }).map(key => {
          return caches.delete(key);
        })
      );
    })
  );
});
