/* Regresión: el barómetro de «Elecciones» no debe dar errores de gráfico si un partido nuevo falta en encuestas antiguas. Uso: node tools/barometro-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8161, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8161/index.html'); await pg.waitForSelector('#i-nueva'); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await pg.click('[data-nivel="nacional"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-partido]'); await pg.click('[data-partido="ES_ASD"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-rol]'); await pg.click('[data-rol="base"]'); await pg.click('#c-sig'); await pg.waitForSelector('#c-ok'); await pg.click('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; });
  // Tres barómetros; el partido líder de uno nuevo falta en los dos más antiguos
  const quien = await pg.evaluate(() => { const E = ESP.E; E.esp.cortes.estado = 'activa'; E.esp.encs = []; for (let i = 0; i < 3; i++) { E.fecha.t += 4; ESP.Campana.encuesta(E, 'cis', null); } const l = E.esp.encs.filter(x => x.tipo === 'cis'); const k = Object.keys(l[0].votos).sort((a, b) => l[0].votos[b] - l[0].votos[a])[1]; delete l[1].votos[k]; delete l[2].votos[k]; E.ui.tabEl = 'campana'; E.ui.pantalla = 'elecciones'; ESP.App.refrescar(); return { k, n: l.length }; });
  await pg.waitForTimeout(400);
  ok(quien.n >= 3, 'hay barómetros con histórico (' + quien.n + ')');
  const nan = await pg.evaluate(() => [...document.querySelectorAll('#vista svg path')].some(p => /NaN/.test(p.getAttribute('d') || '')) || [...document.querySelectorAll('#vista svg circle')].some(c => /NaN/.test(c.getAttribute('cy') || '')));
  ok(!nan, 'el gráfico del barómetro no contiene NaN aunque falte un partido en encuestas antiguas (' + quien.k + ')');
  ok(await pg.evaluate(() => /bar[oó]metro/i.test(document.querySelector('#vista').innerText) && document.querySelectorAll('#vista svg.graf').length >= 1), 'se muestra el barómetro con su gráfico');
  // el gráfico genérico también se protege ante datos no numéricos
  const g = await pg.evaluate(() => /NaN/.test(ESP.Graf.linea([{ nombre: 'x', color: '#fff', datos: [[0, 1], [1, undefined], [2, 3], [3, NaN]] }], {})));
  ok(!g, 'Graf.linea descarta los puntos no numéricos');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
