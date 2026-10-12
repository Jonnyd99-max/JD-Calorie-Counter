const CACHE = 'jd-food-shell-v1';
const ROOT = new URL('./', self.location.href);
const ASSETS = ['index.html','styles.css','app.js','core.js','storage.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable.png','icons/icon.svg','data/foods.json'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(p=>new URL(p,ROOT).href)))));
self.addEventListener('message',event=>{ if(event.data?.type==='SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys()) if(key.startsWith('jd-food-shell-') && key!==CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const u=new URL(event.request.url);
  // Never cache backend requests, photos, authorization headers, or other sites.
  if(event.request.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname)) return;
  if(event.request.mode==='navigate') {
    event.respondWith(caches.match(new URL('index.html',ROOT).href).then(cached=>cached||fetch(event.request)));
  } else if(ASSETS.some(p=>new URL(p,ROOT).href===u.href)) {
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }
});
