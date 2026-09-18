const CACHE="sociedad-anonima-v35";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-180.png"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).catch(()=>{})))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const isNav=event.request.mode==="navigate" || (event.request.headers.get("accept")||"").includes("text/html");
  if(isNav){
    event.respondWith(fetch(event.request,{cache:"no-store"}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy)).catch(()=>{});return r}).catch(()=>caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});return r})).catch(()=>caches.match("./index.html")));
});
