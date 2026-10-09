/* Prueba de la noche electoral en directo (Playwright): jornada, sondeo, escrutinio por tramos, decisiones y cierre.
   Uso: node tools/noche-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8142, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8142/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); const E = ESP.E; E.eventos.pendientes = []; E.esp.cortes.estado = 'disueltas'; E.esp.cortes.proxT = E.fecha.t + 6; ESP.Campana.iniciar(E); const c = ESP.Campana.cur(E); c.presup.total = 300; for (let i = 0; i < 4; i++) ESP.Campana.mover(E, E.jugador.partido, 0.3); ESP.E.ui.tabEl = 'campana'; ESP.App.ir('elecciones', { tab: 'campana' }); });
  await pg.waitForSelector('.tarjeta'); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => /Campaña viva/.test(document.getElementById('vista').textContent) && /Indecisos/.test(document.getElementById('vista').textContent)), 'el panel «Campaña viva» se muestra en la pestaña de campaña');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-campana-viva.png` });
  await pg.evaluate(() => { const E = ESP.E; ESP.Campana.cur(E).tVoto = E.fecha.t + 2; ESP.App.refrescar(); });
  ok(await pg.evaluate(() => !!document.querySelector('[data-accion="mitin_cierre"], [data-acc="mitin_cierre"]') || /Mitin de cierre/.test(document.getElementById('vista').textContent)), 'se ofrece el mitin de cierre en las dos últimas semanas');
  await pg.evaluate(() => { ESP.E.esp.camp = null; });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); const E = ESP.E; E.eventos.pendientes = []; E.esp.cortes.estado = 'disueltas'; ESP.Generales.celebrar(E); });
  await pg.evaluate(() => ESP.App.revisarPendientes());
  await pg.waitForSelector('.modal-fondo #n-hora', { timeout: 8000 }); ok(true, 'se abre la noche electoral');
  const T = async () => (await pg.evaluate(() => document.querySelector('#n-hora') ? document.querySelector('#n-hora').textContent : ''));
  // Decisiones: jornada, 20:00, llamada, balcón
  let esc = null;
  const decidir = async (nombre) => { await pg.waitForSelector('#n-dec [data-op]', { timeout: 40000 }); const txt = await pg.$eval('#n-dec h3', e => e.textContent); esc = await pg.evaluate(() => { const e = document.querySelector('#n-dec .escena'); return e ? e.dataset.escena : null; }); await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-noche-${nombre}.png` }); await clic('#n-dec [data-op="0"]'); await pg.waitForTimeout(200); return txt; };
  ok(/Tu voto/.test(await decidir('jornada')), 'decisión de la jornada');
  ok(/20:00/.test(await decidir('decl20')), 'declaración a las 20:00');
  await pg.waitForTimeout(3500); await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-noche-parcial.png` });
  ok(await pg.evaluate(() => /escrutinio/i.test(document.querySelector('#n-bol').textContent) && document.querySelectorAll('#n-tele .it').length >= 2), 'escrutinio en marcha con comentarios');
  // Salta al final y decide el balcón
  await clic('#n-saltar'); const bal = await decidir('balcon'); ok(/balc|Comparecencia/i.test(bal), 'discurso desde el balcón: ' + bal); ok(/^noche_/.test(esc || ''), 'el discurso muestra el atril del partido (escena ' + esc + ')');
  await pg.waitForFunction(() => !document.querySelector('#n-cerrar').disabled, null, { timeout: 8000 }); ok(await pg.evaluate(() => /Tu resultado/.test(document.querySelector('#n-final').textContent)), 'resultado final y mapa');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-noche-final.png` });
  await clic('#n-cerrar'); await pg.waitForTimeout(400); ok(!(await pg.$('#n-hora')), 'se cierra la noche');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
