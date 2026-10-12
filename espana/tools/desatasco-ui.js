/* Prueba del desatasco en el navegador (Playwright): una partida con el aviso de un debate que el cargo no ve (el bloqueo de la partida de Meritxell Vila),
   y la red de seguridad cuando la ventana de una decisión falla o no llega a abrirse. Uso: node tools/desatasco-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil', PUERTO = movil ? 8322 : 8321;
(async () => {
  await new Promise(r => srv.listen(PUERTO, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const esp = ms => pg.waitForTimeout(ms);
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  const estado = () => pg.evaluate(() => ({ t: ESP.E.fecha.t, bloqueo: ESP.Tiempo.bloqueo(), modal: !!document.querySelector('.modal-fondo'), debate: !!ESP.E.esp.pendienteDebate }));
  /* Resuelve las ventanas que se abran (opciones, botones de aceptar…). */
  const resolver = async () => {
    for (let i = 0; i < 40; i++) {
      if (!await pg.$('.modal-fondo')) return;
      let hecho = false;
      for (const s of ['#n-saltar:not([disabled])', '#n-cerrar:not([disabled])', '#nl-ok', '#pe-ok', '#np-ok', '#gf-ok', '#na-saltar', '#na-ok', '[data-o="respaldar"]', '[data-nom]', '[data-op]', '[data-v]', '[data-deb]', '[data-t]', '#db-ok', '#b-ok', '[data-res]', '[data-k]', '#cv-ok', '.cerrar']) {
        const e = await pg.$('.modal-fondo ' + s); if (e && await e.isVisible()) { await e.click({ timeout: 2000 }).catch(() => {}); hecho = true; break; }
      }
      if (!hecho) { await pg.keyboard.press('Escape'); await esp(50); if (await pg.$('.modal-fondo')) await pg.evaluate(() => ESP.UI.cerrarModales()); }
      await esp(60);
    }
  };
  /* Avanza con el botón y resuelve lo que salga; devuelve las semanas que pasaron. */
  const avanzar = async id => { const a = (await estado()).t; await resolver(); await pg.evaluate(i => document.getElementById(i).click(), id); await esp(450); await resolver(); return (await estado()).t - a; };

  await pg.goto(`http://localhost:${PUERTO}/index.html`); await pg.waitForSelector('#i-nueva');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await clic('[data-nivel="autonomico"]'); await pg.evaluate(() => document.querySelector('#c-mapa .ficha[data-prov="BCN"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await esp(200);
  await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_UPC"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; ESP.E.ui.sinGuia = true; }); await esp(400);

  console.log('Partida con el aviso heredado de un debate que el cargo no ve');
  /* Como en la partida de Meritxell Vila: presidenta autonómica que lidera un partido nacional, con las Cortes disueltas y el aviso del debate colgado. */
  await pg.evaluate(() => { const E = ESP.E; E.partidos[E.jugador.partido].lider = 'J'; E.esp.cortes.estado = 'disueltas'; E.esp.cortes.proxT = E.fecha.t + 8; const c = ESP.Campana.iniciar(E); c.debate.t = E.fecha.t; E.esp.pendienteDebate = true; E.meta.presim = false; });
  ok((await estado()).bloqueo === 'evento', 'el aviso deja el tiempo detenido (como en la partida guardada)');
  await pg.evaluate(() => { const txt = JSON.stringify(ESP.E); ESP.Guardado.desdeTexto(txt, null); ESP.App.comenzar(); }); await esp(900);
  let e = await estado(); ok(e.bloqueo === null && !e.debate && !e.modal, 'al cargar la partida se repara: el tiempo vuelve a correr y no sale ninguna ventana rota');
  ok(await pg.evaluate(() => ESP.E.esp.camp.debate.hecho === true), 'el debate de unas generales que tu cargo no ve se celebró solo');
  const t0 = (await estado()).t;
  ok(await avanzar('b-sem') >= 1, '▶ Semana avanza'); ok(await avanzar('b-mes') >= 1, '▶▶ Mes avanza'); ok(await avanzar('b-tri') >= 1, '⏩ Trimestre avanza');
  for (let i = 0; i < 14 && (await estado()).t - t0 < 20; i++) await avanzar('b-tri');
  ok((await estado()).t - t0 >= 20, 'sigue avanzando por las generales y más allá (' + ((await estado()).t - t0) + ' semanas en total)');

  console.log('Red de seguridad: la ventana de una decisión falla');
  await pg.evaluate(() => { const E = ESP.E; E.meta.ajustes = Object.assign({}, E.meta.ajustes, { foco: 'todo' }); E.esp.cortes.estado = 'disueltas'; E.esp.cortes.proxT = E.fecha.t + 8; const c = ESP.Campana.iniciar(E); c.debate.t = E.fecha.t; c.debate.hecho = false; E.esp.pendienteDebate = true; ESP.Pantallas.campana.modalDebate = () => { throw new Error('ventana rota a propósito'); }; });
  err.length = 0; const ta = (await estado()).t;
  await pg.evaluate(() => document.getElementById('b-sem').click()); await esp(700);
  const tox = await pg.evaluate(() => [...document.querySelectorAll('#toasts .toast')].map(x => x.textContent).join(' | '));
  await resolver(); e = await estado(); ok(e.bloqueo === null && !e.debate, 'si la ventana falla, el desatasco celebra el debate y libera el tiempo' + (e.bloqueo ? ' (bloqueo ' + e.bloqueo + ')' : ''));
  ok(/Se resolvió automáticamente un debate/.test(tox), 'y avisa de lo que ha hecho' + (/Se resolvió/.test(tox) ? '' : ' (avisos: ' + tox.slice(0, 160) + ')'));
  ok(await avanzar('b-sem') >= 1 && (await estado()).t > ta, 'después el tiempo avanza con normalidad');
  const extra = err.filter(x => !/ventana rota|la ventana de una decisión pendiente falló/.test(x)); ok(!extra.length, 'sin más errores que el provocado' + (extra.length ? ': ' + extra.slice(0, 2).join(' | ') : ''));

  console.log('Red de seguridad: la ventana no llega a abrirse');
  await pg.evaluate(() => { const E = ESP.E; const c = ESP.Campana.iniciar(E); c.debate.t = E.fecha.t; c.debate.hecho = false; E.esp.pendienteDebate = true; ESP.Pantallas.campana.modalDebate = () => { /* no abre nada */ }; });
  const tb = (await estado()).t; await pg.evaluate(() => document.getElementById('b-sem').click()); await esp(1100);
  await resolver(); e = await estado(); ok(e.bloqueo === null && !e.debate && e.t === tb, 'si no se abre ninguna ventana, a los instantes se resuelve sola (sin perder la semana)' + (e.bloqueo || e.t !== tb ? ' (' + JSON.stringify(e) + ' · antes ' + tb + ')' : ''));
  ok(await avanzar('b-sem') >= 1, 'y el siguiente avance funciona');

  console.log('Botón manual en Ajustes');
  await pg.evaluate(() => { const E = ESP.E; const c = ESP.Campana.iniciar(E); c.debate.t = E.fecha.t; c.debate.hecho = false; E.esp.pendienteDebate = true; ESP.Pantallas.campana.modalDebate = () => { /* ventana rota */ }; ESP.App.ir('ajustes'); }); await esp(400);
  ok(await pg.evaluate(() => /hay una decisión pendiente/.test(document.getElementById('aj-bloqueo').textContent)), 'Ajustes → «Si el tiempo no avanza» dice que hay una decisión pendiente');
  await clic('#aj-desatascar'); await esp(300); e = await estado();
  ok(e.bloqueo === null && !e.debate && await pg.evaluate(() => /Hecho/.test(document.getElementById('aj-bloqueo').textContent)), 'el botón resuelve la decisión pendiente y lo cuenta');
  await clic('#aj-desatascar'); await esp(200);
  ok(await pg.evaluate(() => [...document.querySelectorAll('#toasts .toast')].some(x => /No hay ninguna decisión pendiente/.test(x.textContent))), 'si no hay nada pendiente, lo dice');
  await pg.evaluate(() => ESP.App.ir('dashboard')); await esp(300);

  console.log('Que no moleste en el juego normal');
  err.length = 0; await pg.evaluate(() => { ESP.E.meta.ajustes = Object.assign({}, ESP.E.meta.ajustes, { foco: 'cargo' }); });
  const antes = await pg.evaluate(() => (window.__avisos = 0)); await pg.evaluate(() => { const w = console.warn; console.warn = function (...a) { if (/\[App\]/.test(String(a[0]))) window.__avisos++; return w.apply(this, a); }; });
  for (let i = 0; i < 8; i++) await avanzar('b-tri');
  ok(await pg.evaluate(() => window.__avisos) === 0, 'durante ocho trimestres de juego normal el desatasco no interviene ni una vez');
  ok(!err.length, 'sin errores de consola' + (err.length ? ': ' + err.slice(0, 3).join(' | ') : ''));
  console.log(fallos ? '✗ ' + fallos + ' fallos' : 'Todo bien'); await b.close(); srv.close(); process.exit(fallos ? 1 : 0);
})();
