/* Humo de interfaz: abre cada pestaña nueva (y sus subpestañas) y comprueba que se dibuja sin errores. Uso: node tools/pestanas-ui.js [movil]
   Uso: node tools/pestanas-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8139, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8139/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  await cerrar();
  const PANTALLAS = {
    dilemas: [null, []], partido: ['tabPartido', ['resumen', 'interno']], mayorias: ['tabMay', ['mayorias', 'rivales', 'pactos']], corrupcion: ['tabCor', ['casos', 'coms', 'control']], coaliciones: [null, []], corona: [null, []], personas: ['tabPers', ['fichas', 'fichajes', 'expres']], organismos: [null, []], referendos: [null, []], estructural: ['tabEst', ['viv', 'fin', 'ener', 'inm']], exterior: ['tabExt', ['ext', 'ue', 'mundo']], lenguas: [null, []], local2: [null, []], guia: [null, []], ajustes: [null, []], legado: ['tabLegado', ['semana', 'stats', 'balance', 'logros', 'epilogo', 'cronica', 'metas']], medios: ['tabMed', ['prensa', 'tertulias']], cortes: ['tabCortes', ['conferencia']]
  };
  await pg.evaluate(() => { const E = ESP.E; E.esp.corona = { apoyo: 52 }; E.eventos.pendientes = []; E.ue.pendiente = []; ESP.Corrupcion.nuevo(E, E.paises.ES.partidos.find(x => x !== E.jugador.partido && E.partidos[x].amb === 'nac'), {}); });
  for (const p of Object.keys(PANTALLAS)) {
    const [clave, tabs] = PANTALLAS[p];
    for (const t of (tabs.length ? tabs : [null])) {
      await pg.evaluate(({ p, clave, t }) => { ESP.E.eventos.pendientes = []; ESP.UI.cerrarModales(); if (clave && t) ESP.E.ui[clave] = t; ESP.App.ir(p); }, { p, clave, t }); await pg.waitForTimeout(150);
      const bien = await pg.evaluate(() => { const v = document.getElementById('vista'); return !!document.querySelector('#vista h1') && !/Error de interfaz/.test(v.textContent); });
      ok(bien, 'pestaña ' + p + (t ? ' / ' + t : ''));
    }
    await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-${p}.png` });
  }
  // Los menús: ¿están las entradas nuevas en el menú?
  const nav = await pg.evaluate(() => Array.from(document.querySelectorAll('#nav button')).map(b => b.dataset.p));
  for (const p of Object.keys(PANTALLAS)) ok(movil || nav.includes(p) || p === 'cortes', 'menú con ' + p);
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
