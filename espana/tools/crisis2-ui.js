/* Prueba de la noche autonómica en directo (Playwright).
   Uso: node tools/crisis2-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8145, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8145/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  for (const amb of ['nac', 'aut', 'mun']) {
    await pg.evaluate(a => { ESP.UI.cerrarModales(); const E = ESP.E, J = E.jugador; E.eventos.pendientes = []; E.paises.ES.gob.pm = 'J'; const Cv = ESP.CrisisDirecto; Cv.asegurar(E).cd = {}; Cv.asegurar(E).act.length = 0; E.esp.pendienteCrisisV = null;
      if (a === 'aut') { J.cargo = 'presauto'; const c = J.region || 'MAD'; J.region = c; if (E.esp.ccaa[c].gob) E.esp.ccaa[c].gob.pres = 'J'; }
      if (a === 'mun') { const id = Object.keys(E.esp.muni.m)[0]; J.muni = id; E.esp.muni.m[id].pm = 'J'; }
      let cr = null; for (let i = 0; i < 120 && !(cr && cr.jug); i++) { Cv.asegurar(E).cd = {}; Cv.asegurar(E).act.length = 0; E.esp.pendienteCrisisV = null; cr = Cv.nueva(E, a); } if (!cr || !E.esp.pendienteCrisisV) throw new Error('sin crisis ' + a + ' ' + (cr && cr.jug)); ESP.App.revisarPendientes(); }, amb);
    await pg.waitForSelector('.modal-fondo [data-k]', { timeout: 8000 }); ok(true, 'se abre la crisis en directo (' + amb + ')');
    if (amb === 'nac') await pg.screenshot({ path: `/tmp/${movil ? 'm' : 'd'}-crisis-directo.png` });
    for (let i = 0; i < 5; i++) { const b = await pg.$('.modal-fondo [data-k]'); if (!b) break; await clic('.modal-fondo [data-k]'); await pg.waitForTimeout(150); }
    await pg.waitForSelector('#cv-ok', { timeout: 5000 }); ok(true, 'la crisis termina con valoración (' + amb + ')'); await clic('#cv-ok'); await pg.waitForTimeout(200);
  }
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.App.ir('crisis'); }); await pg.waitForTimeout(500); const tx = await pg.evaluate(() => document.body.innerText); ok(/Crisis en directo/i.test(tx), 'la pestaña de Crisis lista las crisis en directo ' + (/Crisis nacionales/.test(tx) ? '' : '(pantalla no cambió)'));
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
