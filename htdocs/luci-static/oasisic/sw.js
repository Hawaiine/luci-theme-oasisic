// luci-theme-oasisic — Service Worker
// 版本感知型缓存：每次更新版本号自动淘汰旧缓存

var CACHE_NAME = 'oasisic-v1.0.0';
var CACHE_URLS = [
  '/luci-static/oasisic/css/oasisic.css',
  '/luci-static/oasisic/css/presets.css',
  '/luci-static/oasisic/css/oasisic-dark.css',
  '/luci-static/oasisic/css/login.css',
  '/luci-static/oasisic/css/dashboard.css',
  '/luci-static/oasisic/css/nikki.css',
  '/luci-static/oasisic/css/perf.css',
  '/luci-static/oasisic/js/oasisic.js',
  '/luci-static/oasisic/js/login.js',
  '/luci-static/oasisic/js/dashboard.js',
  '/luci-static/oasisic/js/totp.js',
  '/luci-static/oasisic/js/blocks.js',
  '/luci-static/oasisic/js/perf.js',
  '/luci-static/oasisic/js/topo.js',
  '/luci-static/oasisic/js/report.js',
  '/luci-static/oasisic/img/logo.svg',
  '/luci-static/oasisic/manifest.json',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  // JS/CSS 用 stale-while-revalidate：先返回缓存，同时去网络取新版
  var url = new URL(event.request.url);
  var isStatic = url.pathname.match(/\.(css|js)$/);

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request).then(function(response) {
          return caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, response.clone());
            return response;
          });
        });
        return cached || fetchPromise;
      })
    );
  } else {
    // 其他资源：网络优先
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});