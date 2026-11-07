/* Service worker: офлайн-кэш оболочки приложения */
var CACHE = 'kopilka-pro-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './js/utils.js',
  './js/store-schema.js',
  './js/store.js',
  './js/store-stats.js',
  './js/demo.js',
  './js/ui.js',
  './js/charts.js',
  './js/router.js',
  './js/screens/common.js',
  './js/screens/goal-form.js',
  './js/screens/operations.js',
  './js/screens/onboarding.js',
  './js/screens/home.js',
  './js/screens/goals.js',
  './js/screens/goal-detail.js',
  './js/screens/history.js',
  './js/screens/analytics.js',
  './js/screens/more.js',
  './js/app.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      });
    })
  );
});
