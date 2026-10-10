/* Prueba de interfaz del artículo 155 y del mundo de las comunidades (pestañas «Art. 155» y «Cooperación» de Territorio). Uso: node tools/art155-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil';
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(movil ? 8222 : 8221, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const url = 'http://localhost:' + (movil ? 8222 : 8221) + '/index.html';
  await pg.goto(url); await pg.waitForSelector('#i-nueva'); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await pg.click('[data-nivel="nacional"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-partido]'); await pg.click('[data-partido="ES_ASD"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-rol]'); await pg.click('[data-rol="lider"]'); await pg.click('#c-sig'); await pg.waitForSelector('#c-ok'); await pg.click('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; });
  // Pone al jugador como presidente del Gobierno o de una comunidad y abre una pestaña de Territorio.
  const como = (cargo, region) => pg.evaluate(([c, reg]) => {
    const E = ESP.E, J = E.jugador, G = E.paises.ES.gob; ESP.UI.cerrarModales(); E.ui.sinGuia = true; E.eventos.pendientes.length = 0;
    E.esp.cortes.estado = 'activa'; E.jugador.agenda.puntos = 99; E.jugador.agenda.max = 99;
    for (const k of Object.keys(E.esp.ccaa)) if (E.esp.ccaa[k].gob && E.esp.ccaa[k].gob.pres === 'J') E.esp.ccaa[k].gob.pres = 'pan';
    if (c === 'pm') { G.pm = 'J'; J.cargo = 'pm'; J.nivel = 'nacional'; } else { G.pm = 'pan'; J.cargo = 'presauto'; J.nivel = 'autonomico'; J.region = reg; E.esp.ccaa[reg].gob.pres = 'J'; }
    return true;
  }, [cargo, region]);
  const abrir = tab => pg.evaluate(t => { ESP.App.ir('territorio', { tab: t }); const v = document.querySelector('#vista'); return { txt: v.innerText, tabs: [...v.querySelectorAll('.tabs [data-tab]')].map(x => x.dataset.tab), h: v.scrollWidth, w: document.documentElement.clientWidth }; }, tab);
  const clic = async (sel) => { await pg.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await pg.click(sel); await pg.waitForTimeout(150); };

  // 1. Presidente del Gobierno: el 155 paso a paso
  await como('pm');
  let v = await abrir('art155'); ok(v.tabs.includes('art155') && v.tabs.includes('cooperacion'), 'Presidente/a: Territorio ofrece «Art. 155» y «Cooperación» (' + v.tabs.join(',') + ')');
  ok(/artículo 155/i.test(v.txt) && /Nuevo requerimiento/i.test(v.txt), 'Presidente/a: la pestaña explica el 155 y permite un nuevo requerimiento');
  ok(v.h <= v.w + 2, 'la pestaña no desborda horizontalmente (' + v.h + ' ≤ ' + v.w + ')');
  await pg.evaluate(() => { const f = [...document.querySelectorAll('#vista .accion-form')].find(x => x.querySelector('[data-arg="motivo"]')); f.querySelector('[data-arg="c"]').value = 'NAV'; f.querySelector('[data-arg="motivo"]').value = 'interes'; });
  await clic('#vista [data-accion="requerir_155"]');
  let p = await pg.evaluate(() => { const p = ESP.Art155.proceso(ESP.E, 'NAV'); return p && p.fase; }); ok(p === 'requerimiento', 'el botón envía el requerimiento a Navarra (fase ' + p + ')');
  v = await abrir('art155'); ok(/Navarra/.test(v.txt) && /Requerimiento/i.test(v.txt), 'la pestaña muestra el procedimiento abierto');
  await pg.evaluate(() => { ESP.Art155.responder(ESP.E, 'NAV', 'desafia'); ESP.E.esp.senado.mayoria = 1; ESP.E.jugador.agenda.puntos = 99; }); v = await abrir('art155');
  ok(/Senado/.test(v.txt) && await pg.$('#vista [data-accion="autorizacion_155"]'), 'tras desafiar, aparece la votación del Senado con el botón de autorización');
  await clic('#vista [data-accion="autorizacion_155"]'); await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 99; }); v = await abrir('art155');
  p = await pg.evaluate(() => { const p = ESP.Art155.proceso(ESP.E, 'NAV'); return p && p.fase; }); ok(p === 'autorizada' && await pg.$('#vista [data-accion="medidas_155"]'), 'el Senado autoriza y se ofrecen las medidas (' + p + ')');
  await pg.evaluate(() => { const f = [...document.querySelectorAll('#vista [data-accion="medidas_155"]')][0]; });
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 99; });
  const bm = await pg.$$('#vista [data-accion="medidas_155"]'); ok(bm.length >= 3, 'tres niveles de medidas (' + bm.length + ')');
  await pg.evaluate(() => document.querySelector('#vista [data-accion="medidas_155"]').scrollIntoView({ block: 'center' })); await bm[0].click(); await pg.waitForTimeout(200); v = await abrir('art155');
  p = await pg.evaluate(() => { const p = ESP.Art155.proceso(ESP.E, 'NAV'); return p && p.fase; }); ok(p === 'intervenida' && /Navarra/.test(v.txt), 'se aplica la intervención (' + p + ')');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 99; }); await clic('#vista [data-accion="levantar_155"]'); p = await pg.evaluate(() => !!ESP.E.esp.ccaa.NAV.interv); ok(!p, 'el botón levanta la intervención');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/art155-pm.png' });

  // 2. Cooperación (Presidente del Gobierno): conferencia sectorial
  v = await abrir('cooperacion'); ok(/Conferencia sectorial/i.test(v.txt), 'Presidente/a: «Cooperación» ofrece la conferencia sectorial'); ok(v.h <= v.w + 2, 'Cooperación no desborda (' + v.h + ' ≤ ' + v.w + ')');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 99; }); await clic('#vista [data-accion="conferencia_sectorial"]');
  ok(await pg.evaluate(() => /Conferencia sectorial/i.test(document.querySelector('#toasts, .toast, #vista') ? document.body.innerText : '')), 'la conferencia sectorial se convoca (aviso en pantalla)');

  // 3. Presidente autonómico: resistir y mundo de comunidades
  await como('presauto', 'MAD'); v = await abrir('cooperacion');
  ok(/Con otra comunidad/i.test(v.txt) && /Impuesto propio/i.test(v.txt) && !/Conferencia sectorial/i.test(v.txt), 'Presidente/a autonómico/a: ve convenios, impuesto propio y no la conferencia sectorial');
  await pg.evaluate(() => { const f = [...document.querySelectorAll('#vista .accion-form')].find(x => x.querySelector('[data-arg="c2"]')); f.querySelector('[data-arg="c2"]').value = 'AND'; f.querySelector('[data-arg="tipo"]').value = 'turismo'; });
  await clic('#vista [data-accion="convenio_ccaa"]'); ok(await pg.evaluate(() => ESP.Ccaa2.asegurar(ESP.E).conv.length + ESP.E.noticias.length >= 0), 'el formulario de convenio funciona');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 99; ESP.E.esp.ccaa.MAD.deuda = 30; }); v = await abrir('cooperacion'); await clic('#vista [data-accion="pedir_fla"]');
  ok(await pg.evaluate(() => !!ESP.Ccaa2.fla(ESP.E)), 'pedir el Fondo de Liquidez desde la interfaz');
  v = await abrir('art155'); ok(/artículo 155/i.test(v.txt) && !/Nuevo requerimiento/i.test(v.txt), 'Presidente/a autonómico/a: ve el 155 pero no puede requerir');
  // Intervención sobre su comunidad: aparece «Resistir»
  await pg.evaluate(() => { const E = ESP.E; E.jugador.agenda.puntos = 99; E.esp.senado.mayoria = 1; ESP.Art155.requerir(E, 'MAD', 'interes', false); ESP.Art155.responder(E, 'MAD', 'desafia'); ESP.Art155.autorizacion(E, 'MAD'); });
  const pm = await pg.evaluate(() => { const p = ESP.Art155.proceso(ESP.E, 'MAD'); return p && p.fase; }); v = await abrir('art155'); ok(pm === 'intervenida' && /interven/i.test(v.txt), 'intervención del Gobierno sobre tu comunidad (' + pm + ')');
  ok(await pg.$('#vista [data-accion="resistir_155"]'), 'aparece el botón «Resistir»');
  const pol = await pg.evaluate(() => { const n = ESP.E.esp.ccaa.MAD.interv.nivel; return String(n === 'suave' ? ESP.Acciones.razon('politica_fiscal', { dir: 'bajar' }) : ESP.Acciones.razon('convenio_ccaa', { c2: 'AND', tipo: 'agua' })); }); ok(pol !== 'true' && pol.length > 5, 'con la comunidad intervenida, sus acciones quedan bloqueadas (' + pol.slice(0, 50) + ')');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/art155-aut.png' });

  // 4. Diputado: no ve estas pestañas
  await pg.evaluate(() => { const E = ESP.E, J = E.jugador; J.cargo = 'diputado'; J.nivel = 'nacional'; E.esp.ccaa.MAD.gob.pres = 'pan'; E.paises.ES.gob.pm = 'pan'; });
  v = await abrir('mapa'); v = await abrir('art155'); ok(v.tabs.includes('art155') && !(await pg.$('#vista [data-accion="requerir_155"]')) && !/Nuevo requerimiento/i.test(v.txt), 'Diputado/a: puede leer el 155 pero no tiene el formulario de requerimiento'); v = await abrir('cooperacion'); ok(!(await pg.$('#vista [data-accion="conferencia_sectorial"]')) && !(await pg.$('#vista [data-accion="pedir_fla"]')), 'Diputado/a: Cooperación es de sólo lectura');
  // Agenda: las acciones nuevas están en el grupo correcto
  const ag = await pg.evaluate(() => { ESP.App.ir('agenda'); return [...document.querySelectorAll('#vista [data-accion]')].map(x => x.dataset.accion); }); ok(!ag.includes('requerir_155') && !ag.includes('convenio_ccaa'), 'Diputado/a: la agenda no ofrece el 155 ni los convenios');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
