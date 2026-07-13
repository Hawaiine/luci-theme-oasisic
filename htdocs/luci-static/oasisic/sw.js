// luci-theme-oasisic — Service Worker
// 缓存静态资源提升加载速度

var CACHE_NAME = 'oasisic-v1';
var CACHE_URLS = [
  '/luci-static/oasisic/css/oasisic.css',
  '/luci-static/oasisic/css/presets.css',
  '/luci-static/oasisic/css/oasisic-dark.css',
  '/luci-static/oasisic/css/login.css',
  '/luci-static/oasisic/css/dashboard.css',
  '/luci-static/oasisic/css/nikki.css',
  '/luci-static/oasisic/js/oasisic.js',
  '/luci-static/oasisic/js/login.js',
  '/luci-static/oasisic/js/dashboard.js',
  '/luci-static/oasisic/js/totp.js',
  '/luci-static/oasisic/img/logo.svg',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
});