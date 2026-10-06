/* Prueba de interfaz del Parlamento autonómico (Playwright): pestañas, disolución, Diputación Permanente y votación de convalidación.
   Uso: node tools/parlaut-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8137, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8137/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  await cerrar();
  await pg.evaluate(() => { const E = ESP.E, T = ESP.Territorio; E.eventos.pendientes = []; E.ue.pendiente = []; E.ui.regPA = 'ARA'; ESP.App.ir('parlaut'); });
  await pg.waitForSelector('[data-tab-pa]');
  for (const t of ['pleno', 'leyes', 'decretos', 'dp', 'votos']) {
    await pg.evaluate(t => ESP.App.ir('parlaut', { tab: t }), t); await pg.waitForTimeout(200);
    ok(await pg.evaluate(() => !/Error de interfaz/.test(document.getElementById('vista').textContent) && !!document.querySelector('#vista h1')), 'pestaña ' + t);
  }
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-parlaut-dp.png` });
  // Disolución y decreto-ley con voto del jugador
  await pg.evaluate(() => { const E = ESP.E, T = ESP.Territorio, J = E.jugador; J.region = 'ARA'; J.escReg = true; J.rol = 'portavoz'; J.partido = E.esp.ccaa.ARA.gob.coalicion.find(k => k !== E.esp.ccaa.ARA.gob.partido) || J.partido; const rc = E.esp.ccaa.ARA; rc.parl.escanos[J.partido] = Math.max(6, rc.parl.escanos[J.partido] || 0); T.dp(E, 'ARA'); T.adelantar(E, 'ARA', 'de prueba'); for (let i = 0; i < 2; i++) { ESP.Tiempo.avanzar(); } E.eventos.pendientes = []; const p = T.leyesDisponibles(E, 'ARA')[2]; const r = T.decretar(E, 'ARA', p.id, { quien: 'Prueba' }); E.fecha.t += 4; T.parlTurno(E, 'ARA'); E.eventos.pendientes = []; ESP.App.refrescar(); });
  await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !!ESP.E.esp.pendienteConvAut), 'queda pendiente la convalidación para el jugador');
  await pg.evaluate(() => { ESP.App.ir('parlaut', { tab: 'decretos' }); ESP.App.revisarPendientes(); }); await pg.waitForSelector('.modal-fondo [data-v]', { timeout: 6000 });
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-parlaut-conv.png` });
  await clic('.modal-fondo [data-v="si"]'); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !ESP.E.esp.pendienteConvAut && ESP.Territorio.paAsegurar(ESP.E, 'ARA').hist.length >= 1), 'voto de convalidación registrado');
  await pg.evaluate(() => ESP.App.ir('parlaut', { tab: 'votos' })); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => /Decreto-ley/.test(document.getElementById('vista').textContent)), 'la votación aparece en el historial');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
