/* Alcalde — service worker */
const CACHE='alcalde-v5';
const CORE=['./','./index.html','./style.css','./game.js','./manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE&&x.startsWith('alcalde-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  e.respondWith(fetch(r).then(res=>{if(res&&res.ok&&res.type==='basic'){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c)).catch(()=>{})}return res}).catch(()=>caches.match(r).then(x=>x||caches.match('./index.html'))));
});
