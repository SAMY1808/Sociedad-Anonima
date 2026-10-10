/* Prueba de interfaz de la declaración institucional de la disolución y de las banderas de las comunidades. Uso: node tools/declaracion-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil', PORT = movil ? 8262 : 8261;
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  await pg.goto(`http://localhost:${PORT}/index.html`); await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  await cerrar();
  const poner = (cargo, region) => pg.evaluate(([c, reg]) => { const E = ESP.E, J = E.jugador, G = E.paises.ES.gob; ESP.UI.cerrarModales(); E.eventos.pendientes = []; E.ue.pendiente = []; E.ui.sinGuia = true; E.esp.cortes.estado = 'activa'; E.esp.cortes.ultDisolucion = -999; E.esp.cortes.mocion = null; E.fecha.t = Math.max(E.fecha.t, 120); J.agenda.puntos = 60; J.agenda.max = 60;
    for (const k of Object.keys(E.esp.ccaa)) if (E.esp.ccaa[k].gob && E.esp.ccaa[k].gob.pres === 'J') E.esp.ccaa[k].gob.pres = 'pan';
    if (c === 'pm') { G.pm = 'J'; J.cargo = 'pm'; J.nivel = 'nacional'; } else { G.pm = 'pan'; J.cargo = 'presauto'; J.nivel = 'autonomico'; J.region = reg; J.escReg = true; const rc = E.esp.ccaa[reg]; rc.gob.pres = 'J'; rc.parl.ult = E.fecha.t - 120; rc.parl.proxT = E.fecha.t + 100; rc.suspendida = false; E.ui.regAG = reg; }
    E.esp.dis = { pend: [], hist: [] }; return true; }, [cargo, region]);

  // 1. Presidente del Gobierno: elige cómo disuelve las Cortes
  await poner('pm'); await pg.evaluate(() => ESP.App.ir('cortes'));
  await pg.waitForSelector('#vista [data-accion="disolver_cortes"]'); await clic('#vista [data-accion="disolver_cortes"]');
  await pg.waitForSelector('.modal [data-modo]'); const op = await pg.$$eval('.modal [data-modo]', l => l.map(x => x.dataset.modo));
  ok(op.join() === 'sorpresa,anunciada', 'al disolver se pregunta cómo se anuncia (' + op.join(', ') + ')');
  ok(!!(await pg.$('.modal [data-escena="declaracion_pm"] svg')), 'el selector muestra la escena del presidente en La Moncloa');
  ok(await pg.evaluate(() => { const m = document.querySelector('.modal'); return m.scrollWidth <= m.clientWidth + 2; }), 'el selector no desborda');
  ok(await pg.evaluate(() => ESP.E.esp.cortes.estado === 'activa'), 'mientras eliges, las Cortes siguen sin disolverse');
  await clic('.modal [data-modo="sorpresa"]'); await pg.waitForSelector('.modal [data-escena="declaracion_pm"]'); await pg.waitForTimeout(150);
  ok(await pg.evaluate(() => ESP.E.esp.cortes.estado === 'disueltas' && ESP.E.esp.dis.hist[0].modo === 'sorpresa'), 'las Cortes quedan disueltas por sorpresa');
  const txt = await pg.evaluate(() => document.querySelector('.modal').innerText); ok(/Sorpresa en La Moncloa/i.test(txt) && /Declaración institucional/i.test(txt) && /ninguneados/.test(txt), 'sale la declaración institucional del anuncio sorpresa');
  ok(await pg.evaluate(() => { const m = document.querySelector('.modal'); return m.scrollWidth <= m.clientWidth + 2; }), 'la declaración no desborda');
  if (!movil) { await pg.waitForTimeout(700); await pg.screenshot({ path: '/tmp/claude-0/shots/declaracion-pm.png' }); }
  await clic('#dc-ok'); await pg.waitForTimeout(200); ok(!(await pg.$('.modal-fondo')) || !(await pg.$('.modal [data-escena]')), 'Entendido cierra la declaración');

  // 2. La imagen de IA sustituye a la ilustración cuando existe
  const img = await pg.evaluate(() => { ESP.IMAGENES = ESP.IMAGENES || {}; ESP.IMAGENES.declaracion_pm = 'img/eventos/declaracion_pm.webp'; const h = ESP.Escenas.html(ESP.E, 'declaracion_pm', {}); delete ESP.IMAGENES.declaracion_pm; return h; });
  ok(/<svg/.test(img) && /<img src="img\/eventos\/declaracion_pm.webp"/.test(img), 'si hay imagen asociada se usa sobre la ilustración de respaldo');

  // 3. Presidente autonómico: anuncio con su bandera
  await poner('presauto', 'CAT'); await pg.evaluate(() => { ESP.App.ir('agenda'); });
  const r = await pg.evaluate(() => ESP.UI.accion('adelanto_autonomico', {}, { silencio: true })); ok(r.pendiente === true && !!(await pg.$('.modal [data-modo]')), 'el adelanto autonómico también pregunta el modo del anuncio');
  ok(!!(await pg.$('.modal [data-escena="declaracion_aut"]')) && /Cataluña/i.test(await pg.evaluate(() => document.querySelector('.modal').innerHTML)), 'el selector muestra la escena autonómica con su comunidad');
  await clic('.modal [data-modo="anunciada"]'); await pg.waitForSelector('.modal [data-escena="declaracion_aut"]'); await pg.waitForTimeout(150);
  const dm = await pg.evaluate(() => { const m = document.querySelector('.modal'); return { txt: m.innerText, svgs: m.querySelectorAll('figure svg svg').length, w: m.scrollWidth <= m.clientWidth + 2 }; });
  ok(/Declaración institucional/i.test(dm.txt) && /Cataluña/.test(dm.txt) && dm.svgs >= 1, 'la declaración autonómica dibuja la bandera de la comunidad (' + dm.svgs + ' bandera anidada)'); ok(dm.w, 'no desborda');
  if (!movil) { await pg.waitForTimeout(700); await pg.screenshot({ path: '/tmp/claude-0/shots/declaracion-aut.png' }); }
  await pg.evaluate(() => ESP.UI.cerrarModales());

  // 4. Banderas en las pantallas
  await poner('presauto', 'MAD');
  const bn = await pg.evaluate(() => { const o = {}; ESP.App.refrescar(); o.chip = !!document.querySelector('#barra .chip-cargo svg.bnd'); ESP.App.ir('dashboard'); o.cmd = !!document.querySelector('#vista h1 svg.bnd'); ESP.App.ir('autogob'); o.ag = !!document.querySelector('#vista h1 svg.bnd'); ESP.App.ir('parlaut'); o.pa = !!document.querySelector('#vista h1 svg.bnd');
    ESP.E.ui.tabTer = 'ccaa'; ESP.App.ir('territorio', { tab: 'ccaa' }); o.tabla = document.querySelectorAll('#vista table svg.bnd').length; ESP.App.ir('territorio', { tab: 'art155' }); o.t155 = document.querySelectorAll('#vista table svg.bnd').length;
    ESP.E.noticias.unshift({ t: ESP.E.fecha.t, tipo: 'politica', texto: 'El Parlamento de Madrid aprueba la ley de transportes.', pais: 'ES', reg: 'MAD', amb: 'aut' }); ESP.App.ticker(); o.ticker = !!document.querySelector('#ticker svg.bnd'); return o; });
  ok(bn.chip, 'la barra superior muestra la bandera de tu comunidad'); ok(bn.cmd, 'el Centro de mando lleva la bandera'); ok(bn.ag && bn.pa, 'Autogobierno y Parlamento llevan la bandera'); ok(bn.tabla >= 17, 'la tabla de comunidades lleva una bandera por fila (' + bn.tabla + ')'); ok(bn.t155 >= 17, 'la tabla del Art. 155 lleva banderas (' + bn.t155 + ')'); ok(bn.ticker, 'las noticias de una comunidad llevan su bandera en la cinta');
  const ancho = await pg.evaluate(() => { ESP.App.ir('territorio', { tab: 'ccaa' }); const v = document.getElementById('vista'); return v.scrollWidth <= document.documentElement.clientWidth + 2; }); ok(ancho, 'las banderas no desbordan la pantalla');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
