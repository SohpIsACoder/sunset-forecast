/*!
 * 火烧云预报系统 · Service Worker（PWA 离线缓存）
 * Copyright (c) 2026 Sohp. All rights reserved.
 *
 * 缓存策略：
 *   · 页面导航     网络优先，断网回退到上次缓存的 index.html（秒开、无地址栏）
 *   · 同源静态资源 缓存优先 + 后台静默更新（JS / 图标 / manifest 全部可离线）
 *   · 气象接口     网络优先，失败回退到上次成功响应（断网仍可看上次预报）
 *
 * 说明：页面中文楷体使用系统字体（KaiTi / STKaiti / Kaiti SC），没有可下载的字体文件，
 *      因此无需缓存字体；若以后引入 Web Font，把字体 URL 追加到 PRECACHE 即可。
 *
 * 升级：修改 CACHE_VERSION 即可让旧缓存整体失效。
 */

const CACHE_VERSION = "sunset-v2.0.0";
const STATIC_CACHE = "sunset-static-" + CACHE_VERSION;
const API_CACHE = "sunset-api-" + CACHE_VERSION;

const SCOPE = self.registration.scope;
const OFFLINE_PAGE = SCOPE + "index.html";

const PRECACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./algorithm.js",
  "./manifest.json",
  "./icon.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    // 逐个预缓存：单个资源 404 不会让整个安装流程失败
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        await cache.add(new Request(new URL(url, SCOPE).href, { cache: "reload" }));
      } catch (err) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 跨域：仅接管 Open-Meteo 的气象 / 地名接口，其余请求保持浏览器默认行为
  if (url.origin !== self.location.origin) {
    if (/(^|\.)open-meteo\.com$/.test(url.hostname)) {
      event.respondWith(networkFirst(req, API_CACHE));
    }
    return;
  }

  // 页面导航：网络优先，断网时返回缓存页
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, STATIC_CACHE, OFFLINE_PAGE));
    return;
  }

  // 同源静态资源：先回缓存，同时后台更新
  event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
});

async function networkFirst(req, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const resp = await fetch(req);
    if (resp && resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (fallbackUrl) {
      const fb = await cache.match(fallbackUrl);
      if (fb) return fb;
    }
    return new Response("离线状态：暂无缓存数据", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreSearch: true });
  const refresh = fetch(req).then((resp) => {
    if (resp && resp.ok) cache.put(req, resp.clone());
    return resp;
  }).catch(() => null);
  return hit || (await refresh) || new Response("", { status: 504 });
}
