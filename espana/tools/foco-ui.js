/* Prueba de interfaz del foco por cargo: menú, Centro de mando, agenda y pestañas según el cargo; y el modo «Panorámico». Uso: node tools/foco-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8201, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8201/index.html'); await pg.waitForSelector('#i-nueva'); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await pg.click('[data-nivel="nacional"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-partido]'); await pg.click('[data-partido="ES_ASD"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-rol]'); await pg.click('[data-rol="lider"]'); await pg.click('#c-sig'); await pg.waitForSelector('#c-ok'); await pg.click('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; });
  // Pone al jugador en un cargo y devuelve lo que ve.
  const como = async (cargo) => pg.evaluate(c => {
    const E = ESP.E, J = E.jugador, G = E.paises.ES.gob; ESP.UI.cerrarModales(); E.ui.sinGuia = true;
    G.pm = c === 'pm' ? 'J' : (G.pm === 'J' ? 'pan' : G.pm);
    const nv = { pm: 'nacional', ministro: 'nacional', diputado: 'nacional', presauto: 'autonomico', dipauto: 'autonomico', alcalde: 'local', concejal: 'local' }[c]; J.cargo = c; J.nivel = nv; J.region = J.region || 'MAD'; J.muni = J.muni || 'm_mad';
    const rc = E.esp.ccaa[J.region]; if (rc.gob) rc.gob.pres = c === 'presauto' ? 'J' : (rc.gob.pres === 'J' ? 'pan' : rc.gob.pres); const m = E.esp.muni.m[J.muni]; if (m) m.pm = c === 'alcalde' ? 'J' : (m.pm === 'J' ? null : m.pm);
    ESP.App.ir('dashboard'); ESP.App.nav();
    const nav = [...document.querySelectorAll('#nav button[data-p]')].map(x => x.dataset.p), princ = [...document.querySelectorAll('#nav button.princ')].map(x => x.dataset.p), h1 = (document.querySelector('#vista h1') || {}).textContent || '';
    ESP.App.ir('agenda'); const grupos = [...document.querySelectorAll('#vista .tarjeta h3')].map(x => x.textContent.trim());
    return { nav, princ, h1, grupos, ambito: ESP.Foco.ambito(E) };
  }, cargo);
  const tiene = (r, l) => l.every(x => r.nav.includes(x)), carece = (r, l) => l.every(x => !r.nav.includes(x));
  let r = await como('pm'); ok(r.ambito === 'central' && tiene(r, ['cortes', 'consejo', 'gabinete', 'territorio', 'europa', 'estructural']) && carece(r, ['parlaut', 'ayuntamiento', 'local2']), 'Presidente/a del Gobierno: menú de gobierno central, sin parlamento autonómico ni poder local');
  ok(!r.grupos.some(g => /Comunidad autónoma|Ayuntamiento/.test(g)) && r.grupos.some(g => /Gobierno y Cortes/.test(g)), 'Presidente/a: la agenda no ofrece acciones autonómicas ni municipales (' + r.grupos.join(' · ') + ')'); ok(/Centro de mando/.test(r.h1), 'Presidente/a: Centro de mando central');
  r = await como('diputado'); ok(tiene(r, ['cortes', 'leyes', 'mayorias']) && carece(r, ['consejo', 'gabinete', 'jefe', 'parlaut', 'ayuntamiento']), 'Diputado/a: Cortes y leyes, sin Consejo de Ministros ni niveles inferiores');
  const ag = await pg.evaluate(() => [...document.querySelectorAll('#vista [data-accion]')].map(x => x.dataset.accion)); ok(!ag.includes('tope_alquiler') && !ag.includes('plan_vivienda') && ag.some(x => ['atacar_rival', 'proponer_ley', 'discurso'].includes(x)), 'Diputado/a: sin palancas de gobierno, con las del Parlamento y la oposición');
  r = await como('presauto'); ok(r.ambito === 'aut' && tiene(r, ['parlaut', 'territorio', 'autogob', 'consejo']) && carece(r, ['cortes', 'mayorias', 'europa', 'exterior', 'ayuntamiento', 'estructural']), 'Presidente/a autonómico/a: parlamento y autogobierno, sin Cortes ni Europa ni poder local');
  ok(/Madrid|Centro de mando/.test(r.h1) && /Madrid/.test(r.h1), 'Presidente/a autonómico/a: el Centro de mando es el de su comunidad (' + r.h1 + ')'); ok(r.grupos.some(g => /Comunidad autónoma/.test(g)) && !r.grupos.some(g => /Gobierno y Cortes|Ayuntamiento|Congreso/.test(g)), 'Presidente/a autonómico/a: la agenda es autonómica (' + r.grupos.join(' · ') + ')');
  r = await como('dipauto'); ok(tiene(r, ['parlaut']) && carece(r, ['consejo', 'gabinete', 'cortes', 'ayuntamiento']), 'Diputado/a autonómico/a: parlamento autonómico, sin gobierno ni Cortes');
  r = await como('alcalde'); ok(r.ambito === 'local' && tiene(r, ['ayuntamiento', 'local2']) && carece(r, ['cortes', 'parlaut', 'consejo', 'territorio', 'europa']), 'Alcalde/sa: ayuntamiento y poder local, sin Cortes ni comunidad ni Europa'); ok(/Madrid/.test(r.h1), 'Alcalde/sa: el Centro de mando es el de su ciudad (' + r.h1 + ')'); ok(r.grupos.some(g => /Ayuntamiento/.test(g)) && !r.grupos.some(g => /Gobierno y Cortes|Comunidad autónoma|Congreso/.test(g)), 'Alcalde/sa: la agenda es municipal (' + r.grupos.join(' · ') + ')');
  if (movil) { ok(r.princ.includes('ayuntamiento') && r.princ.length >= 4, 'móvil: la barra inferior del alcalde/sa destaca el ayuntamiento (' + r.princ.join(',') + ')'); }
  // Metas y titulares según el nivel (el jugador sigue siendo alcalde/sa)
  const mt = await pg.evaluate(() => { const E = ESP.E; E.ui.tabLegado = 'metas'; ESP.App.ir('legado'); const t = document.querySelector('#vista').innerText; E.ui.tabLegado = 'semana';
    E.noticias.length = 0; ESP.Noticias.poner(E, 'politica', 'El Congreso aprueba la ley de vivienda.', 'ES'); ESP.Noticias.poner(E, 'politica', 'El Parlamento de Extremadura deroga el decreto-ley «Ley agraria autonómica» (26–39).', 'ES'); ESP.Noticias.poner(E, 'politica', 'El pleno municipal de Madrid aprueba la ordenanza de terrazas.', 'ES'); ESP.App.ir('dashboard'); const d = document.querySelector('#vista').innerText; return { alcaldia: /Ser alcalde/i.test(t), moncloa: /Llegar a La Moncloa/i.test(t), ley: /ley de vivienda/.test(d), ext: /Extremadura/.test(d), pleno: /pleno municipal de Madrid/.test(d) }; });
  ok(mt.alcaldia && !mt.moncloa, 'Alcalde/sa: en Metas ve las de su ciudad y no «Llegar a La Moncloa»'); ok(mt.ley && mt.pleno && !mt.ext, 'Alcalde/sa: «Última hora» muestra lo nacional y lo de su ciudad, no el parlamento de otra comunidad');
  // Pestañas internas según el ámbito
  const tabs = await pg.evaluate(() => { const E = ESP.E, o = {}; ESP.App.ir('elecciones'); o.elec = [...document.querySelectorAll('#vista .tabs [data-tab]')].map(x => x.dataset.tab); ESP.App.ir('leyes'); o.leyes = ESP.Pantallas.leyesNiv.ambitos(E).map(x => x[0]); return o; });
  ok(tabs.elec.includes('municipales') && !tabs.elec.includes('generales') && !tabs.elec.includes('autonomicas'), 'Alcalde/sa: en Elecciones sólo ve las municipales (' + tabs.elec.join(',') + ')'); ok(tabs.leyes.length === 1 && tabs.leyes[0] === 'muni', 'Alcalde/sa: en Leyes sólo ve las ordenanzas de su municipio');
  await como('pm'); const tp = await pg.evaluate(() => { ESP.App.ir('elecciones'); const e = [...document.querySelectorAll('#vista .tabs [data-tab]')].map(x => x.dataset.tab); ESP.App.ir('territorio'); const t = [...document.querySelectorAll('#vista .tabs [data-tab]')].map(x => x.dataset.tab); return { e, t, l: ESP.Pantallas.leyesNiv.ambitos(ESP.E).map(x => x[0]) }; });
  ok(tp.e.includes('generales') && !tp.e.includes('municipales') && !tp.e.includes('autonomicas'), 'Presidente/a: en Elecciones sólo las generales, la campaña y la investidura (' + tp.e.join(',') + ')'); ok(!tp.t.includes('munis') && !tp.t.includes('presupuesto') && tp.t.includes('financiacion'), 'Presidente/a: Territorio sin presupuestos autonómicos ni municipios (' + tp.t.join(',') + ')'); ok(tp.l.length === 1 && tp.l[0] === 'congreso', 'Presidente/a: en Leyes sólo ve las del Estado');
  // Modo panorámico: vuelve todo
  await pg.evaluate(() => { ESP.App.ir('ajustes'); }); await pg.click('[data-aj="foco"][data-v="todo"]'); await pg.waitForTimeout(200);
  const pano = await pg.evaluate(() => { ESP.App.nav(); return { nav: [...document.querySelectorAll('#nav button[data-p]')].map(x => x.dataset.p), modo: ESP.Foco.modo(ESP.E), amb: ESP.Foco.ambito(ESP.E) }; });
  ok(pano.modo === 'todo' && pano.amb === 'todo' && ['cortes', 'parlaut', 'ayuntamiento', 'local2', 'consejo'].every(x => pano.nav.includes(x)), 'Panorámico: vuelven todos los niveles al menú');
  await pg.evaluate(() => { ESP.App.ir('ajustes'); }); await pg.click('[data-aj="foco"][data-v="cargo"]'); await pg.waitForTimeout(150);
  ok(await pg.evaluate(() => { ESP.App.nav(); return !document.querySelector('#nav button[data-p="parlaut"]'); }), 'Volver a «Por cargo» oculta otra vez lo de otros niveles');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
