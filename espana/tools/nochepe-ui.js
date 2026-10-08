/* Prueba de la noche autonómica en directo (Playwright).
   Uso: node tools/nochepe-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8144, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8144/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); const E = ESP.E; E.eventos.pendientes = []; ESP.UE.celebrarPE(E); });
  await pg.evaluate(() => ESP.App.revisarPendientes());
  await pg.waitForSelector('.modal-fondo #nv-hora', { timeout: 8000 }); ok(true, 'se abre la noche europea en directo');
  await pg.waitForTimeout(4500); ok(await pg.evaluate(() => document.querySelectorAll('#nv-pais .etq').length >= 2 && document.querySelectorAll('#nv-hemi svg, #nv-hemi .hemi, #nv-hemi *').length > 3), 'los países se van escrutando');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-noche-pe.png` });
  const dec = await pg.$('#nv-dec [data-op]'); if (dec) await clic('#nv-dec [data-op="0"]');
  await clic('#nv-saltar'); await pg.waitForFunction(() => !document.querySelector('#nv-ok').disabled, null, { timeout: 8000 }); await clic('#nv-ok'); await pg.waitForSelector('#pe-ok', { timeout: 8000 }); ok(true, 'tras la noche se muestra el resumen clásico'); await clic('#pe-ok');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
