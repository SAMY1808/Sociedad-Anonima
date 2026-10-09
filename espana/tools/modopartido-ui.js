/* Prueba de la noche autonómica en directo (Playwright).
   Uso: node tools/modopartido-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8149, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8149/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel="partido"]');
  await clic('[data-nivel="partido"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_UPC"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]');
  ok(await pg.evaluate(() => document.querySelector('[data-rol="lider"]').classList.contains('sel')), 'en Modo Partido el rol queda fijado como líder');
  await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; }); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => ESP.E.meta.modoPartido === true && ESP.E.jugador.rol === 'lider' && ESP.E.ui.pantalla === 'sede'), 'la partida arranca en la Sede del partido');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-sede-resumen.png` });
  for (const t of ['programa', 'territorio', 'finanzas', 'equipo', 'candidatos', 'estrategia', 'encuestas']) { await clic(`[data-ts="${t}"]`); await pg.waitForTimeout(150); ok(await pg.evaluate(() => !!document.querySelector('#vista h1') && !/Error de interfaz/.test(document.getElementById('vista').textContent)), 'pestaña ' + t); if (t === 'territorio') await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-sede-territorio.png` }); }
  await clic('[data-ts="programa"]'); const antes = await pg.evaluate(() => Object.keys(ESP.Sede.asegurar(ESP.E).prog).length); await clic('[data-accion="fijar_programa"]'); await pg.waitForTimeout(300); ok(await pg.evaluate(a => Object.keys(ESP.Sede.asegurar(ESP.E).prog).length > a, antes), 'adoptar una postura del programa desde la interfaz');
  await clic('[data-ts="territorio"]'); await pg.evaluate(() => { ESP.E.ui.sedeProv = 'MAD'; ESP.E.jugador.agenda.puntos = 20; ESP.App.refrescar(); }); await pg.waitForSelector('[data-accion="abrir_sede"]'); const i0 = await pg.evaluate(() => ESP.Sede.asegurar(ESP.E).impl.MAD); await clic('[data-accion="abrir_sede"]'); await pg.waitForTimeout(300); ok(await pg.evaluate(i => ESP.Sede.asegurar(ESP.E).impl.MAD > i, i0), 'abrir una sede desde el mapa');
  await clic('[data-ts="encuestas"]'); await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 20; ESP.App.refrescar(); }); await clic('[data-accion="encuesta_colectivos"]'); await pg.waitForTimeout(300); ok(await pg.evaluate(() => document.querySelectorAll('#vista table.tabla tbody tr').length >= 8 && /bolsa de voto/.test(document.getElementById('vista').innerText)), 'la encuesta por colectivos muestra el reparto del voto');
  // Fase 3: organizaciones, militancia, objetivos e informe
  for (const t of ['parlamento', 'alianzas', 'organizaciones', 'militancia', 'objetivos']) { await clic(`[data-ts="${t}"]`); await pg.waitForTimeout(150); ok(await pg.evaluate(() => !!document.querySelector('#vista h1') && !/Error de interfaz/.test(document.querySelector('#vista').innerText)), 'pestaña de la sede: ' + t); }
  await clic('[data-ts="militancia"]'); await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 20; ESP.E.partidos[ESP.E.jugador.partido].finanzas = 60; ESP.App.refrescar(); }); await clic('[data-accion="fijar_censo"][data-args*="abierto"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.Militancia.censo(ESP.E) === 'abierto'), 'militancia: se abre el censo de las primarias desde la pestaña');
  await clic('[data-accion="afiliacion_masiva"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.Sede.asegurar(ESP.E).cd.afil != null), 'militancia: afiliación masiva desde la pestaña');
  await clic('[data-ts="objetivos"]'); await pg.evaluate(() => { const E = ESP.E; E.jugador.agenda.puntos = 20; const o = ESP.Objetivos.asegurar(E); o.act.length = 0; ESP.App.refrescar(); });
  const idObj = await pg.evaluate(() => Object.keys(ESP.Objetivos.OBJ).find(k => !ESP.Objetivos.cumple(ESP.E, k))); await clic(`[data-accion="fijar_objetivo"][data-args*="${idObj}"]`); await pg.waitForTimeout(250); ok(await pg.evaluate(i => ESP.Objetivos.asegurar(ESP.E).act.some(x => x.id === i), idObj), 'objetivos: se fija un objetivo desde la pestaña (' + idObj + ')');
  ok(await pg.evaluate(() => /puntuaci[oó]n del partido/i.test(document.querySelector('#vista').innerText) && /objetivos en curso/i.test(document.querySelector('#vista').innerText)), 'objetivos: se ve la puntuación y el objetivo en curso');
  await pg.evaluate(() => { ESP.E.ui.tabLegado = 'fama'; ESP.App.ir('legado'); }); await pg.waitForTimeout(300); ok(await pg.evaluate(() => /ranking de partidos/i.test(document.querySelector('#vista').innerText)), 'Salón de la fama: ranking de partidos');
  await pg.evaluate(() => ESP.App.ir('ajustes')); await clic('#aj-inf'); await pg.waitForTimeout(200); ok(await pg.evaluate(() => /INFORME DE PARTIDA/.test(document.querySelector('#aj-inf-t').value)), 'ajustes: se genera el informe de partida');
  await pg.evaluate(() => ESP.App.ir('sede'));
  ok(await pg.evaluate(() => !document.querySelector('#nav [data-p="personaje"]') && !!document.querySelector('#barra [data-ir="sede"]')), 'la vista de partido oculta «Mi carrera» y muestra la dirección en la barra');
  await pg.evaluate(() => ESP.App.ir('ajustes')); await clic('[data-aj="vista"][data-v="persona"]'); await pg.waitForTimeout(300); ok(await pg.evaluate(() => !!document.querySelector('#nav [data-p="personaje"]') && ESP.E.meta.vistaPartido === false), 'se puede volver a la vista de persona desde Ajustes');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
