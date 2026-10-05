/* Prueba de interfaz de la investidura (Playwright): calendario, proponer candidato como presidente del Parlamento y negociar el bloque como candidato.
   Uso: node tools/provincia-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8131, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8131/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  await cerrar();
  await pg.evaluate(() => { const E = ESP.E, g = E.paises.ES.gob; E.parl.auto = true;
    ['salario_minimo', 'control_alquileres', 'sanidad_publica'].forEach(id => { const tpl = ESP.Congreso.plantilla(id); ESP.Impacto.promulgar(E, { tpl: id, t: tpl.t, autor: { tipo: 'jugador', pid: g.partido }, dis: ESP.Impacto.norm(tpl, {}), region: null }); }); });
  await pg.evaluate(() => ESP.App.ir('agenda')); await pg.waitForTimeout(300);
  await clic('[data-modal="cambiar_provincia"]'); await pg.waitForSelector('.modal-fondo [data-accion="cambiar_provincia"]');
  const n = await pg.evaluate(() => document.querySelectorAll('.modal-fondo [data-accion="cambiar_provincia"]').length);
  ok(n >= 3, 'el modal lista provincias (' + n + ')');
  await pg.screenshot({ path: `/tmp/${movil ? 'pm' : 'pd'}-prov.png` });
  const r = await pg.evaluate(() => { const E = ESP.E, J = E.jugador; J.prestigio = 90; J.rol = 'lider'; const o = ESP.Personaje.opcionesProvincia(E).find(x => !x.actual); let res; for (let i = 0; i < 20; i++) { J.circT = null; res = ESP.Acciones.ejecutar('cambiar_provincia', { prov: o.prov }); E.jugador.agenda.puntos = 10; if (J.circ === o.prov || J.circNueva === o.prov) break; } return { prov: o.prov, circ: J.circ, nueva: J.circNueva, msg: res.msg, electo: J.electo }; });
  ok(r.circ === r.prov || r.nueva === r.prov, 'el cambio se registra: ' + JSON.stringify(r));
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
