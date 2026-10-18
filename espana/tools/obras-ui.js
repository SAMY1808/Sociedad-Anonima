/* Prueba de las obras sobre el mapa en el navegador (Playwright): capa «Obras», constructor (tipo → origen → destino → previsión), ordenar, ver el avance y la inauguración,
   cancelar, pedir una obra sin tener competencia, ficha de ciudad con «Proyectar desde aquí», selección de una obra existente, filtros, botón de obras en otras capas y la Agenda.
   Uso: node tools/obras-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil', PUERTO = movil ? 8471 : 8470;
(async () => {
  await new Promise(r => srv.listen(PUERTO, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const esp = ms => pg.waitForTimeout(ms), E = f => pg.evaluate(f);
  const toca = s => movil ? pg.tap(s) : pg.click(s);
  /* Pulsa una ciudad del mapa como lo haría una persona: en el punto donde está dibujada. */
  const ciudad = async id => {
    await pg.evaluate(id => document.querySelector('#mapa-lienzo').scrollIntoView({ block: 'center' }), id); await esp(150);
    const [x, y] = await pg.evaluate(id => { const c = document.querySelector('.m-ciu .ciu[data-muni="' + id + '"]'), r = c.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, id);
    if (movil) await pg.touchscreen.tap(x, y); else await pg.mouse.click(x, y); await esp(700);
  };
  /* Pasa semanas resolviendo (de forma neutra) las decisiones que vayan saliendo, y cierra las ventanas que abran. */
  const avanzar = async n => { await pg.evaluate(n => { for (let i = 0; i < n; i++) { let g = 0; while (ESP.Tiempo.bloqueo() && g++ < 15) ESP.Desatasco.resolver(ESP.E); ESP.Tiempo.avanzar(); } ESP.UI.cerrarModales(); }, n); };
  const toast = () => E(() => [...document.querySelectorAll('.toast, #toasts > *')].map(x => x.textContent).join(' | '));

  console.log('Empieza la partida (presidente/a del Gobierno)');
  await pg.goto(`http://localhost:${PUERTO}/index.html`); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await toca('[data-nivel="nacional"]');
  await pg.evaluate(() => { const f = document.querySelector('#c-mapa .ficha[data-prov="MAD"]'); f.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await toca('#c-sig'); await pg.waitForSelector('[data-partido]'); await toca('[data-partido="ES_ASD"]'); await toca('#c-sig'); await pg.waitForSelector('[data-rol]'); await toca('[data-rol="lider"]'); await toca('#c-sig'); await pg.waitForSelector('#c-ok'); await toca('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; ESP.E.ui.sinGuia = true; ESP.E.jugador.agenda.puntos = ESP.E.jugador.agenda.max = 12; }); await esp(600);
  ok(await E(() => ESP.E.jugador.cargo === 'pm'), 'la partida empieza con el jugador al frente del Gobierno');

  console.log('Capa «Obras»');
  await pg.evaluate(() => ESP.App.ir('mapa', { capa: 'obras' })); await esp(800);
  ok(await E(() => ESP.E.ui.mapa.capa === 'obras' && !!document.querySelector('.mapa-es .m-obras')), 'la capa Infraestructuras se abre desde el enlace con su superposición');
  ok(await E(() => ESP.Mapa.grupos().some(g => g.n === 'Obras')), 'forma su propia familia de capas «Obras»');
  const lineas = await E(() => document.querySelectorAll('.m-obras path.o-h').length);
  ok(lineas > 90, `dibuja la red existente: ${lineas} tramos de autovía, alta velocidad y línea eléctrica`);
  ok(await E(() => document.querySelectorAll('.m-ciu .ciu').length === 66), 'siempre se ven las 66 ciudades (para poder elegirlas)');
  ok(await E(() => /Obras públicas/.test(document.querySelector('#mapa-panel').textContent) && document.querySelectorAll('[data-mobra-tipo]').length === 7), 'el panel ofrece los siete tipos de obra');
  ok(await E(() => document.querySelectorAll('[data-mobra-prep]').length === 3), 'y tres propuestas para preparar con un clic');
  ok(await E(() => /Autovía/.test(document.querySelector('#mapa-leyenda').textContent) && !!document.querySelector('#mapa-leyenda .sw-l')), 'la leyenda explica los colores de las líneas');
  ok(await E(() => /Ordenas las obras del Estado/.test(document.querySelector('#mapa-panel').textContent)), 'dice qué puedes ordenar con tu cargo');
  const tt = await E(() => document.querySelector('.m-obras .o-hit').dataset.tt); ok(/En servicio/.test(tt), 'cada tramo tiene su aviso');

  console.log('Trazar una autovía de un punto a otro');
  await toca('[data-mobra-tipo="autovia"]'); await esp(500);
  ok(await E(() => document.querySelector('#mapa-obrabar').classList.contains('ver') && /origen/.test(document.querySelector('#mapa-obrabar').textContent) && document.querySelector('svg.mapa-es').classList.contains('construyendo')), 'aparece la barra del constructor sobre el mapa: «Pulsa la ciudad de origen»');
  ok(await E(() => document.querySelectorAll('.m-ciu .ciu.ob-ok').length === 66) && await E(() => !!document.querySelector('#ob-a') && !!document.querySelector('#ob-b')), 'todas las ciudades se pueden elegir y el panel trae también selectores');
  await ciudad('m_mad');
  ok(await E(() => ESP.E.ui.mapa.obra && ESP.E.ui.mapa.obra.a === 'm_mad' && !ESP.E.ui.mapa.obra.b && document.querySelectorAll('.m-ciu .ciu.ob-a').length === 1), 'al pulsar Madrid queda como origen');
  ok(await E(() => document.querySelectorAll('.m-ciu .ciu.ob-no').length > 5 && [...document.querySelectorAll('.m-ciu .ciu.ob-no')].some(c => /por tierra/.test(c.dataset.tt))), 'las ciudades a las que no se puede llegar se atenúan y explican por qué (p. ej. Palma, por tierra)');
  ok(await E(() => { const c = document.querySelector('.m-ciu .ciu.ob-ok:not(.ob-a)'); return /km/.test(c.dataset.tt) && /Coste/.test(c.dataset.tt); }), 'las válidas avisan de la distancia, el coste y el plazo');
  await ciudad('m_leo');
  ok(await E(() => ESP.E.ui.mapa.obra.b === 'm_leo' && !!document.querySelector('.m-obras .o-prev')), 'al pulsar León aparece la vista previa del trazado');
  const prev = await E(() => document.querySelector('#mapa-panel').textContent);
  ok(/287 km/.test(prev) && /1980 M€/.test(prev) && /2 años y 7 meses/.test(prev) && /Al inaugurarla/.test(prev) && /Aprobación/.test(prev) && /Voto del partido/.test(prev), 'el panel muestra distancia, coste, plazo y los efectos previstos');
  ok(await E(() => !!document.querySelector('[data-accion="obra_lanzar"]') && !document.querySelector('[data-accion="obra_lanzar"]').classList.contains('desact')), 'y el botón «Ordenar la obra» está disponible');
  // Cambiar el destino con el selector
  await pg.selectOption('#ob-b', 'm_zam'); await esp(700);
  ok(await E(() => ESP.E.ui.mapa.obra.b === 'm_zam' && /Madrid/.test(document.querySelector('.mapa-pasos').textContent) && /Zamora/.test(document.querySelector('.mapa-pasos').textContent)), 'se puede cambiar el destino con el selector');
  ok(await E(() => [...document.querySelectorAll('#ob-b option')].find(o => o.value === 'm_pal2').disabled), 'los destinos imposibles aparecen desactivados en el selector');
  await pg.selectOption('#ob-b', 'm_leo'); await esp(700);
  await pg.evaluate(() => document.querySelector('[data-accion="obra_lanzar"]').scrollIntoView({ block: 'center' })); await esp(100);
  await toca('[data-accion="obra_lanzar"]'); await esp(900);
  ok(await E(() => ESP.Obras.activas(ESP.E).length === 1 && ESP.Obras.activas(ESP.E)[0].quien === 'jug' && !ESP.E.ui.mapa.obra), 'se ordena la obra y se cierra el constructor');
  ok(/Ordenas la autovía Madrid–León/.test(await toast()), 'avisa en pantalla de lo que has ordenado');
  ok(await E(() => ESP.E.ui.mapa.sel && ESP.E.ui.mapa.sel.t === 'obra' && /En construcción/.test(document.querySelector('#mapa-panel').textContent) && /Acelerar/.test(document.querySelector('#mapa-panel').textContent)), 'la obra queda seleccionada con su ficha: avance, efectos, acelerar y cancelar');
  ok(await E(() => { const O = ESP.Obras, vis = O.visibles(ESP.E).filter(w => w.estado === 'curso'); return document.querySelectorAll('.m-obras path.o-c').length === vis.filter(w => O.TIPOS[w.tipo].ab).length && document.querySelectorAll('.m-marc .obra-m').length === vis.length && vis.length >= 1; }), 'en el mapa se ve en obras (trazo discontinuo y cabeza de obra)');
  ok(await E(() => document.querySelectorAll('.m-obras path.o-prev').length === 0), 'la vista previa desaparece');

  console.log('Avance e inauguración');
  await avanzar(26); await pg.evaluate(() => ESP.App.refrescar()); await esp(800);
  const av = await E(() => { const w = ESP.Obras.activas(ESP.E)[0]; return { p: w.prog, trozo: !!document.querySelector('.m-obras path.o-p') }; });
  ok(av.p > 0.1 && av.trozo, `a las 26 semanas lleva el ${Math.round(av.p * 100)} % y el tramo hecho se dibuja continuo sobre el discontinuo`);
  if (process.env.TRAZA) console.log('  · obras propias y de la IA:', JSON.stringify(await E(() => ESP.Obras.visibles(ESP.E).filter(w => w.quien !== 'red').map(w => [w.id, w.tipo, w.owner, w.quien, w.estado, Math.round(w.prog * 100)]))), 'cargo', await E(() => ESP.E.jugador.cargo));
  await pg.evaluate(() => { const w = ESP.Obras.visibles(ESP.E).find(x => x.quien === 'jug' && x.estado === 'curso'); w.prog = 0.9999; w.pausa = 0; }); await avanzar(1); await esp(300);
  ok(/Se inaugura la autovía Madrid–León/.test(await toast()), 'al terminar, aviso de la inauguración');
  await pg.evaluate(() => ESP.App.refrescar()); await esp(800);
  ok(await E(() => { const O = ESP.Obras, ab = w => O.TIPOS[w.tipo].ab, vis = O.visibles(ESP.E); return vis.some(w => w.quien === 'jug' && w.estado === 'hecha') && document.querySelectorAll('.m-obras path.o-c').length === vis.filter(w => ab(w) && w.estado === 'curso').length && document.querySelectorAll('.m-obras path.o-h:not(.o-red)').length === vis.filter(w => ab(w) && w.estado === 'hecha' && w.quien !== 'red').length; }), 'la autovía pasa a trazo continuo y sale de «en obras»');
  ok(await E(() => /Se inaugura la autovía Madrid–León/.test(ESP.E.noticias[0].texto) || ESP.E.noticias.slice(0, 4).some(n => /Se inaugura la autovía Madrid–León/.test(n.texto))), 'sale en las noticias');

  console.log('Ficha de ciudad y «Proyectar desde aquí»');
  await pg.evaluate(() => ESP.App.ir('mapa', { capa: 'voto' })); await esp(700);
  await pg.evaluate(() => { const c = document.querySelector('.m-ciu .ciu[data-muni="m_sev"]'); });
  await pg.evaluate(() => { ESP.E.ui.mapa.sel = { t: 'muni', id: 'm_sev' }; ESP.App.refrescar(); }); await esp(800);
  ok(await E(() => /Obras y conexiones/.test(document.querySelector('#mapa-panel').textContent) && document.querySelectorAll('[data-mobra-desde]').length === 7 && /Córdoba/.test(document.querySelector('#mapa-panel').textContent)), 'la ficha de Sevilla lista sus conexiones (Córdoba, Cádiz…) y siete botones para proyectar');
  await pg.evaluate(() => document.querySelector('[data-mobra-desde="aeropuerto|m_sev"]').scrollIntoView({ block: 'center' })); await esp(100);
  await toca('[data-mobra-desde="aeropuerto|m_sev"]'); await esp(900);
  ok(await E(() => ESP.E.ui.mapa.capa === 'obras' && ESP.E.ui.mapa.obra.tipo === 'aeropuerto' && ESP.E.ui.mapa.obra.a === 'm_sev' && /Nivel/.test(document.querySelector('#mapa-panel').textContent) && !!document.querySelector('[data-accion="obra_lanzar"]')), 'desde la ciudad se abre el constructor con el aeropuerto ya situado en Sevilla (una sola ciudad) y la capa Obras');
  await pg.evaluate(() => document.querySelector('[data-mobra-x]').scrollIntoView({ block: 'center' })); await toca('[data-mobra-x]'); await esp(500);
  ok(await E(() => !ESP.E.ui.mapa.obra && !document.querySelector('#mapa-obrabar').classList.contains('ver')), 'se puede cancelar el constructor');

  console.log('Seleccionar una obra existente y filtros');
  const hit = await E(() => { const h = document.querySelector('.m-obras .o-hit[data-obra^="r"]'); return h ? h.dataset.obra : null; });
  await pg.evaluate(id => { ESP.E.ui.mapa.sel = { t: 'obra', id }; ESP.App.refrescar(); }, hit); await esp(800);
  ok(await E(() => /En servicio/.test(document.querySelector('#mapa-panel').textContent) && /Red existente/.test(document.querySelector('#mapa-panel').textContent) && !document.querySelector('[data-accion="obra_cancelar"]')), 'un tramo de la red existente se consulta pero no se cancela');
  ok(await E(() => document.querySelectorAll('.m-obras path.sel').length === 1), 'y se resalta en el mapa');
  await pg.evaluate(() => { ESP.E.ui.mapa.sel = null; ESP.App.refrescar(); }); await esp(700);
  const n0 = await E(() => document.querySelectorAll('.m-obras path.o-h').length);
  await pg.evaluate(() => document.querySelector('[data-mvis="ave"]').scrollIntoView({ block: 'center' })); await toca('[data-mvis="ave"]'); await esp(400);
  const n1 = await E(() => document.querySelectorAll('.m-obras path.o-h').length);
  ok(n1 < n0 - 10 && await E(() => !document.querySelector('[data-mvis="ave"]').classList.contains('activo')), `el filtro oculta la alta velocidad (${n0} → ${n1} tramos)`);
  await toca('[data-mvis="ave"]'); await esp(300);
  await pg.evaluate(() => { ESP.E.ui.mapa.capa = 'voto'; ESP.E.ui.mapa.sel = null; ESP.App.refrescar(); }); await esp(800);
  ok(await E(() => document.querySelectorAll('.m-obras path').length === 0), 'en otras capas no se dibujan las obras…');
  await pg.evaluate(() => document.querySelector('[data-mobras]').scrollIntoView({ block: 'center' })); await toca('[data-mobras]'); await esp(500);
  ok(await E(() => document.querySelectorAll('.m-obras path.o-h').length > 50 && document.querySelector('[data-mobras]').classList.contains('activo')), '…pero el botón 🛣 las superpone sobre cualquier capa');

  console.log('Pedir una obra sin competencia');
  await pg.evaluate(() => { const J = ESP.E.jugador; J.cargo = 'diputado'; J.agenda.puntos = 6; ESP.App.ir('mapa', { capa: 'obras' }); }); await esp(800);
  ok(await E(() => /no ordena obras públicas/.test(document.querySelector('#mapa-panel').textContent) && document.querySelectorAll('[data-mobra-prep]').length === 3), 'con otro cargo el panel dice que sólo puedes pedirlas y propone obras para tu comunidad');
  await pg.evaluate(() => document.querySelector('[data-mobra-tipo="hospital"]').scrollIntoView({ block: 'center' })); await toca('[data-mobra-tipo="hospital"]'); await esp(500);
  await pg.selectOption('#ob-a', 'm_tol'); await esp(900);
  ok(await E(() => /Probabilidad estimada/.test(document.querySelector('#mapa-panel').textContent) && !!document.querySelector('[data-accion="obra_pedir"]') && !document.querySelector('[data-accion="obra_lanzar"]')), 'la previsión es una petición: probabilidad de que acepte y botón «Pedir la obra»');
  await pg.evaluate(() => document.querySelector('[data-accion="obra_pedir"]').scrollIntoView({ block: 'center' })); await toca('[data-accion="obra_pedir"]'); await esp(900);
  ok(await E(() => ESP.E.esp.obras.cd && Object.keys(ESP.E.esp.obras.cd).some(k => /^p:hospital:m_tol/.test(k)) && !ESP.E.ui.mapa.obra), 'la petición se responde (acepte o no) y el constructor se cierra');
  ok(/(accede|rechaza)/.test(await toast()), 'con aviso de la respuesta: ' + (await toast()).slice(0, 90));

  console.log('Agenda');
  await pg.evaluate(() => ESP.App.ir('agenda')); await esp(600);
  ok(await E(() => /Obras públicas/.test(document.querySelector('#vista').textContent) && !!document.querySelector('[data-ir-obras]') && !document.querySelector('#vista [data-accion="obra_lanzar"]')), 'la Agenda lleva al mapa de obras y no lista las acciones del mapa como botones sueltos');
  await pg.evaluate(() => document.querySelector('[data-ir-obras]').scrollIntoView({ block: 'center' })); await toca('[data-ir-obras]'); await esp(800);
  ok(await E(() => ESP.E.ui.pantalla === 'mapa' && ESP.E.ui.mapa.capa === 'obras'), 'y abre la capa Obras');

  console.log(movil ? 'Móvil' : 'Detalles de diseño');
  await pg.evaluate(() => { ESP.E.jugador.cargo = 'pm'; ESP.E.ui.mapa.obra = null; ESP.E.ui.mapa.sel = null; ESP.App.ir('mapa', { capa: 'obras' }); }); await esp(800);
  ok(await E(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'la pantalla no se desborda horizontalmente');
  await pg.evaluate(() => document.querySelector('[data-mobra-tipo="electrica"]').scrollIntoView({ block: 'center' })); await toca('[data-mobra-tipo="electrica"]'); await esp(500);
  await pg.selectOption('#ob-a', 'm_cad'); await esp(500); await pg.selectOption('#ob-b', 'm_ceu'); await esp(900);
  ok(await E(() => /cable submarino/i.test(document.querySelector('#mapa-panel').textContent) || /Con cable submarino/.test(document.querySelector('#mapa-panel').innerHTML)), 'una línea eléctrica hasta Ceuta se presenta con cable submarino');
  const solapa = await E(() => { const a = document.querySelector('#mapa-obrabar').getBoundingClientRect(), z = document.querySelector('.mapa-zoom').getBoundingClientRect(); return a.right > z.left && a.left < z.right && a.bottom > z.top && a.top < z.bottom; });
  ok(!solapa, 'la barra del constructor no tapa los botones de zoom');
  await toca('[data-mobra-x]'); await esp(300);

  const e = [...new Set(err)]; ok(!e.length, 'sin errores de consola ni de página' + (e.length ? ': ' + e.slice(0, 3).join(' | ') : ''));
  console.log(fallos ? '✗ ' + fallos + ' fallos' : 'Todo bien'); await b.close(); srv.close(); process.exit(fallos ? 1 : 0);
})().catch(x => { console.error('FALLO', x.message); process.exit(1); });
