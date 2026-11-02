// Installation support only. Never cache authenticated routes, API responses or work data.
const CACHE='inventory-public-assets-v1';
const PUBLIC=['/offline.html','/app-icons/icon-192.png','/app-icons/icon-512.png','/app-icons/maskable-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PUBLIC)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('inventory-public-assets-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||event.request.method!=='GET')return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(async()=>await caches.match('/offline.html')||new Response('Sin conexión. Vuelve a intentarlo cuando recuperes la señal.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));return;}
 if(PUBLIC.includes(url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
