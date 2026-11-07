// Boom Arena offline cache. It's what makes the game installable as an app, and lets single-player start
// with no internet. The game's own files come fresh from the server whenever it can be reached (so updates
// show up straight away) and from this cache when it can't. The 3D engine (pinned versions on CDNs) and the
// font never change, so those are served from the cache once saved.
const BUILD = '__BUILD__';   // replaced by server.js with a stamp of every game file
const CACHE = 'boom-arena-r3-' + BUILD;
const CORE = ['./', 'shared.js', 'textures-a.js', 'island.js', 'br.js', 'rewards.js', 'lobby.js', 'mobile.js', 'icons/apple-touch-icon.png', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-64.png',
  'lobby/arena-bg.jpg', 'lobby/op-ranger.webp', 'lobby/op-viper.webp', 'lobby/op-ranger-frost.webp', 'lobby/op-viper-wood.webp', 'lobby/gun-ar.webp',
  'lobby/op-ranger-face.webp', 'lobby/op-viper-face.webp', 'lobby/op-ranger-frost-face.webp', 'lobby/op-viper-wood-face.webp',
  'fonts/barlow-condensed-600.woff2', 'fonts/barlow-condensed-700.woff2', 'fonts/barlow-condensed-800.woff2', 'fonts/barlow-condensed-800i.woff2', 'fonts/barlow-condensed-900i.woff2'];
const LIBS = [
  'vendor/three/three.min.js',
  'vendor/three/GLTFLoader.js',
  'vendor/three/SkeletonUtils.js',
  'vendor/three/CopyShader.js',
  'vendor/three/LuminosityHighPassShader.js',
  'vendor/three/EffectComposer.js',
  'vendor/three/ShaderPass.js',
  'vendor/three/RenderPass.js',
  'vendor/three/UnrealBloomPass.js',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap',
];
const LIVE = new Set(['/ws', '/status', '/health']);   // never cached
const FOREVER = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
    await Promise.all(LIBS.map(async u => { try { await c.put(u, await fetch(u, { mode: 'no-cors' })); } catch (er) {} }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'version') e.source && e.source.postMessage({ build: BUILD }); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (LIVE.has(url.pathname) || url.pathname.startsWith('/dev/')) return;
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' });   // network first, revalidated past the browser's HTTP cache
        if (r.ok) {   // keep the saved copy current (only rewrite it when the file actually changed)
          const old = await c.match(req, { ignoreSearch: true }), tag = r.headers.get('etag');
          if (!old || !tag || old.headers.get('etag') !== tag) c.put(new Request(url.pathname), r.clone());
        }
        return r;
      } catch (er) {   // offline: the saved copy (and the game page for any page request)
        return (await c.match(new Request(url.pathname))) || (req.mode === 'navigate' && await c.match('./')) || Response.error();
      }
    })());
    return;
  }
  if (FOREVER.test(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE), hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok || r.type === 'opaque') c.put(req, r.clone());
      return r;
    })());
  }
});
