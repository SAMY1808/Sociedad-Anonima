/* Prueba de interfaz de la investidura (Playwright): calendario, proponer candidato como presidente del Parlamento y negociar el bloque como candidato.
   Uso: node tools/presupuesto-ui.js [movil] */
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
  await pg.evaluate(() => ESP.Ajustes.fijar(ESP.E, 'foco', 'todo')); // esta prueba recorre varios niveles a la vez: enfoque Panorámico
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  await cerrar();
  await pg.evaluate(() => { const E = ESP.E, g = E.paises.ES.gob; E.parl.auto = true;
    ['salario_minimo', 'control_alquileres', 'sanidad_publica'].forEach(id => { const tpl = ESP.Congreso.plantilla(id); ESP.Impacto.promulgar(E, { tpl: id, t: tpl.t, autor: { tipo: 'jugador', pid: g.partido }, dis: ESP.Impacto.norm(tpl, {}), region: null }); }); });
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 20; ESP.App.ir('consejo', { tab: 'presupuestos' }); }); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => /Gasto por políticas/i.test(document.querySelector('#vista').innerText) && /Presupuestos Generales del Estado/i.test(document.querySelector('#vista').innerText)), 'el panel de Presupuestos Generales se muestra');
  await pg.screenshot({ path: `/tmp/${movil ? 'pm' : 'pd'}-nacional.png`, fullPage: true });
  await clic('#pp-diseno'); await pg.waitForSelector('#pd-kpi [class*=kpi], #pd-kpi div');
  const d0 = await pg.evaluate(() => document.querySelector('#pd-aviso').innerText);
  await pg.evaluate(() => { const i = document.querySelector('[data-g="sal"]'); i.value = 30; i.dispatchEvent(new Event('input', { bubbles: true })); const j = document.querySelector('[data-i="irpf"]'); j.value = 12; j.dispatchEvent(new Event('input', { bubbles: true })); });
  await pg.waitForTimeout(150);
  ok(await pg.evaluate(() => /Proyección en el Congreso/.test(document.querySelector('#pd-voto').innerText)), 'el diseñador proyecta la votación en el Congreso');
  await pg.screenshot({ path: `/tmp/${movil ? 'pm' : 'pd'}-diseno.png` });
  await clic('#pd-g'); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => ESP.E.esp.pge.borrador && ESP.E.esp.pge.borrador.lev.gas.sal === 30), 'el borrador conserva tus palancas');
  await clic('#pp-neg'); await pg.waitForTimeout(400); await pg.waitForSelector('[data-ng-ok]', { timeout: 3000 });
  await pg.screenshot({ path: `/tmp/${movil ? 'pm' : 'pd'}-negociar.png` });
  await clic('[data-ng-ok]'); await pg.waitForTimeout(500);
  ok(await pg.evaluate(() => Object.keys(ESP.E.esp.pge.pactos).length >= 1), 'se cierra un pacto con un grupo');
  await pg.evaluate(() => ESP.UI.cerrarModales());
  await pg.evaluate(() => ESP.App.ir('consejo', { tab: 'presupuestos' })); await pg.waitForTimeout(250);
  await clic('#pp-diseno'); await pg.waitForSelector('#pd-p'); await clic('#pd-p'); await pg.waitForTimeout(400);
  ok(await pg.evaluate(() => !!ESP.E.esp.pge.tramite), 'los Presupuestos se presentan en el Congreso');
  await pg.evaluate(() => ESP.UI.cerrarModales());
  await pg.evaluate(() => ESP.App.ir('consejo', { tab: 'presupuestos' })); await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => /Votación en el Congreso/i.test(document.querySelector('#vista').innerText)), 'el panel muestra la votación en el Congreso');
  // Autonómico
  await pg.evaluate(() => { const E = ESP.E; E.jugador.region = 'MAD'; E.ui.regPres = 'MAD'; ESP.App.ir('territorio', { tab: 'presupuesto' }); }); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => /Regla fiscal/i.test(document.querySelector('#vista').innerText) && /Impuestos propios/i.test(document.querySelector('#vista').innerText)), 'el presupuesto autonómico muestra regla fiscal e impuestos propios');
  await pg.screenshot({ path: `/tmp/${movil ? 'pm' : 'pd'}-regional.png`, fullPage: true });
  await pg.evaluate(() => { ESP.Pantallas.agenda.abrir('presupuesto_aut'); }); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => !!document.querySelector('input[data-fisc]')), 'el modal de presupuestos autonómicos incluye impuestos propios');
  await pg.evaluate(() => ESP.UI.cerrarModales());
  ok(await pg.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), 'sin desbordamiento horizontal');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
