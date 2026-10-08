/* Prueba de la noche autonómica en directo (Playwright).
   Uso: node tools/escision-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8148, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8148/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); const E = ESP.E, J = E.jugador, pa = E.partidos[J.partido]; E.eventos.pendientes = []; J.rol = 'direccion'; J.cargo = 'diputado'; pa.lider = Object.keys(E.politicos).find(id => id !== 'J' && E.politicos[id].p === J.partido); ESP.PartidoInt.asegurar(E).fac.critico = 40; E.partidos[J.partido].cohesion = 45; E.esp.cortes.estado = 'activa'; E.esp.esn = []; E.ui.tabPartido = 'interno'; J.agenda.puntos = 20; ESP.App.ir('partido'); });
  await pg.waitForSelector('[data-accion="exigir_congreso"]', { timeout: 8000 }); ok(true, 'la tarjeta de congreso y escisiones aparece en Mi partido → Interno');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-escision.png` });
  const p0 = await pg.evaluate(() => ESP.PartidoInt.asegurar(ESP.E).cong.presion); await clic('[data-accion="exigir_congreso"]'); await pg.waitForTimeout(400); ok(await pg.evaluate(p => ESP.PartidoInt.asegurar(ESP.E).cong.presion > p, p0), 'exigir un congreso sube la presión');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 20; ESP.App.refrescar(); }); await pg.waitForSelector('[data-accion="liderar_escision"]'); await clic('[data-accion="liderar_escision"]'); await pg.waitForTimeout(500);
  ok(await pg.evaluate(() => ESP.E.jugador.rol === 'lider' && ESP.E.partidos[ESP.E.jugador.partido].nuevo === true && ESP.E.partidos[ESP.E.jugador.partido].lider === 'J'), 'liderar la escisión cambia tu partido y te hace líder');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
