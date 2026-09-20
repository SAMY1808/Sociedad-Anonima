/* Sociedad Anónima — service worker v42 */
const CACHE='sociedad-anonima-v42';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>null))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  if(url.protocol!=='http:' && url.protocol!=='https:') return;

  event.respondWith(
    fetch(req)
      .then(res=>{
        if(res && res.ok && res.type==='basic'){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
        }
        return res;
      })
      .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
  );
});

self.addEventListener('message',e=>{
  if(e.data==='skipWaiting') self.skipWaiting();
});
