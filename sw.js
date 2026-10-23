const CACHE_NAME = 'portal-cache-v0.1.3'; 
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './login.html',
  './clock.html', 
  './icon-192.png',
  './icon-512.png',
  './logo.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting()) // 待機せずにすぐ入れ替える
  );
});

// アクティベート：古いキャッシュを完全に消去する
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

// フェッチ：自分のサイトのファイルのみ Network First で処理し、外部APIはスルーする
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // ★1. GET以外のリクエスト（FirebaseのPOST等）や、外部ドメイン（ニュース・天気API・CDN等）は
  // Service Workerで横取りせず、ブラウザの通常通信に任せる（CORSエラー・Response変換エラー防止）
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // ★2. 自分のサイトのファイル（index.html, clock.html, 画像など）だけ Network First
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // 正常なレスポンスのみキャッシュに保存する
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        // オフライン時はキャッシュから返す（万が一キャッシュに無くても undefined を返さないよう保護）
        return caches.match(event.request).then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      })
  );
});
