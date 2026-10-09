/* Prueba de la noche autonómica en directo (Playwright).
   Uso: node tools/nocheaut-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8143, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8143/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); const E = ESP.E; E.eventos.pendientes = []; const c = E.jugador.region; E.esp.jornada = E.esp.jornada || {}; ESP.Territorio.celebrar(E, c); ESP.Territorio.cerrarJornada(E); });
  await pg.evaluate(() => ESP.App.revisarPendientes());
  await pg.waitForSelector('.modal-fondo #na-hora', { timeout: 8000 }); ok(true, 'se abre la noche autonómica en directo');
  await pg.waitForSelector('#na-dec [data-op]', { timeout: 10000 }); await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-nocheaut-20.png` }); await clic('#na-dec [data-op="0"]');
  await pg.waitForTimeout(4200); ok(await pg.evaluate(() => /Escrutinio/.test(document.querySelector('#na-bol').textContent) && document.querySelectorAll('#na-tele .it').length >= 2), 'escrutinio en marcha con comentarios');
  await clic('#na-saltar'); await pg.waitForSelector('#na-dec [data-op]', { timeout: 8000 }); ok(await pg.evaluate(() => !!document.querySelector('#na-dec .escena[data-escena^="noche_"]')), 'el discurso autonómico muestra la escena de la noche electoral'); await clic('#na-dec [data-op="0"]'); await pg.waitForFunction(() => !document.querySelector('#na-ok').disabled, null, { timeout: 8000 });
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-nocheaut-final.png` }); await clic('#na-ok'); await pg.waitForSelector('#nv-saltar', { timeout: 8000 }); ok(true, 'después se retransmite la jornada nacional (comunidades y ciudades)'); await pg.waitForTimeout(3500); ok(await pg.evaluate(() => document.querySelectorAll('#nv-reg .it').length >= 1), 'las comunidades se van desvelando'); await clic('#nv-saltar'); await pg.waitForFunction(() => !document.querySelector('#nv-ok').disabled, null, { timeout: 8000 }); await clic('#nv-ok'); await pg.waitForSelector('#nl-ok', { timeout: 8000 }); ok(true, 'tras la noche en directo se muestra el resumen clásico'); await clic('#nl-ok');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
