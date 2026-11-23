/* Sociedad Anónima — service worker v213 */
const CACHE='sociedad-anonima-v213';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];

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

/* «Jugar sin internet»: la página manda la lista de archivos y aquí se guardan de a seis,
   avisando cuántos van. Lo que ya está guardado no se vuelve a bajar. */
async function precargar(cliente,urls){
  const c=await caches.open(CACHE); let hechas=0, fallos=0; const total=urls.length;
  const avisar=tipo=>{ try{ cliente&&cliente.postMessage({tipo,hechas,fallos,total}); }catch(x){} };
  avisar('progreso');
  for(let i=0;i<urls.length;i+=6){
    await Promise.all(urls.slice(i,i+6).map(async u=>{
      try{
        if(await c.match(u)){ hechas++; return; }
        const r=await fetch(u);
        if(r && r.ok){ await c.put(u,r); hechas++; } else fallos++;
      }catch(x){ fallos++; }
    }));
    avisar('progreso');
  }
  avisar('fin');
}

self.addEventListener('message',e=>{
  if(e.data==='skipWaiting') self.skipWaiting();
  else if(e.data && e.data.tipo==='precargar' && Array.isArray(e.data.urls)) e.waitUntil(precargar(e.source,e.data.urls));
});
