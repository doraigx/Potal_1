// バージョン番号を v2 に上げる（これが重要！）
const CACHE_NAME = 'portal-cache-v9.2'; 
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './clock.html', // 新しく作ったファイルも追加
  './icon-192.png',
  './icon-512.png'
];

// インストール：新しいファイルを強制的に取りに行く
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting()) // 待機せずにすぐ入れ替える
  );
});

// アクティベート：古い v1 などのキャッシュを完全に消去する
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ：まずネットを確認、ダメならキャッシュ（Network First）
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});
