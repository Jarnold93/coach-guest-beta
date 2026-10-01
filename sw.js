/* Coach Guest service worker: network-first so updates arrive on the next open, cached copy when offline. */
const V="coachgb-v1";
const SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable.png"];
self.addEventListener("install", e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=="coachgb-fonts").map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET") return;
  if(u.origin===location.origin){
    e.respondWith((async()=>{
      const c=await caches.open(V);
      try{
        const net=await Promise.race([fetch(e.request,{cache:"no-store"}), new Promise((_,rej)=>setTimeout(()=>rej(new Error("slow")),4000))]);
        if(net && net.ok) c.put(e.request.mode==="navigate"?"index.html":e.request, net.clone());
        return net;
      }catch(err){
        return (await c.match(e.request,{ignoreSearch:true})) || (await c.match("index.html")) || Response.error();
      }
    })());
    return;
  }
  if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open("coachgb-fonts").then(async c=>{ const hit=await c.match(e.request); const net=fetch(e.request).then(r=>{ if(r.ok) c.put(e.request,r.clone()); return r; }).catch(()=>hit); return hit||net; }));
  }
});
