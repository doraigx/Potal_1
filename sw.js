const CACHE_NAME = 'portal-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // アイコン画像もキャッシュ
  './icon-192.png',
  './icon-512.png'
];

// インストール処理
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// リクエスト対応
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュにあればそれを返す、なければネットワークへ
        return response || fetch(event.request);
      })
  );
});