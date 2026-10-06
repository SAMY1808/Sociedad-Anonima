/* Prueba de interfaz del equipo y las nuevas pestañas (Playwright): jefe de gabinete, medios, justicia, diálogo social, crisis y partido por dentro.
   Uso: node tools/equipo-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8136, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8136/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  await cerrar();
  await pg.evaluate(() => { const E = ESP.E; E.eventos.pendientes = []; E.ue.pendiente = []; ESP.App.ir('jefe'); });
  await pg.waitForSelector('#jf-buscar'); ok(true, 'pestaña Jefe de gabinete sin jefe');
  await clic('#jf-buscar'); await pg.waitForSelector('[data-nombrar]'); await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-jefe1.png` });
  await clic('[data-nombrar]'); await pg.waitForSelector('#jf-todo-d'); ok(true, 'nombra jefe de gabinete');
  await clic('[data-area="agenda"][data-modo="asesor"]'); await clic('#jf-todo-d'); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => Object.keys(ESP.E.esp.jefe.deleg).length >= 9 && ESP.E.esp.jefe.deleg.votos === 'delegado'), 'delegar todas las áreas');
  await pg.evaluate(() => { for (let i = 0; i < 4; i++) ESP.App.avanzar(1); ESP.E.eventos.pendientes = []; ESP.UI.cerrarModales(); ESP.App.ir('jefe'); });
  await pg.waitForTimeout(300); await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-jefe2.png` });
  for (const p of ['medios', 'justicia', 'social', 'crisis']) {
    await pg.evaluate(p => { ESP.E.eventos.pendientes = []; ESP.UI.cerrarModales(); ESP.App.ir(p); }, p); await pg.waitForTimeout(250);
    ok(await pg.evaluate(() => document.querySelector('#vista h1') && !/Error de interfaz/.test(document.getElementById('vista').textContent)), 'pestaña ' + p + ' se dibuja');
    await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-${p}.png`, fullPage: false });
  }
  await pg.evaluate(() => { const E = ESP.E; ESP.Crisis.nueva(E); E.paises.ES.gob.pm = 'J'; ESP.App.ir('crisis'); }); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => !!document.querySelector('[data-accion="gestionar_crisis"], [data-acc="gestionar_crisis"]') || /Ordenar/.test(document.getElementById('vista').textContent)), 'crisis: opciones de respuesta');
  await pg.evaluate(() => { ESP.E.ui.tabPartido = 'interno'; ESP.App.ir('partido'); }); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => /Familias del partido/.test(document.getElementById('vista').textContent)), 'Mi partido: pestaña interna');
  await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-partido.png` });
  await pg.evaluate(() => { ESP.E.ui.tabPartido = 'resumen'; ESP.App.ir('partido'); }); await pg.waitForTimeout(200);
  ok(await pg.evaluate(() => /Apoyo estatal/.test(document.getElementById('vista').textContent)), 'Mi partido: resumen intacto');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
