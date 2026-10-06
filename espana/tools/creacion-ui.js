/* Prueba de interfaz de la creación de partida: partido propio (logo, financiación, implantación) y escenario de inicio.
   Uso: node tools/creacion-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8140, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8140/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="nuevo"]');
  await pg.waitForSelector('[data-logo]'); ok(true, 'el formulario del partido nuevo muestra logotipo, financiación e implantación');
  await clic('[data-logo="🌿"]'); await clic('[data-fin="potente"]'); await clic('[data-impl="ARA"]'); await clic('[data-impl="NAV"]');
  await pg.fill('#n-nombre', 'Tierra Futura'); await pg.fill('#n-sigla', 'TFU');
  await clic('#c-sig'); await pg.waitForSelector('.crea-cuerpo'); await clic('#c-sig'); await pg.waitForSelector('[data-esc]');
  ok(await pg.$$eval('[data-esc]', b => b.length) >= 6, 'el último paso lista los escenarios');
  await clic('[data-esc="crisis_economica"]'); await pg.waitForTimeout(150);
  await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const r = await pg.evaluate(() => { const E = ESP.E, p = E.partidos.ES_TFU; return { logo: p && p.logo, fin: p && p.finanzas, impl: p && p.implant, esc: E.meta.escenario, prima: ESP.Estructural.asegurar(E).fin.prima }; });
  ok(r.logo === '🌿' && r.fin === 68 && r.impl.length === 2, 'el partido nuevo se crea con logo, finanzas e implantación: ' + JSON.stringify(r));
  ok(r.esc === 'crisis_economica' && r.prima > 300, 'el escenario se aplica (prima ' + Math.round(r.prima) + ')');
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.App.ir('ajustes'); }); await pg.waitForSelector('#aj-gen');
  await clic('#aj-gen'); await pg.waitForFunction(() => document.querySelector('#aj-cod').value.startsWith('CURUL1:'), null, { timeout: 20000 });
  const cod = await pg.$eval('#aj-cod', e => e.value); ok(cod.length > 1000, 'se genera el código de la partida (' + Math.round(cod.length / 1024) + ' KB)');
  await clic('[data-aj="dif"][data-v="dificil"]'); ok(await pg.evaluate(() => ESP.Ajustes.get(ESP.E).dif === 'dificil'), 'dificultad cambiada');
  await pg.fill('#aj-in', cod); await clic('#aj-cargar'); await pg.waitForTimeout(1500);
  ok(await pg.evaluate(() => !!ESP.E.partidos.ES_TFU), 'se carga la partida desde el código');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
