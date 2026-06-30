// 캐시 이름에 버전을 박아두면, 코드를 바꿀 때마다 이 숫자만 올려주면
// 예전 캐시는 자동으로 정리되고 새 버전이 적용됩니다.
// (index.html을 새로 올릴 때 이 줄의 버전 숫자도 함께 +1 해주세요)
const CACHE_VERSION = 'v7';
const CACHE_NAME = `dsr-rate-calc-${CACHE_VERSION}`;
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // 새 서비스워커를 바로 활성화
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // 열려있는 탭에도 바로 새 서비스워커 적용
});

// 네트워크 우선 전략: 인터넷이 되면 항상 최신 파일을 받아오고,
// 캐시에 저장해둠. 오프라인일 때만 마지막으로 받아둔 캐시를 보여줌.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
