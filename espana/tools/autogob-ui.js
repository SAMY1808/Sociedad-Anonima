/* Prueba de interfaz de Autogobierno (Playwright): competencias, presión y reforma del Estatuto.
   Uso: node tools/autogob-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8138, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8138/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  await cerrar();
  await pg.evaluate(() => { const E = ESP.E, rc = E.esp.ccaa.ARA, J = E.jugador; E.eventos.pendientes = []; E.ue.pendiente = []; rc.gob.pres = 'J'; J.cargo = 'presauto'; J.region = 'ARA'; J.escReg = true; J.agenda.puntos = 30; J.agenda.max = 30; E.ui.regAG = 'ARA'; ESP.App.ir('autogob'); });
  await pg.waitForSelector('[data-tab-ag]');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-autogob-comp.png` });
  const k = await pg.evaluate(() => { const rc = ESP.E.esp.ccaa.ARA; return Object.keys(ESP.DATA.competencias).find(x => rc.comp[x] < 2 && !ESP.DATA.competencias[x].ley); });
  const pr0 = await pg.evaluate(k => ESP.Territorio.probComp(ESP.E, 'ARA', k), k);
  await pg.evaluate(k => ESP.Acciones.ejecutar('presionar_competencia', { comp: k, via: 'calle' }), k); await pg.evaluate(() => ESP.App.refrescar());
  ok(await pg.evaluate(({ k, p0 }) => ESP.Territorio.probComp(ESP.E, 'ARA', k) > p0, { k, p0: pr0 }), 'la presión sube la probabilidad');
  await clic('[data-tab-ag="reforma"]'); await pg.waitForSelector('[data-accion="abrir_reforma_estatuto"], [data-acc="abrir_reforma_estatuto"], .btn');
  ok(await pg.evaluate(() => /Sin reforma en marcha/.test(document.getElementById('vista').textContent)), 'pestaña Reforma sin proceso');
  await pg.evaluate(() => { ESP.E.esp.ccaa.ARA.estatuto.proceso = null; ESP.E.esp.ccaa.ARA.estatuto.ultReforma = -99; ESP.Acciones.ejecutar('abrir_reforma_estatuto', {}); ESP.App.refrescar(); });
  await pg.waitForSelector('[data-art]');
  const ids = await pg.$$eval('[data-art]', b => b.slice(0, 3).map(x => x.dataset.art));
  for (const id of ids.slice(0, 3)) { await clic(`[data-art="${id}"]`); await pg.waitForTimeout(120); }
  ok(await pg.evaluate(() => ESP.E.esp.ccaa.ARA.estatuto.reforma.items.length === 3), 'se incluyen artículos en el borrador');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-autogob-borrador.png` });
  await pg.evaluate(() => { const T = ESP.Territorio, rc = ESP.E.esp.ccaa.ARA, r = rc.estatuto.reforma; r.items = r.items.filter(x => ['carta', 'inversion', 'lengua'].includes(x.id)).concat(['carta', 'inversion', 'lengua'].filter(id => !r.items.some(x => x.id === id)).map(id => ({ id, estado: 'pedido', ins: 0 }))); for (let i = 0; i < 10 && r.fase === 'borrador'; i++) { ESP.E.jugador.agenda.puntos = 30; ESP.E.fecha.t += 5; T.votarParlamento(ESP.E, 'ARA'); } ESP.App.refrescar(); });
  await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => ESP.E.esp.ccaa.ARA.estatuto.reforma.fase === 'comision'), 'el borrador pasa a negociación');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-autogob-comision.png` });
  ok(await pg.evaluate(() => /Negociación con el Estado/.test(document.getElementById('vista').textContent)), 'se ve la negociación');
  await pg.evaluate(() => { const r = ESP.E.esp.ccaa.ARA.estatuto.reforma; r.items.forEach(x => { if (x.estado === 'pedido' || x.estado === 'rechazado') x.estado = 'aceptado'; }); ESP.E.jugador.agenda.puntos = 30; ESP.Acciones.ejecutar('cerrar_acuerdo_estatuto', {}); ESP.App.refrescar(); }); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => /En las Cortes Generales/.test(document.getElementById('vista').textContent)), 'la reforma llega a las Cortes');
  await clic('[data-tab-ag="vigente"]'); ok(await pg.evaluate(() => /Estatuto de/.test(document.getElementById('vista').textContent)), 'pestaña Estatuto vigente');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
