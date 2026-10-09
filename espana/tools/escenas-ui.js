/* Prueba de las escenas ilustradas: se dibujan todas sin errores y quedan enlazadas en los momentos clave. Uso: node tools/escenas-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8181, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8181/index.html'); await pg.waitForSelector('#i-nueva'); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await pg.click('[data-nivel="nacional"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-partido]'); await pg.click('[data-partido="ES_ASD"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-rol]'); await pg.click('[data-rol="lider"]'); await pg.click('#c-sig'); await pg.waitForSelector('#c-ok'); await pg.click('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; });
  const ids = await pg.evaluate(() => ESP.Escenas.ids());
  ok(ids.length >= 14, 'catálogo de ' + ids.length + ' escenas');
  const rival = await pg.evaluate(() => ESP.E.paises.ES.partidos.find(k => k !== ESP.E.jugador.partido));
  const html = await pg.evaluate(([ids, rival]) => { const o = {}; for (const id of ids) o[id] = ESP.Escenas.html(ESP.E, id, { pid: ESP.E.jugador.partido, pid2: rival }); return o; }, [ids, rival]);
  for (const id of ids) ok(/<svg/.test(html[id]) && !/NaN|undefined|\[object/.test(html[id]) && html[id].length > 1500, 'escena ' + id + ' (' + Math.round(html[id].length / 1024) + ' KB)');
  // Hoja de contacto
  await pg.evaluate(ids => { const d = document.createElement('div'); d.id = 'hoja'; d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0a111d;overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(' + (window.innerWidth < 600 ? '170' : '400') + 'px,1fr));gap:8px'; d.innerHTML = ids.map(id => ESP.Escenas.html(ESP.E, id, { pid: ESP.E.jugador.partido, pid2: ESP.E.paises.ES.partidos.find(k => k !== ESP.E.jugador.partido) })).join(''); document.body.appendChild(d); }, ids);
  await pg.waitForTimeout(300);
  const ocupan = await pg.evaluate(() => [...document.querySelectorAll('#hoja .escena')].every(f => { const r = f.getBoundingClientRect(); return r.width > 100 && r.height > 40; }));
  ok(ocupan, 'todas las escenas tienen tamaño visible');
  await pg.screenshot({ path: `/tmp/claude-0/shots/escenas-${movil ? 'm' : 'd'}.png`, fullPage: false });
  await pg.evaluate(() => document.getElementById('hoja').remove());
  // Imagen propia: si hay un archivo asociado se muestra encima de la ilustración
  const conImg = await pg.evaluate(() => { ESP.IMAGENES.funeral_estado = 'icon-192.png'; const h = ESP.Escenas.html(ESP.E, 'funeral_estado'); delete ESP.IMAGENES.funeral_estado; return /<img src="icon-192.png"/.test(h) && /<svg/.test(h); });
  ok(conImg, 'una imagen asociada se muestra sobre la ilustración de respaldo');
  // Integración en los momentos clave
  const modal = async f => { const r = await pg.evaluate(f); await pg.waitForTimeout(150); const id = await pg.evaluate(() => { const e = document.querySelector('.modal-fondo .escena'); return e ? e.dataset.escena : null; }); await pg.evaluate(() => ESP.UI.cerrarModales()); return id; };
  const crisis = paso => modal(`(() => { const E = ESP.E, cv = ESP.CrisisDirecto.asegurar(E); cv.act.length = 0; const cr = { uid: 'cvt', id: 'cv_atentado', a: 'nac', lugar: null, sev: 2, t0: E.fecha.t, paso: ${paso}, elec: [], log: [], jug: true }; cv.act.push(cr); E.esp.pendienteCrisisV = cr.uid; ESP.Pantallas.crisis2.modal(cr.uid); cv.act.length = 0; E.esp.pendienteCrisisV = null; })()`);
  ok(await crisis(2) === 'funeral_estado', 'el funeral de Estado de la crisis del atentado muestra su escena');
  ok(await crisis(0) === 'emergencia', 'el primer paso del atentado muestra la escena de emergencia');
  const mapa = await pg.evaluate(() => { const l = ESP.DATA.crisisDirecto; let n = 0, m = 0; for (const s of l) for (const p of s.pasos) { n++; if (ESP.Escenas.paraCrisis({ id: s.id }, s, p)) m++; } return [n, m]; });
  ok(mapa[1] >= 20, 'escenas asignadas a ' + mapa[1] + ' de ' + mapa[0] + ' pasos de crisis');
  ok(await modal(`(() => { const E = ESP.E; E.eventos.pendientes.length = 0; ESP.Eventos.info(E, '🏁 Fin', 'prueba', 'retirada'); ESP.App.modalEvento(E.eventos.pendientes[0]); E.eventos.pendientes.length = 0; })()`) === 'retirada', 'el fin de carrera muestra su escena');
  ok(await modal(`(() => { const E = ESP.E; E.paises.ES.gob.pm = 'J'; ESP.Pantallas.gabinete.formacion({ key: 'central', formacion: true }); })()`) === 'toma_posesion', 'la formación del Gobierno muestra la promesa del cargo');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
