
"use strict";

const CACHE_VERSION = "v3.4.1.3";
const CACHE_NAME = `eduventure-cache-${CACHE_VERSION}`;

const SCOPE = self.registration ? self.registration.scope : self.location.origin + '/';

const u = (path) => new URL(path, SCOPE).toString();
const uniq = (arr) => Array.from(new Set(arr));

const OFFLINE_FALLBACK = u("index.html");

function buildReadingHtmlUrls({ testCount = 10, passCount = 3 } = {}) {
  const urls = [];
  for (let t = 1; t <= testCount; t++) {
    for (let p = 1; p <= passCount; p++) {
      urls.push(u(`reading/test${t}/pass${p}/pass${p}.html`));
    }
  }
  return urls;
}

function buildListeningHtmlUrls({ testCount = 10, secCount = 4 } = {}) {
  const urls = [];
  for (let t = 1; t <= testCount; t++) {
    for (let s = 1; s <= secCount; s++) {
      urls.push(u(`listening/test${t}/sec${s}/sec${s}.html`));
      urls.push(u(`listenings/test${t}/sec${s}/sec${s}.html`));
    }
  }
  return urls;
}

const ASSETS = uniq([
  u("./"),
  u("index.html"),
  u("/favicon.ico"),        
  u("site.webmanifest"),  
  u("script-internet-checker.js"),
  u("pages/home/home page.html"),
  u("pages/study_materials/study_materials.html"),
  u("pages/study_materials/bridge.html"),
  u("pages/chat/global.chat.html"),
]);


function isFirebaseApi(url) {
  const h = url.hostname;
  return (
    h.includes("firebaseio.com") ||
    h.includes("firebasedatabase.app") ||
    (h.includes("googleapis.com") &&
      (url.pathname.includes("identitytoolkit") ||
        url.pathname.includes("securetoken") ||
        url.pathname.includes("/firebaseinstallations/")))
  );
}

async function addAllSafe(cache, urls) {
  for (const url of urls) {
    try {
      const res = await fetch(new Request(url, { cache: "reload" }));
      if (res && res.ok) {
        await cache.put(url, res.clone());
      }
    } catch (err) {
      console.warn(`Failed to cache ${url}:`, err.message);
    }
  }
}

self.addEventListener("install", (e) => {
  console.log('[SW] Install event');
  e.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        await addAllSafe(cache, ASSETS);
        
        try {
          const res = await fetch(new Request(OFFLINE_FALLBACK, { cache: "reload" }));
          if (res && res.ok) {
            await cache.put(OFFLINE_FALLBACK, res.clone());
          }
        } catch (err) {
          console.warn('[SW] Failed to cache offline fallback:', err.message);
        }
        
        self.skipWaiting();
      } catch (err) {
        console.error('[SW] Install failed:', err);
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    (async () => {
      try {
        if (self.registration.navigationPreload) {
          try {
            await self.registration.navigationPreload.enable();
          } catch (err) {
            console.warn('[SW] Navigation preload failed:', err.message);
          }
        }
        
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
        
        await self.clients.claim();
      } catch (err) {
        console.error('[SW] Activate failed:', err);
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (isFirebaseApi(url)) return;

  if (url.pathname.endsWith("/ping.txt")) {
    event.respondWith(
      fetch(new Request(req, { cache: "no-store" }))
        .catch(() => new Response("", { status: 503 }))
    );
    return;
  }

  const networkOnly =
    req.cache === "no-store" ||
    url.searchParams.has("sw-network-only") ||
    req.headers.get("x-sw-network-only") === "1";

  if (networkOnly) {
    event.respondWith(
      fetch(req).catch(() => new Response("", { status: 503 }))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(req, responseClone))
              .catch((err) => {
                console.warn('[SW] Cache put failed:', err.message);
              })
          );
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(req);
        if (cachedResponse) return cachedResponse;

        if (req.mode === "navigate") {
          const fallback = await caches.match(OFFLINE_FALLBACK);
          if (fallback) return fallback;
        }

        return new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;

  if (data && (data.action === "skipWaiting" || data.type === "SKIP_WAITING")) {
    console.log('[SW] Skip waiting received');
    self.skipWaiting();
    return;
  }

  if (data === "SKIP_WAITING") {
    console.log('[SW] Skip waiting received');
    self.skipWaiting();
  }
});