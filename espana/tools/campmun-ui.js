/* Prueba de interfaz de la campaña municipal completa (pestaña «Municipales» de Elecciones). Uso: node tools/campmun-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil', PORT = movil ? 8292 : 8291;
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  await pg.goto(`http://localhost:${PORT}/index.html`); await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); const E = ESP.E, J = E.jugador; E.eventos.pendientes = []; E.ue.pendiente = []; E.ui.sinGuia = true; E.paises.ES.gob.pm = 'pan'; J.cargo = 'concejal'; J.nivel = 'local'; J.muni = 'm_bcn'; J.region = 'CAT'; J.agenda.puntos = 60; J.agenda.max = 60; E.esp.cortes.estado = 'activa'; });
  const avanza = (n, hasta) => pg.evaluate(([n, h]) => { const E = ESP.E; for (let i = 0; i < n; i++) { ESP.UI.cerrarModales(); E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteSocio = false; E.esp.pendienteInvestidura = false; E.esp.pendienteDebate = false; E.esp.pendienteVotoAut = null; E.esp.pendienteInvAut = null; E.esp.pendienteConvAut = null; E.esp.pendienteCongreso = false; E.esp.pendienteCrisisV = null; E.esp.pendienteSesion = null; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; if (E.esp.gab) E.esp.gab.escandalo = null; if (E.esp.consejo) for (const x of E.esp.consejo.agenda) x.urgente = false; E.esp.cortes.estado = E.esp.cortes.estado === 'disueltas' ? 'disueltas' : 'activa'; ESP.Tiempo.avanzar(); if (h && h()) break; } ESP.UI.cerrarModales(); E.elecciones.nochePendiente = null; E.jugador.agenda.puntos = 60; return E.fecha.t; }, [n, null]);
  const ver = () => pg.evaluate(() => { ESP.App.ir('elecciones', { tab: 'municipales' }); const v = document.getElementById('vista'); return { txt: v.innerText, w: v.scrollWidth, cw: document.documentElement.clientWidth, filas: v.querySelectorAll('.tarjeta table tbody tr').length }; });

  let v = await ver(); ok(/Tu campaña de las municipales/i.test(v.txt) && /Doce semanas/.test(v.txt), 'fuera de la ventana se explica la campaña municipal');
  await pg.evaluate(() => { ESP.E.esp.muni.proxT = ESP.E.fecha.t + 11; ESP.U.gauss = () => 0; }); await avanza(1); v = await ver();
  ok(/Campaña municipal/i.test(v.txt) && /Ciudades en disputa/i.test(v.txt), 'a doce semanas se abre el panel de campaña con las ciudades en disputa'); ok(v.filas >= 10, 'la tabla lista las ciudades más disputadas (' + v.filas + ' filas)'); ok(v.w <= v.cw + 2, 'no desborda horizontalmente (' + v.w + ' ≤ ' + v.cw + ')');
  ok(/tu ciudad/i.test(v.txt), 'tu ciudad aparece marcada'); if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/campmun.png' });
  const muni = await pg.evaluate(() => { const b = document.querySelector('#vista [data-accion="mitin_local"]'); return JSON.parse(b.dataset.args).muni; });
  const e0 = await pg.evaluate(m => ESP.E.esp.cmun.esf[m] || 0, muni); await pg.evaluate(m => { document.querySelector(`#vista [data-accion="mitin_local"][data-args*="${m}"]`).scrollIntoView({ block: 'center' }); }, muni); await pg.click(`#vista [data-accion="mitin_local"][data-args*="${muni}"]`); await pg.waitForTimeout(250);
  ok(await pg.evaluate(([m, e]) => (ESP.E.esp.cmun.esf[m] || 0) > e, [muni, e0]), 'el botón de mitin suma esfuerzo en esa ciudad'); v = await ver();
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 60; }); const lib0 = await pg.evaluate(() => ESP.CampMun.libre(ESP.E.esp.cmun));
  await pg.evaluate(m => { const f = [...document.querySelectorAll('#vista .accion-form')].find(x => x.querySelector('[data-arg="canal"]')); f.querySelector('[data-arg="muni"]').value = m; f.querySelector('[data-arg="canal"]').value = 'cartel'; }, muni);
  await clic('#vista [data-accion="gasto_local"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(l => ESP.CampMun.libre(ESP.E.esp.cmun) < l, lib0), 'el formulario de gasto local invierte presupuesto');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 60; }); v = await ver(); await clic('#vista [data-accion="encuesta_local"][data-args*="propia"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.E.esp.cmun.enc.tipo === 'propia'), 'la encuesta propia se encarga desde el panel'); v = await ver(); ok(/poco margen de error/.test(v.txt), 'el panel refleja que la previsión tiene poco margen de error');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 60; }); v = await ver(); await clic('#vista [data-accion="candidato_estrella"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => Object.keys(ESP.E.esp.cmun.estrella).length === 1), 'se ficha un candidato/a estrella desde la tabla');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 60; }); v = await ver(); await clic('#vista [data-accion="campana_mun_auto"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => Object.keys(ESP.E.esp.cmun.gasto).length >= 3), 'el reparto automático invierte en varias ciudades');
  // la pestaña «Campaña» muestra lo mismo para cargos locales
  const camp = await pg.evaluate(() => { ESP.App.ir('elecciones', { tab: 'campana' }); return document.getElementById('vista').innerText; }); ok(/Campaña municipal/i.test(camp), 'la pestaña «Campaña» de un cargo local muestra la campaña municipal');
  // tras las municipales: balance
  { const ult = await pg.evaluate(() => ESP.E.esp.muni.ult); for (let i = 0; i < 14; i++) { await avanza(1); if (await pg.evaluate(u => ESP.E.esp.muni.ult !== u, ult)) break; } }
  await pg.evaluate(() => { const J = ESP.E.jugador; J.cargo = 'concejal'; J.nivel = 'local'; J.muni = 'm_bcn'; }); v = await ver(); ok(/Balance de tu última campaña municipal/.test(v.txt) && !/Ciudades en disputa/i.test(v.txt), 'tras la votación aparece el balance de la campaña');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
