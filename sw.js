const CACHE_NAME = "velvet-table-v5-mobile-layout";
const APP_SHELL = ["./", "./index.html", "./style.css", "./app.js", "./baccarat-rules.mjs", "./card-renderer.mjs", "./squeeze-geometry.mjs", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
