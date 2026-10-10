/* Prueba de interfaz del cabildeo del Estatuto: «Dónde está el bloqueo», cabildeo y contrapartida por grupo, suavizar, votación por artículos y cabildeo en las Cortes. Uso: node tools/estatuto-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil', PORT = movil ? 8242 : 8241;
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  await pg.goto(`http://localhost:${PORT}/index.html`); await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); const E = ESP.E, J = E.jugador, rc = E.esp.ccaa.CAT; E.eventos.pendientes = []; E.ue.pendiente = []; E.ui.sinGuia = true; E.paises.ES.gob.pm = 'otro'; rc.gob.pres = 'J'; J.cargo = 'presauto'; J.nivel = 'autonomico'; J.region = 'CAT'; J.escReg = true; J.agenda.puntos = 60; J.agenda.max = 60; E.ui.regAG = 'CAT'; E.esp.cortes.estado = 'activa'; rc.relM = 60; rc.estatuto.proceso = null; rc.estatuto.ultReforma = -99; ESP.U.gauss = () => 0; });
  const ir = (tab) => pg.evaluate(t => { ESP.App.ir('autogob', { tab: t }); const v = document.getElementById('vista'); return { txt: v.innerText, w: v.scrollWidth, cw: document.documentElement.clientWidth }; }, tab);
  const pts = () => pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 60; });

  // Parlamento controlado: el partido del Gobierno y otro grupo, mitad y mitad, para que el resultado no dependa del azar de la partida
  await pg.evaluate(() => { const rc = ESP.E.esp.ccaa.CAT, ks = Object.keys(rc.parl.escanos), gp = rc.gob.partido, otro = ks.find(k => k !== gp); ks.forEach(k => { rc.parl.escanos[k] = 0; }); rc.parl.escanos[gp] = 60; rc.parl.escanos[otro] = 60; rc.gob.coalicion = [gp]; ESP.E.partidos[gp].ter = 0; ESP.E.partidos[otro].ter = 0; ESP.E.partidos[otro].amb = 'nac'; });
  // 1. Borrador con artículos ambiciosos: apoyo, objeciones y bloqueo
  await pg.evaluate(() => { ESP.Acciones.ejecutar('abrir_reforma_estatuto', {}); }); let v = await ir('reforma'); await pg.waitForSelector('[data-art]');
  for (const id of ['inversion', 'carta', 'lengua', 'consulta', 'nacionalidad', 'financ', 'justicia', 'agencia']) { await clic(`[data-art="${id}"]`); await pg.waitForTimeout(80); }
  ok(await pg.evaluate(() => ESP.E.esp.ccaa.CAT.estatuto.reforma.items.length === 8), 'se incluyen ocho artículos en el borrador');
  v = await ir('reforma'); ok(/Le disgusta/.test(v.txt) && /Dónde está el bloqueo/i.test(v.txt), 'la pestaña muestra qué artículos disgustan a cada grupo y dónde está el bloqueo');
  ok(v.w <= v.cw + 2, 'no desborda horizontalmente (' + v.w + ' ≤ ' + v.cw + ')');
  const nb = await pg.$$('#vista [data-accion="cabildear_estatuto"]'), nc = await pg.$$('#vista [data-accion="contrapartida_estatuto"]'); ok(nb.length >= 3 && nc.length === nb.length, 'cada grupo tiene sus botones de cabildeo y contrapartida (' + nb.length + ')');
  ok(!!(await pg.$('#vista [data-accion="suavizar_articulo"]')), 'los artículos incluidos ofrecen «Suavizar»');
  ok(!(await pg.$('#vista [data-accion="votar_articulos_estatuto"]')), 'la votación por artículos aún no se ofrece');
  // cabildear desde el botón de un grupo
  const pid = await pg.evaluate(() => { const bt = [...document.querySelectorAll('#vista [data-accion="cabildear_estatuto"]')].find(x => !x.classList.contains('desact')); return bt ? JSON.parse(bt.dataset.args).pid : null; }); ok(!!pid, 'hay un grupo al que cabildear (' + pid + ')');
  await pg.evaluate(p => { const bt = [...document.querySelectorAll('#vista [data-accion="cabildear_estatuto"]')].find(x => JSON.parse(x.dataset.args).pid === p); bt.scrollIntoView({ block: 'center' }); }, pid); await pg.click(`#vista [data-accion="cabildear_estatuto"][data-args*="${pid}"]`); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => ESP.E.jugador.agenda.hechas.some(h => h.id === 'cabildear_estatuto')), 'el botón de un grupo cabildea (cuesta un punto de agenda)');
  await pts(); await pg.evaluate(p => { const f = ESP.E.esp.ccaa.CAT.estatuto.reforma; f.cabT = {}; f.cab = {}; }, pid);
  // 2. Presentar: falla; aparece la votación por artículos
  v = await ir('reforma'); await clic('#vista [data-accion="presentar_reforma_estatuto"]'); await pg.waitForTimeout(200); v = await ir('reforma');
  const dbg = await pg.evaluate(() => { const E = ESP.E, rc = E.esp.ccaa.CAT, f = rc.estatuto.reforma, a = ESP.Territorio.apoyoReforma(E, 'CAT', f.items.map(x => x.id), true); return JSON.stringify({ fallos: f.fallos, fase: f.fase, si: a.si, req: a.req, tot: a.tot, items: f.items.length, esc: rc.parl.escanos, gob: rc.gob.partido, coal: rc.gob.coalicion }); });
  ok(await pg.evaluate(() => ESP.E.esp.ccaa.CAT.estatuto.reforma.fallos >= 1), 'el paquete ambicioso falla en el Parlamento (' + JSON.parse(dbg).si + ' de ' + JSON.parse(dbg).req + ' necesarios)'); ok(!!(await pg.$('#vista [data-accion="votar_articulos_estatuto"]')) && /votos? fallidos?/i.test(v.txt), 'tras el fallo se ofrece la votación por artículos');
  await pts(); await pg.evaluate(() => { ESP.E.fecha.t += 5; }); v = await ir('reforma');
  await clic('#vista [data-accion="votar_articulos_estatuto"]'); await pg.waitForTimeout(250); v = await ir('reforma');
  const fase = await pg.evaluate(() => { const f = ESP.E.esp.ccaa.CAT.estatuto.reforma; return { fase: f.fase, items: f.items.map(x => x.id), caidos: f.caidos || [] }; });
  ok(fase.fase === 'comision' && fase.items.length >= 2 && fase.caidos.length > 0, 'la votación por artículos salva los moderados y deja caer los demás (' + fase.items.join(',') + ' | caen ' + fase.caidos.join(',') + ')');
  ok(/Negociación con el Estado/i.test(v.txt), 'el proceso pasa a la negociación con el Estado');
  // 3. Texto en las Cortes: cabildeo y retirada
  await pg.evaluate(() => { const E = ESP.E, f = E.esp.ccaa.CAT.estatuto.reforma; for (const x of f.items) x.estado = 'aceptado'; f.items.push({ id: 'consulta', estado: 'aceptado', ins: 0 }); E.jugador.agenda.puntos = 60; ESP.Territorio.cerrarAcuerdo(E, 'CAT'); });
  v = await ir('reforma'); ok(/Cabildeo en las Cortes/i.test(v.txt), 'en las Cortes aparece el cuadro de cabildeo'); ok(v.w <= v.cw + 2, 'el cuadro de las Cortes no desborda (' + v.w + ' ≤ ' + v.cw + ')');
  const nRet = (await pg.$$('#vista [data-accion="retirar_articulo_cortes"]')).length; ok(nRet >= 2, 'cada artículo del texto se puede retirar (' + nRet + ')');
  const n0 = await pg.evaluate(() => ESP.E.proyectos[ESP.E.esp.ccaa.CAT.estatuto.reforma.propId].estIt.length);
  await clic('#vista [data-accion="retirar_articulo_cortes"][data-args*="consulta"]'); await pg.waitForTimeout(250);
  ok(await pg.evaluate(n => ESP.E.proyectos[ESP.E.esp.ccaa.CAT.estatuto.reforma.propId].estIt.length === n - 1, n0), 'el botón retira «consulta popular» del texto');
  await pts(); v = await ir('reforma'); await pg.evaluate(() => { document.querySelector('#vista [data-accion="cabildear_estatuto"]').scrollIntoView({ block: 'center' }); });
  await pg.click('#vista [data-accion="cabildear_estatuto"]'); await pg.waitForTimeout(200); ok(await pg.evaluate(() => ESP.E.jugador.agenda.hechas.filter(h => h.id === 'cabildear_estatuto').length >= 2), 'desde las Cortes también se cabildea a los grupos');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/estatuto-cortes.png' });
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
