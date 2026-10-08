/* Prueba de la noche autonómica en directo (Playwright).
   Uso: node tools/sesion-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8147, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8147/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); const E = ESP.E, J = E.jugador, Ej = ESP.Ejecutivo, c = E.esp.cortes; E.eventos.pendientes = []; J.rol = 'lider'; E.partidos[J.partido].lider = 'J'; const cand = J.partido; c.estado = 'investidura'; c.fallidos = []; c.t1 = null; c.investidura = { cand, plan: Ej.mejorPlan(E, cand), tVoto: E.fecha.t, negociaJ: false }; Ej.votar(E); ESP.App.revisarPendientes(); });
  await pg.waitForSelector('.modal-fondo [data-o]', { timeout: 8000 }); ok(true, 'se abre la sesión de investidura en directo');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-sesion.png` });
  await clic('.modal-fondo [data-o="0"]'); await pg.waitForSelector('.modal-fondo [data-o]'); await clic('.modal-fondo [data-o="0"]');
  await pg.waitForSelector('#se-bar', { timeout: 5000 }); ok(true, 'comienza la votación nominal');
  await pg.waitForSelector('#se-ok', { timeout: 20000 }); ok(await pg.evaluate(() => document.querySelectorAll('#se-g .it').length >= 3 && /votos a favor/.test(document.querySelector('#se-fin').innerText)), 'la sesión desvela los grupos y el resultado'); await clic('#se-ok');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
