// Dummy Service Worker to satisfy browser requests
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Active
});
