/* Prueba del mapa de España en el navegador (Playwright): pantalla Mapa, capas, selección, zoom y desplazamiento, ciudades, acciones, Centro de mando, Territorio, Crisis y Creación.
   Uso: node tools/mapa-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil', PUERTO = movil ? 8320 : 8319;
(async () => {
  await new Promise(r => srv.listen(PUERTO, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const esp = ms => pg.waitForTimeout(ms);
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  /* Centro en pantalla de una provincia (a partir de su centroide en el mapa) dentro del contenedor dado. */
  const donde = (cont, id) => pg.evaluate(([cont, id]) => { const svg = document.querySelector(cont + ' svg.mapa-es'), c = ESP.DATA.mapaEs.cen[id], pt = svg.createSVGPoint(); pt.x = c[0]; pt.y = c[1]; const q = pt.matrixTransform(svg.getScreenCTM()); return [q.x, q.y]; }, [cont, id]);
  const tocar = async (cont, id) => { await pg.evaluate(c => document.querySelector(c + ' svg.mapa-es').scrollIntoView({ block: 'center' }), cont); await esp(150); const [x, y] = await donde(cont, id); if (movil) await pg.touchscreen.tap(x, y); else await pg.mouse.click(x, y); await esp(450); };
  const E = f => pg.evaluate(f);
  /* Elige una capa: con chips en el ordenador, con el selector en el móvil. */
  const capa = async id => { if (movil) await pg.selectOption('#vista #mapa-capa, .d-mapa #mapa-capa', id); else { const g = await pg.evaluate(id => ESP.Mapa.capa(id).g, id); await pg.click('[data-mgrupo="' + g + '"]'); await pg.click('[data-mcapa="' + id + '"]'); } await esp(200); };

  console.log('Creación de carrera: el mapa elige el territorio');
  await pg.goto(`http://localhost:${PUERTO}/index.html`); await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await clic('[data-nivel="nacional"]'); await esp(300);
  ok(await E(() => document.querySelectorAll('#c-mapa svg.mapa-es .ficha').length === 54), 'el paso «¿Dónde empieza tu carrera?» muestra el mapa real con las 52 circunscripciones y los anillos de Ceuta y Melilla');
  ok(await E(() => document.querySelectorAll('#c-mapa .m-propio').length === 0), 'el mundo de prueba no marca «lo tuyo» en el mapa');
  await tocar('#c-mapa', 'BCN'); ok(await E(() => /Cataluña/.test(document.querySelector('.c-dos h2').textContent) && document.querySelectorAll('#c-mapa .m-sel').length === 1 && document.querySelectorAll('#c-mapa .m-sel-c').length === 4), 'pulsar Barcelona elige Cataluña y resalta la provincia sobre su comunidad');
  await clic('[data-nivel="local"]'); await esp(250);
  ok(await E(() => document.querySelectorAll('#c-mapa .ciu').length === 66), 'a nivel local el mapa dibuja las 66 grandes ciudades');
  await pg.evaluate(() => document.querySelector('#c-mapa .ciu[data-muni="m_sev"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await esp(300);
  ok(await E(() => document.querySelector('#c-muni').value === 'm_sev' && document.querySelectorAll('#c-mapa .ciu.sel').length === 1), 'pulsar una ciudad en el mapa la elige como ayuntamiento');
  await clic('[data-nivel="nacional"]'); await pg.evaluate(() => document.querySelector('#c-mapa .ficha[data-prov="MAD"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await esp(200);
  await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; ESP.E.ui.sinGuia = true; }); await esp(600);

  console.log('Pantalla Mapa');
  ok(await E(() => ESP.E.ui.pantalla === 'mapa'), 'la partida empieza en el mapa');
  ok(await E(() => !!document.querySelector('#nav button[data-p="mapa"]')) || movil, 'el menú tiene «Mapa»'); if (movil) ok(await E(() => [...document.querySelectorAll('#nav button')].some(x => /Mapa/.test(x.textContent))), 'la barra inferior del móvil tiene «Mapa»');
  const base = await E(() => ({ fichas: document.querySelectorAll('#vista svg.mapa-es .ficha').length, chips: document.querySelectorAll('#vista [data-mcapa]').length, zoom: document.querySelectorAll('#vista .mapa-zoom button').length, panel: document.querySelector('#mapa-panel h3').textContent, ley: document.querySelector('#mapa-leyenda').textContent.length, w: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(base.fichas === 54 && base.chips === 17 && base.zoom === 5, 'el mapa trae 54 elementos pulsables, 17 capas y 5 botones (acercar, alejar, todo, mi territorio y obras)');
  ok(/España/.test(base.panel) && base.ley > 10, 'sin selección el panel resume el país y la leyenda explica los colores');
  ok(base.w <= base.cw + 1, 'la página no se desborda en horizontal (' + base.w + ' de ' + base.cw + ')');
  ok(await E(() => document.querySelectorAll('#vista .m-etq text').length >= 8), 'se rotulan las comunidades sobre el mapa');
  ok(await E(() => ['#nav-mas', '#nav'].every(s => !!document.querySelector(s))), 'la barra de navegación sigue ahí');

  console.log('Capas de datos');
  const col = id => pg.evaluate(id => document.querySelector('#vista svg.mapa-es .ficha[data-prov="' + id + '"]').getAttribute('fill'), id);
  const antes = await col('BCN'); await capa('relM'); await esp(100);
  const rel = await E(() => ({ capa: ESP.E.ui.mapa.capa, desc: document.querySelector('#mapa-desc').textContent, grad: !!document.querySelector('#mapa-leyenda .mapa-grad'), fill: document.querySelector('#vista svg.mapa-es .ficha[data-prov="BCN"]').getAttribute('fill'), esperado: ESP.Mapa.estiloProv(ESP.E, 'relM', 'BCN').f, tt: document.querySelector('#vista svg.mapa-es .ficha[data-prov="BCN"]').getAttribute('data-tt') }));
  ok(rel.capa === 'relM' && /Relación con Moncloa/.test(rel.desc) && rel.grad && rel.fill === rel.esperado && rel.fill !== antes, 'cambiar a «Relación con Moncloa» repinta el mapa, la leyenda y la descripción');
  ok(/Relación con Moncloa/.test(rel.tt) && /Cataluña/.test(rel.tt), 'el aviso de cada provincia cambia con la capa');
  ok(await E(() => /Valor más alto/.test(document.querySelector('#mapa-panel').textContent) && document.querySelectorAll('#mapa-panel [data-msel^="ccaa:"]').length >= 8), 'las capas por comunidad muestran el ranking de mejores y peores');
  await capa('autonomico'); await esp(100);
  ok(await E(() => document.querySelector('#vista svg.mapa-es .ficha[data-prov="SEV"]').getAttribute('fill') === ESP.Mapa.estiloProv(ESP.E, 'autonomico', 'SEV').f), 'Gobierno autonómico pinta cada comunidad con su partido');
  const caps = await E(() => ESP.Mapa.CAPAS.map(c => c.id)); let malas = [];
  for (const id of caps) { await pg.evaluate(id => { const s = document.querySelector('#vista #mapa-capa'); s.value = id; s.dispatchEvent(new Event('change')); }, id); await esp(40); const r = await E(() => ({ n: document.querySelectorAll('#vista svg.mapa-es .ficha').length, ley: document.querySelector('#mapa-leyenda').innerHTML.length, nan: /NaN|undefined/.test(document.querySelector('#vista').innerHTML) })); if (r.n !== 54 || r.ley < 20 || r.nan) malas.push(id); }
  ok(!malas.length, 'las ' + caps.length + ' capas se pueden activar sin errores ni valores rotos' + (malas.length ? ': ' + malas.join(',') : ''));

  console.log('Seleccionar y actuar');
  await capa('autonomico'); await clic('[data-mzoom="todo"]'); await esp(700);
  await tocar('#vista', 'BCN');
  let s1 = await E(() => ({ sel: ESP.E.ui.mapa.sel, h3: document.querySelector('#mapa-panel h3').textContent, kpis: document.querySelectorAll('#mapa-panel .mapa-kpis .kpi').length, filas: document.querySelectorAll('#mapa-panel [data-msel^="prov:"]').length, resalta: document.querySelectorAll('#vista .m-res .m-sel').length }));
  ok(s1.sel && s1.sel.t === 'ccaa' && s1.sel.id === 'CAT' && /Cataluña/.test(s1.h3) && s1.kpis >= 5 && s1.filas === 4 && s1.resalta === 4, 'pulsar Barcelona en una capa autonómica elige Cataluña: ficha, indicadores, sus 4 provincias y contorno resaltado');
  await esp(600); ok(await E(() => ESP.E.ui.mapa.cam && ESP.E.ui.mapa.cam.z <= 1.05), 'al pulsar una comunidad la cámara no salta: el encuadre se pide con «Acercar» o con doble clic');
  await pg.evaluate(() => document.querySelector('#mapa-panel [data-mz^="ccaa:"]').click()); await esp(900);
  ok(await E(() => ESP.E.ui.mapa.cam.z > 1.8 && ESP.E.ui.mapa.cam.z < 8.5), 'el botón «Acercar» encuadra la comunidad (zoom ' + (await E(() => Math.round(ESP.E.ui.mapa.cam.z * 10) / 10)) + '×)');
  ok(await E(() => /Provincias/.test(document.querySelector('#mapa-panel').textContent) && !!document.querySelector('#mapa-panel [data-mficha]')), 'la ficha enlaza con la ficha completa de la comunidad');
  await pg.evaluate(() => document.querySelector('#mapa-panel [data-msel="prov:GIR"]').click()); await esp(900);
  s1 = await E(() => ({ sel: ESP.E.ui.mapa.sel, h3: document.querySelector('#mapa-panel h3').textContent, tabla: document.querySelectorAll('#mapa-panel table.tabla tbody tr').length }));
  ok(s1.sel.t === 'prov' && s1.sel.id === 'GIR' && /Girona/.test(s1.h3) && s1.tabla >= 3, 'elegir una provincia desde la tabla de la comunidad muestra sus resultados por partido');
  ok(await E(() => document.querySelectorAll('#vista .m-etq .et-p').length >= 1), 'con zoom aparecen los nombres de las provincias');
  await clic('[data-mzoom="todo"]'); await esp(700); ok(await E(() => ESP.E.ui.mapa.sel === null && ESP.E.ui.mapa.cam.z <= 1.01), '«Ver toda España» limpia la selección y encuadra el país');
  await capa('voto'); await tocar('#vista', 'SEV');
  s1 = await E(() => ({ sel: ESP.E.ui.mapa.sel, h3: document.querySelector('#mapa-panel h3').textContent, filas: document.querySelectorAll('#mapa-panel table.tabla tbody tr').length }));
  ok(s1.sel && s1.sel.t === 'prov' && s1.sel.id === 'SEV' && /Sevilla/.test(s1.h3) && s1.filas >= 3, 'en una capa de provincias, pulsar Sevilla elige la provincia y muestra sus resultados');
  const acc = await E(() => [...document.querySelectorAll('#mapa-panel button[data-accion]')].map(x => x.dataset.accion));
  ok(acc.length >= 1 && acc.every(a => /^(mitin_prov|gasto_campana|abrir_sede|cambiar_provincia)$/.test(a)), 'el panel ofrece acciones sobre el territorio elegido (' + acc.join(', ') + ')');
  const pts0 = await E(() => ESP.E.jugador.agenda.puntos), a0 = acc.find(a => a === 'cambiar_provincia' || a === 'abrir_sede') || acc[0];
  await pg.evaluate(a => document.querySelector('#mapa-panel button[data-accion="' + a + '"]').click(), a0); await esp(500); await pg.evaluate(() => { const d = document.querySelector('.modal-fondo [data-accion-ok], .modal-fondo .btn.prim'); }).catch(() => {});
  ok(await E(() => ESP.E.ui.pantalla === 'mapa' && !!document.querySelector('#mapa-w svg.mapa-es')), 'lanzar una acción desde el mapa no saca de la pantalla del mapa');
  await pg.evaluate(() => { ESP.UI.cerrarModales(); }); await esp(150);

  console.log('Zoom y desplazamiento');
  await clic('[data-mzoom="todo"]'); await esp(600);
  await clic('[data-mzoom="in"]'); await clic('[data-mzoom="in"]'); await esp(300);
  const z2 = await E(() => ESP.E.ui.mapa.cam.z); ok(z2 > 2.3 && z2 < 3, 'los botones + acercan (2 pulsaciones → ' + Math.round(z2 * 100) / 100 + '×)');
  await clic('[data-mzoom="out"]'); await esp(300); ok(await E(() => ESP.E.ui.mapa.cam.z < 1.7 && ESP.E.ui.mapa.cam.z > 1.3), 'el botón − aleja');
  if (!movil) {
    const [cx, cy] = await donde('#vista', 'VLL'); await pg.mouse.move(cx, cy); await pg.mouse.wheel(0, -400); await esp(350);
    ok(await E(() => ESP.E.ui.mapa.cam.z > 2.2), 'la rueda del ratón acerca hacia el puntero');
    const sel0 = await E(() => JSON.stringify(ESP.E.ui.mapa.sel)), c0 = await E(() => ESP.E.ui.mapa.cam.c.join(','));
    await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx + 120, cy + 70, { steps: 6 }); await pg.mouse.up(); await esp(350);
    ok(await E(() => ESP.E.ui.mapa.cam.c.join(',')) !== c0 && await E(() => JSON.stringify(ESP.E.ui.mapa.sel)) === sel0, 'arrastrar desplaza el mapa sin elegir nada por accidente');
    await pg.focus('#vista svg.mapa-es'); const k0 = await E(() => ESP.E.ui.mapa.cam.z); await pg.keyboard.press('+'); await esp(250); ok(await E(() => ESP.E.ui.mapa.cam.z) > k0, 'con el teclado, + acerca');
    const c1 = await E(() => ESP.E.ui.mapa.cam.c.join(',')); await pg.keyboard.press('ArrowRight'); await esp(250); ok(await E(() => ESP.E.ui.mapa.cam.c.join(',')) !== c1, 'las flechas desplazan el mapa'); await pg.keyboard.press('0'); await esp(600); ok(await E(() => ESP.E.ui.mapa.cam.z <= 1.01), 'la tecla 0 vuelve a la vista completa');
  }
  await clic('[data-mzoom="todo"]'); await esp(500);
  ok(await E(() => ESP.E.ui.mapa.cam.z <= 1.01), '⌂ vuelve a ver toda España');
  const vb0 = await E(() => document.querySelector('#vista svg.mapa-es').getAttribute('viewBox'));
  await pg.setViewportSize(movil ? { width: 844, height: 390 } : { width: 1000, height: 760 }); await esp(600);
  const vb1 = await E(() => document.querySelector('#vista svg.mapa-es').getAttribute('viewBox'));
  ok(vb0 !== vb1 && !/NaN/.test(vb1), 'al cambiar el tamaño de la ventana (o girar el móvil) el mapa se vuelve a encuadrar');
  await pg.setViewportSize(movil ? { width: 390, height: 844 } : { width: 1280, height: 900 }); await esp(600);

  console.log('Ciudades');
  await capa('alcaldias');
  const nC = await E(() => document.querySelectorAll('#vista .m-ciu circle').length); ok(nC === 66, 'la capa «Alcaldías» dibuja las 66 grandes ciudades coloreadas por partido (' + nC + ')');
  await capa('voto');
  ok(await E(() => { const n = document.querySelectorAll('#vista .m-ciu circle').length; return n >= 8 && n <= 14; }), 'con el mapa completo sólo se muestran las ciudades mayores');
  await pg.evaluate(() => ESP.Pantallas.mapa.render(document.getElementById('vista'), { sel: { t: 'ccaa', id: 'MAD' } })); await esp(1100);
  ok(await E(() => ESP.E.ui.mapa.cam.z > 3 && document.querySelectorAll('#vista .m-ciu circle').length >= 4), 'al acercar a Madrid aparecen más ciudades');
  const [mx, my] = await E(() => { const c = document.querySelector('#vista .m-ciu circle[data-muni="m_mad"]').getBoundingClientRect(); return [c.left + c.width / 2, c.top + c.height / 2]; });
  if (movil) await pg.touchscreen.tap(mx, my); else await pg.mouse.click(mx, my); await esp(900);
  const s2 = await E(() => ({ sel: ESP.E.ui.mapa.sel, h3: document.querySelector('#mapa-panel h3').textContent, txt: document.querySelector('#mapa-panel').textContent, esc: !!document.querySelector('#mapa-panel h3 svg') }));
  ok(s2.sel && s2.sel.t === 'muni' && s2.sel.id === 'm_mad' && /Madrid/.test(s2.h3) && /Alcaldía/.test(s2.txt) && s2.esc, 'pulsar una ciudad muestra su ficha: escudo, alcaldía, aprobación y deuda');
  ok(await E(() => document.querySelectorAll('#vista .m-ciu circle.sel').length === 1 && [...document.querySelectorAll('#vista .m-etq text.et-m')].some(t => /Madrid/.test(t.textContent))), 'la ciudad elegida se resalta y se rotula');

  console.log('Lo tuyo en el mapa');
  await clic('[data-mzoom="todo"]'); await esp(600); await clic('[data-mzoom="yo"]'); await esp(1000);
  ok(await E(() => ESP.E.ui.mapa.sel && ESP.E.ui.mapa.sel.t === 'prov' && ESP.E.ui.mapa.sel.id === ESP.E.jugador.circ && ESP.E.ui.mapa.cam.z > 1.5 && document.querySelectorAll('#vista .m-propio').length >= 1), '📍 lleva a tu circunscripción y la deja marcada con trazo dorado');

  console.log('Centro de mando');
  await pg.evaluate(() => { ESP.E.ui.mapa = null; ESP.App.ir('dashboard'); }); await esp(700);
  ok(await E(() => !!document.querySelector('#vista .d-mapa #mapa-w') && document.querySelectorAll('#vista .d-mapa .ficha').length === 54), 'el Centro de mando tiene su tarjeta con el mapa');
  ok(await E(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'el Centro de mando no se desborda con el mapa');
  await tocar('.d-mapa', 'SEV'); ok(await E(() => ESP.E.ui.mapa.sel && ESP.E.ui.mapa.sel.id === 'SEV' && /Sevilla/.test(document.querySelector('.d-mapa #mapa-panel h3').textContent)), 'se puede elegir una provincia desde el Centro de mando');
  if (!movil) { const [wx, wy] = await donde('.d-mapa', 'ZAR'); const y0 = await E(() => window.scrollY || document.querySelector('#vista').scrollTop), z0 = await E(() => ESP.E.ui.mapa.camC.z); await pg.mouse.move(wx, wy); await pg.mouse.wheel(0, 250); await esp(300); const z1 = await E(() => ESP.E.ui.mapa.camC.z); ok(Math.abs(z1 - z0) < 0.01, 'la rueda sin Ctrl no acerca el mapa del Centro de mando (la página sigue desplazándose)'); await pg.keyboard.down('Control'); await pg.mouse.wheel(0, -300); await pg.keyboard.up('Control'); await esp(300); ok(await E(() => ESP.E.ui.mapa.camC.z) > z1, 'Ctrl + rueda sí lo acerca'); }
  await pg.evaluate(() => document.querySelector('.d-mapa [data-ir="mapa"]').click()); await esp(900);
  ok(await E(() => ESP.E.ui.pantalla === 'mapa' && ESP.E.ui.mapa.sel && ESP.E.ui.mapa.sel.id === 'SEV' && /Sevilla/.test(document.querySelector('#mapa-panel h3').textContent)), '«Abrir el mapa» mantiene la selección en la pantalla completa');

  console.log('Territorio → Mapa');
  await pg.evaluate(() => { ESP.App.ir('territorio', { tab: 'mapa' }); }); await esp(700);
  ok(await E(() => document.querySelectorAll('#vista svg.mapa-es .ficha').length === 54 && !document.querySelector('.modal-fondo')), 'la pestaña Mapa de Territorio usa el mismo mapa');
  await tocar('#vista', 'BCN'); ok(await E(() => !document.querySelector('.modal-fondo') && !!ESP.E.ui.mapa.sel), 'pulsar el mapa no abre ventanas sueltas');

  console.log('Crisis');
  await pg.evaluate(() => { ESP.Crisis.nueva(ESP.E, { tipo: 'incendios', sev: 2 }); ESP.App.ir('crisis'); }); await esp(800);
  ok(await E(() => ESP.E.ui.mapa.capa === 'emerg' && document.querySelectorAll('#vista .d-mapa .marca').length >= 1), 'con una emergencia activa, Crisis abre el mapa con la capa de emergencias y sus marcas');
  ok(await E(() => /Emergencias/.test(document.querySelector('#mapa-desc').textContent) && /incendio/i.test(document.querySelector('#vista').textContent)), 'la lista de crisis sigue debajo del mapa');
  await capa('relM');
  await pg.evaluate(() => ESP.App.refrescar()); await esp(500); ok(await E(() => ESP.E.ui.mapa.capa === 'relM'), 'si cambias de capa dentro de Crisis, la elección se respeta al actualizar la pantalla');

  console.log('Partida guardada');
  const guardada = await E(() => { const s = JSON.stringify(ESP.E); return { ok: s.length > 1000, mapa: JSON.stringify(ESP.E.ui.mapa) }; });
  ok(guardada.ok && !/<|\{\}Element|controller/.test(guardada.mapa) && JSON.parse(guardada.mapa).capa, 'el estado del mapa se guarda con la partida y es sólo datos');

  ok(!err.length, 'sin errores de consola' + (err.length ? ': ' + err.slice(0, 3).join(' | ') : ''));
  console.log(fallos ? '✗ ' + fallos + ' fallos' : 'Todo bien'); await b.close(); srv.close(); process.exit(fallos ? 1 : 0);
})();
