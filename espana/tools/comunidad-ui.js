/* Prueba de interfaz de la investidura (Playwright): calendario, proponer candidato como presidente del Parlamento y negociar el bloque como candidato.
   Uso: node tools/comunidad-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
const movil = process.argv[2] === 'movil';
(async () => {
  await new Promise(r => srv.listen(8132, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  await pg.goto('http://localhost:8132/index.html');
  await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]');
  await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  await cerrar();
  await pg.evaluate(() => { const E = ESP.E, g = E.paises.ES.gob; E.parl.auto = true;
    ['salario_minimo', 'control_alquileres', 'sanidad_publica'].forEach(id => { const tpl = ESP.Congreso.plantilla(id); ESP.Impacto.promulgar(E, { tpl: id, t: tpl.t, autor: { tipo: 'jugador', pid: g.partido }, dis: ESP.Impacto.norm(tpl, {}), region: null }); }); });
  await pg.evaluate(() => { ESP.E.jugador.prestigio = 90; ESP.App.ir('agenda'); }); await pg.waitForTimeout(300);
  await pg.evaluate(() => ESP.Pantallas.agenda.abrir('cambiar_comunidad')); await pg.waitForSelector('.modal-fondo [data-accion="cambiar_comunidad"]');
  const n = await pg.evaluate(() => document.querySelectorAll('.modal-fondo [data-accion="cambiar_comunidad"]').length);
  ok(n >= 3, 'el modal lista comunidades (' + n + ')');
  await pg.screenshot({ path: `/tmp/${movil ? 'cm' : 'cd'}-com.png` });
  const r = await pg.evaluate(() => { const E = ESP.E, J = E.jugador; J.rol = 'lider'; E.paises.ES.gob.pm = 'X'; E.paises.ES.gob.ministros = {}; J.cargo = 'diputado'; const o = ESP.Personaje.opcionesComunidad(E)[0]; let res; for (let i = 0; i < 40; i++) { J.regT = null; J.agenda.puntos = 10; res = ESP.Acciones.ejecutar('cambiar_comunidad', { c: o.c }); if (J.region === o.c) break; } return { c: o.c, region: J.region, circ: J.circ, nueva: J.circNueva, electo: J.electo, nivel: J.nivel, cargo: J.cargo, msg: res.msg }; });
  ok(r.region === r.c, 'el traslado se registra: ' + JSON.stringify(r));
  ok(!r.electo || r.nueva, 'si es diputado/a conserva el escaño y se prepara la nueva lista');
  await pg.evaluate(() => ESP.App.refrescar()); await pg.waitForTimeout(200);
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
