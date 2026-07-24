// 강남민화연구소 출석·수업료 앱 - 최소 서비스 워커
// 목적: PWA 설치 가능 판정을 안정적으로 받기 위함 (캐싱은 하지 않음 - 항상 최신 데이터를 씀)

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 설치 가능 판정을 위해 fetch 이벤트 핸들러가 필요함.
// 캐싱 없이 그대로 네트워크로 통과시킴 (데이터는 항상 최신 상태를 유지해야 하므로).
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
