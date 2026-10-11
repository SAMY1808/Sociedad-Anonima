/* Prueba de interfaz de la reforma de la financiación autonómica y del cupo (pestaña «Financiación» de Territorio). Uso: node tools/financia-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil', PORT = movil ? 8282 : 8281;
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  await pg.goto(`http://localhost:${PORT}/index.html`); await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const poner = (cargo, region) => pg.evaluate(([c, reg]) => { const E = ESP.E, J = E.jugador, G = E.paises.ES.gob; ESP.UI.cerrarModales(); E.eventos.pendientes = []; E.ue.pendiente = []; E.ui.sinGuia = true; E.esp.cortes.estado = 'activa'; J.agenda.puntos = 60; J.agenda.max = 60; ESP.U.gauss = () => 0;
    for (const k of Object.keys(E.esp.ccaa)) if (E.esp.ccaa[k].gob && E.esp.ccaa[k].gob.pres === 'J') E.esp.ccaa[k].gob.pres = 'pan';
    if (c === 'pm') { G.pm = 'J'; J.cargo = 'pm'; J.nivel = 'nacional'; } else { G.pm = 'pan'; J.cargo = 'presauto'; J.nivel = 'autonomico'; J.region = reg; J.escReg = true; E.esp.ccaa[reg].gob.pres = 'J'; }
    E.esp.fa = null; return true; }, [cargo, region]);
  const ver = () => pg.evaluate(() => { ESP.App.ir('territorio', { tab: 'financiacion' }); const v = document.getElementById('vista'); return { txt: v.innerText, w: v.scrollWidth, cw: document.documentElement.clientWidth, filas: v.querySelectorAll('.tarjeta table tbody tr').length, bnd: v.querySelectorAll('svg.bnd').length }; });

  // 1. Presidente del Gobierno
  await poner('pm'); let v = await ver(); ok(/Reforma del sistema de financiación/i.test(v.txt) && /Abrir la reforma/.test(v.txt), 'sin reforma en marcha se explica y se ofrece abrirla'); ok(/cupo/i.test(v.txt) && /Concierto/i.test(v.txt), 'se muestra el bloque del Concierto y el cupo');
  await pg.evaluate(() => { const f = [...document.querySelectorAll('#vista .accion-form')].find(x => x.querySelector('[data-arg="modelo"]')); f.querySelector('[data-arg="modelo"]').value = 'solidario'; f.querySelector('[data-arg="garantia"]').value = '0'; f.querySelector('[data-arg="fondo"]').value = '0'; });
  await clic('#vista [data-accion="abrir_reforma_financiacion"]'); await pg.waitForTimeout(250); v = await ver();
  ok(await pg.evaluate(() => !!ESP.E.esp.fa.ref && ESP.E.esp.fa.ref.modelo === 'solidario'), 'el formulario abre la reforma con el modelo elegido'); ok(/Previsión del Consejo/i.test(v.txt) && /hacen falta/.test(v.txt), 'aparece la previsión del Consejo'); ok(v.bnd >= 15 && v.filas >= 15, 'la tabla lista las 15 comunidades con su bandera (' + v.filas + ' filas, ' + v.bnd + ' banderas)'); ok(v.w <= v.cw + 2, 'no desborda horizontalmente (' + v.w + ' ≤ ' + v.cw + ')');
  await clic('#vista [data-accion="ajustar_financiacion"][data-args*="garantia"]'); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => ESP.E.esp.fa.ref.garantia === true), 'el botón añade la garantía de que nadie pierde'); v = await ver(); ok(/Garantía: nadie pierde/.test(v.txt), 'la garantía se refleja en la ficha');
  await clic('#vista [data-accion="ajustar_financiacion"][data-args*="\\"fondo\\":2"]'); await pg.waitForTimeout(200); ok(await pg.evaluate(() => ESP.E.esp.fa.ref.fondo === 2), 'el botón fija el fondo transitorio');
  const c1 = await pg.evaluate(() => { const bt = [...document.querySelectorAll('#vista [data-accion="cabildear_ccaa_fin"]')].find(x => !x.classList.contains('desact')); return bt ? JSON.parse(bt.dataset.args).c : null; }); ok(!!c1, 'cada comunidad tiene botones de cabildeo y contrapartida');
  await pg.evaluate(c => { document.querySelector(`#vista [data-accion="contrapartida_ccaa_fin"][data-args*="${c}"]`).scrollIntoView({ block: 'center' }); }, c1); await pg.click(`#vista [data-accion="contrapartida_ccaa_fin"][data-args*="${c1}"]`); await pg.waitForTimeout(250);
  ok(await pg.evaluate(c => ESP.E.esp.fa.ref.contra[c] === true, c1), 'la contrapartida se pacta desde el botón de la comunidad');
  await pg.evaluate(() => { const r = ESP.E.esp.fa.ref; for (const c of ESP.Financia.participantes(ESP.E)) r.cab[c] = 1.4; ESP.E.jugador.agenda.puntos = 60; ESP.App.refrescar(); }); v = await ver();
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/financia-pm.png' });
  await clic('#vista [data-accion="convocar_cpff_reforma"]'); await pg.waitForTimeout(300); v = await ver();
  ok(await pg.evaluate(() => ESP.E.esp.fa.ref.fase === 'cortes' && !!ESP.E.proyectos[ESP.E.esp.fa.ref.propId]), 'el Consejo aprueba y el texto pasa a las Cortes'); ok(/En las Cortes/.test(v.txt) && /176 votos/.test(v.txt), 'la ficha pasa a «En las Cortes»');
  await clic('#vista [data-accion="retirar_reforma_financiacion"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.E.esp.fa.ref === null), 'se puede retirar la reforma');

  // 2. Presidente vasco: el cupo
  await poner('presauto', 'PVA'); await pg.evaluate(() => { ESP.E.esp.cupo.proxT = ESP.E.fecha.t + 6; }); v = await ver(); ok(/Exigir una rebaja del cupo/.test(v.txt), 'el presidente vasco ve las posturas del cupo');
  await clic('#vista [data-accion="negociar_cupo"][data-args*="bajar"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.E.esp.fa.cupo.PVA.stance === 'bajar'), 'el botón expone su postura'); v = await ver(); ok(/exige rebajar el cupo/i.test(v.txt), 'la postura se refleja en la ficha');

  // 3. Presidente de Madrid con una reforma abierta: fija el voto
  await poner('pm'); await pg.evaluate(() => { ESP.Financia.abrir(ESP.E, 'capacidad', false, 0); }); await poner('presauto', 'MAD'); await pg.evaluate(() => { ESP.E.esp.fa = { ref: Object.assign(ESP.Financia.asegurar(ESP.E).ref || {}, {}), hist: [], ult: -999, ultInt: -999, cupo: { PVA: { stance: null, t: -99, hist: [] }, NAV: { stance: null, t: -99, hist: [] } } }; });
  await pg.evaluate(() => { const E = ESP.E; E.esp.fa.ref = { modelo: 'solidario', garantia: false, fondo: 0, fase: 'borrador', cab: {}, cabT: {}, contra: {}, fallos: 0, voto: null, propId: null, votoJ: null, t: E.fecha.t }; }); v = await ver();
  ok(/Tu comunidad/.test(v.txt) && !!(await pg.$('#vista [data-accion="fijar_voto_cpff"]')) && !(await pg.$('#vista [data-accion="convocar_cpff_reforma"]')), 'el presidente de Madrid fija el voto de su comunidad y no convoca el Consejo');
  await clic('#vista [data-accion="fijar_voto_cpff"][data-args*="no"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.E.esp.fa.ref.votoJ === 'no'), 'el botón fija el voto en contra');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
