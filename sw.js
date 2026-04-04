const CACHE_NAME = 'portal-cache-v2'; // 更新のたびにここを v3, v4 と変えると確実です
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './clock.html' // clock.html も追加しておきましょう
];

// インストール：新しいキャッシュを強制的に適用
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting()) // すぐに新しいSWを有効化
  );
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim()) // 全てのタブを即座に制御下に置く
  );
});

// リクエスト対応：Network First (まず最新を、ダメならキャッシュを)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // ネットワークから取得できたらキャッシュを更新して返す
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(function() {
        // オフラインなどでネットワークに失敗したらキャッシュを返す
        return caches.match(event.request);
      })
  );
});
