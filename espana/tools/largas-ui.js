/* Partidas largas en el navegador (Playwright): crea o carga una partida y avanza años pulsando «Trimestre», resolviendo las ventanas que salgan como lo haría una persona.
   Falla si el tiempo se queda parado, si el desatasco tiene que intervenir (falta una ventana de verdad), si una ventana no se deja resolver o si hay errores de consola.
   Uso: node tools/largas-ui.js <escenario> [semanas=260]
   Escenarios: aut (presidente/a autonómico/a que lidera un partido nacional: el caso de Meritxell Vila) · loc · nac · base (carrera desde la base) · partido (modo partido)
               · movil (autonómica en un móvil) · carga (sigue jugando las partidas guardadas de versiones anteriores de tools/guardados) */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const ESC = {
  aut: { puerto: 8450, nivel: 'autonomico', partido: 'ES_CLD', rol: 'lider', prov: 'BCN' },
  loc: { puerto: 8451, nivel: 'local', partido: 'ES_ASD', rol: 'lider' },
  nac: { puerto: 8452, nivel: 'nacional', partido: 'ES_UPC', rol: 'lider', prov: 'MAD' },
  base: { puerto: 8453, nivel: 'nacional', partido: 'ES_ASD', rol: 'base', prov: 'MAD' },
  partido: { puerto: 8454, nivel: 'partido', partido: 'ES_UPC', rol: 'lider' },
  movil: { puerto: 8455, nivel: 'autonomico', partido: 'ES_UPC', rol: 'lider', prov: 'SEV', movil: true },
  carga: { puerto: 8456, carga: true }
};
const nombre = process.argv[2] || 'aut', e = ESC[nombre]; if (!e) { console.log('Escenarios:', Object.keys(ESC).join(', ')); process.exit(2); }
const OBJETIVO = +process.argv[3] || (nombre === 'carga' ? 130 : 260), PRESUPUESTO = 240000;   // ms por escenario (o por partida cargada)
(async () => {
  await new Promise(r => srv.listen(e.puerto, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(e.movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); let err = [];
  pg.on('pageerror', x => err.push('PAGE ' + x.message.slice(0, 200))); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text().slice(0, 200)); if (m.type() === 'warning' && /\[App\] Se resolvió/.test(m.text())) err.push('DESATASCO ' + m.text().slice(0, 200)); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const toca = s => e.movil ? pg.tap(s) : pg.click(s);
  const url = `http://localhost:${e.puerto}/index.html`;

  /* Resuelve las ventanas abiertas como una persona: decisiones, continuar, saltar escrutinios… Devuelve las que no supo resolver (y cerró a la fuerza). */
  let titulos = {}, forzadas = {}, repetidas = null;
  const BOTONES = ['#n-cerrar:not([disabled])', '#na-ok:not([disabled])', '#nv-ok:not([disabled])', '#ci-ok', '#nl-ok', '#pe-ok', '#np-ok', '#gf-ok', '[data-op]', '#n-saltar:not([disabled])', '#na-saltar:not([disabled])', '#nv-saltar:not([disabled])', '[data-o="respaldar"]', '[data-o]', '[data-nom]', '[data-v]', '[data-deb]', '[data-t]', '#db-ok', '#b-ok', '[data-res]', '[data-k]', '#cv-ok', '.cerrar'];
  const resolver = async () => {
    let seguidas = 0, ult = '';
    for (let i = 0; i < 60; i++) {
      if (!await pg.$('.modal-fondo')) return;
      const tit = await pg.evaluate(() => (document.querySelector('.modal-fondo .m-cab h2') || {}).textContent || ''); titulos[tit] = (titulos[tit] || 0) + 1;
      seguidas = tit === ult ? seguidas + 1 : 1; ult = tit; if (seguidas > 25) { repetidas = tit; return; }
      let hecho = false;
      for (const s of BOTONES) { const el = await pg.$('.modal-fondo ' + s); if (el && await el.isVisible()) { await el.click({ timeout: 2000 }).catch(() => {}); hecho = true; break; } }
      if (!hecho) { forzadas[tit] = (forzadas[tit] || 0) + 1; await pg.keyboard.press('Escape'); await pg.waitForTimeout(40); if (await pg.$('.modal-fondo')) await pg.evaluate(() => ESP.UI.cerrarModales()); }
      await pg.waitForTimeout(40);
    }
  };
  /* Con TRAZA=1, cuando el desatasco interviene se anota qué había pendiente y qué ventanas estaban abiertas (para entender por qué no salió su ventana). */
  const vigilarDesatasco = () => pg.evaluate(() => { if (window.__vigilado) return; window.__vigilado = true; const d = ESP.App.desatascar; ESP.App.desatascar = function (m) { const E = ESP.E; window.__diag = { motivo: m, bloqueo: ESP.Tiempo.bloqueo(), eventos: E.eventos.pendientes.map(x => (x.key || '-') + ' «' + x.titulo + '» (' + x.opciones.length + ' opc.)'), pila: ESP.UI.pila.length, modales: document.querySelectorAll('.modal-fondo').length, debate: E.esp.pendienteDebate, votos: E.parl.pendienteVoto.length }; return d.apply(this, arguments); }; });
  const estado = () => pg.evaluate(() => ({ t: ESP.E.fecha.t, fecha: ESP.U.fmtT(ESP.E.fecha.t), bloqueo: ESP.Tiempo.bloqueo(), modal: !!document.querySelector('.modal-fondo'), cargo: ESP.Personaje.cargoTxt(ESP.E) }));

  /* Avanza por trimestres hasta el objetivo; devuelve { semanas, atasco, repetida, agotado, fecha, cargo }. */
  const jugar = async objetivo => {
    const t0 = (await estado()).t, inicio = Date.now(); let atascos = 0, sinAvance = 0, atasco = null;
    for (let it = 0; it < 600; it++) {
      await resolver(); const a = await estado(); if (a.t - t0 >= objetivo || repetidas) break;
      if (Date.now() - inicio > PRESUPUESTO) return { semanas: a.t - t0, agotado: true, fecha: a.fecha, cargo: a.cargo };
      if (process.env.TRAZA) await vigilarDesatasco();
      await pg.evaluate(() => document.getElementById('b-tri').click()); await pg.waitForTimeout(140); await resolver();
      const d = await estado();
      if (process.env.TRAZA) { const g = await pg.evaluate(() => window.__diag); if (g) { console.log('  · DIAGNÓSTICO del desatasco:', JSON.stringify(g)); await pg.evaluate(() => { window.__diag = null; }); } }
      if (d.t === a.t) { sinAvance++; if (!d.modal && d.bloqueo) { if (++atascos >= 4) { atasco = d.fecha + ' (bloqueo: ' + d.bloqueo + ')'; break; } } } else atascos = 0;
    }
    const f = await estado(); return { semanas: f.t - t0, atasco, repetida: repetidas, fecha: f.fecha, cargo: f.cargo };
  };
  const informe = (etq, r) => {
    ok(!r.atasco, `${etq}: el tiempo nunca se queda parado` + (r.atasco ? ' — se paró el ' + r.atasco : ''));
    ok(!r.repetida, `${etq}: ninguna ventana se queda sin salida` + (r.repetida ? ' — «' + r.repetida.trim() + '»' : ''));
    ok(r.semanas >= (r.agotado ? Math.min(OBJETIVO, 100) : OBJETIVO) || !!r.atasco || !!r.repetida, `${etq}: juega ${r.semanas} semanas (≈ ${Math.round(r.semanas / 52 * 10) / 10} años) hasta ${r.fecha} como ${r.cargo}${r.agotado ? ' (se agotó el tiempo de la prueba)' : ''}`);
    const u = [...new Set(err)]; ok(!u.length, `${etq}: sin errores de consola ni intervenciones del desatasco` + (u.length ? ': ' + u.slice(0, 3).join(' | ') : ''));
    const raras = Object.keys(forzadas); if (raras.length) console.log('  · ventanas que la prueba no sabe pulsar y cierra a la fuerza:', raras.map(k => k.trim() + ' ×' + forzadas[k]).join(', '));
    err = []; titulos = {}; forzadas = {}; repetidas = null;
  };

  await pg.goto(url); await pg.waitForSelector('#i-nueva');
  if (e.carga) {
    const dir = path.join(__dirname, 'guardados');
    const lista = fs.readdirSync(dir).filter(f => /\.json\.br$/.test(f)).sort().filter(f => /^(c506026-aut|5ab7220-nac|2988a43-aut|20261018-loc)/.test(f));
    ok(lista.length >= 3, 'hay partidas guardadas de versiones anteriores para seguir jugando (' + lista.length + ')');
    for (const f of lista) {
      const txt = zlib.brotliDecompressSync(fs.readFileSync(path.join(dir, f))).toString('utf8');
      await pg.goto(url); await pg.waitForSelector('#i-nueva'); err = [];
      const r = await pg.evaluate(t => { const r = ESP.Guardado.desdeTexto(t, null); if (r.ok) { ESP.E.meta.presim = false; ESP.E.ui.sinGuia = true; ESP.App.comenzar(); } return r.ok; }, txt); await pg.waitForTimeout(800);
      ok(r, f + ': se carga en el navegador'); if (!r) continue;
      informe(f.replace(/\.json\.br$/, ''), await jugar(OBJETIVO));
    }
  } else {
    await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await toca(`[data-nivel="${e.nivel}"]`);
    if (e.nivel === 'local') await pg.selectOption('#c-muni', { index: 0 }).catch(() => {});
    else if (e.prov) await pg.evaluate(p => { const f = document.querySelector(`#c-mapa .ficha[data-prov="${p}"]`); if (f) f.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, e.prov);
    await toca('#c-sig'); await pg.waitForSelector('[data-partido]'); await toca(`[data-partido="${e.partido}"]`); await toca('#c-sig'); await pg.waitForSelector('[data-rol]'); await toca(`[data-rol="${e.rol}"]`); await toca('#c-sig'); await pg.waitForSelector('#c-ok'); await toca('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
    await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; ESP.E.ui.sinGuia = true; });
    informe(nombre, await jugar(OBJETIVO));
  }
  console.log(fallos ? '✗ ' + fallos + ' fallos' : 'Todo bien'); await b.close(); srv.close(); process.exit(fallos ? 1 : 0);
})().catch(x => { console.error('FALLO', x.message); process.exit(1); });
