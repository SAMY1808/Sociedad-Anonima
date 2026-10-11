/* Prueba de interfaz de las emergencias por comunidad (pantalla Crisis): escena, niveles, mando, peticiones, visitas, fondos y zona catastrófica. Uso: node tools/crisis3-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil', PORT = movil ? 8302 : 8301;
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const clic = async s => { const el = await pg.waitForSelector(s, { timeout: 8000 }); await el.scrollIntoViewIfNeeded(); return movil ? pg.tap(s) : pg.click(s); };
  await pg.goto(`http://localhost:${PORT}/index.html`); await clic('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await clic('[data-nivel="nacional"]'); await clic('#c-sig'); await pg.waitForSelector('[data-partido]'); await clic('[data-partido="ES_ASD"]'); await clic('#c-sig'); await pg.waitForSelector('[data-rol]'); await clic('[data-rol="lider"]'); await clic('#c-sig'); await pg.waitForSelector('#c-ok'); await clic('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  const poner = (cargo, region) => pg.evaluate(([c, reg]) => { const E = ESP.E, J = E.jugador, G = E.paises.ES.gob; ESP.UI.cerrarModales(); E.eventos.pendientes = []; E.ue.pendiente = []; E.ui.sinGuia = true; E.esp.cortes.estado = 'activa'; J.agenda.puntos = 60; J.agenda.max = 60; ESP.U.gauss = () => 0;
    for (const k of Object.keys(E.esp.ccaa)) if (E.esp.ccaa[k].gob && E.esp.ccaa[k].gob.pres === 'J') E.esp.ccaa[k].gob.pres = 'pan';
    if (c === 'pm') { G.pm = 'J'; J.cargo = 'pm'; J.nivel = 'nacional'; } else { G.pm = 'pan'; J.cargo = 'presauto'; J.nivel = 'autonomico'; J.region = reg; J.escReg = true; E.esp.ccaa[reg].gob.pres = 'J'; }
    const cs = ESP.Crisis.asegurar(E); cs.activas.length = 0; cs.hist.length = 0; ESP.Emerg.asegurar(E).zonas.length = 0; E.esp.dil = null; return true; }, [cargo, region]);
  const crea = (tipo, region, sev) => pg.evaluate(([t, reg, s]) => { const E = ESP.E, cs = ESP.Crisis.asegurar(E); cs.activas.length = 0; const cr = ESP.Crisis.nueva(E, { tipo: t, sev: s }); cr.regs = [reg]; cr.efic = { [reg]: 0.3 }; cr.dano = { [reg]: 0 }; cr.em = null; ESP.Emerg.alCrear(E, cr); ESP.UI.cerrarModales(); E.eventos.pendientes.length = 0; return cr.id; }, [tipo, region, sev]);
  const ver = () => pg.evaluate(() => { ESP.App.ir('crisis'); const v = document.getElementById('vista'); return { txt: v.innerText, w: v.scrollWidth, cw: document.documentElement.clientWidth, esc: !!v.querySelector('figure[data-escena] svg'), bnd: v.querySelectorAll('svg.bnd').length }; });

  // 1. Presidente del Gobierno
  await poner('pm'); let v = await ver(); ok(/Sin crisis activas/.test(v.txt) && /Riesgo de temporada/i.test(v.txt), 'sin crisis se muestra la tabla de riesgo de temporada');
  const id = await crea('incendios', 'GAL', 3); v = await ver(); ok(v.esc && /Incendios forestales/i.test(v.txt), 'la crisis lleva su escena ilustrada'); ok(/Nivel 1/.test(v.txt) && /Mando autonómico/i.test(v.txt) && v.bnd >= 1, 'se ven el nivel, el mando y la bandera de la comunidad'); ok(v.w <= v.cw + 2, 'no desborda horizontalmente (' + v.w + ' ≤ ' + v.cw + ')');
  await pg.evaluate(id => { const cr = ESP.Crisis.asegurar(ESP.E).activas.find(c => c.id === id); ESP.Emerg.peticion(ESP.E, cr, 'GAL', 'ume'); ESP.E.jugador.agenda.puntos = 60; }, id); v = await ver(); ok(/pide la UME/i.test(v.txt) && !!(await pg.$('#vista [data-accion="responder_peticion_crisis"]')), 'la petición de la comunidad aparece con sus botones');
  await clic('#vista [data-accion="responder_peticion_crisis"][data-args*="\\"ok\\":\\"1\\""]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.Emerg.activas(ESP.E)[0].em.pet[0].estado === 'concedida'), 'el botón concede la UME');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 60; }); v = await ver(); await clic('#vista [data-accion="visita_emergencia"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.Emerg.activas(ESP.E)[0].em.visitas === 1), 'visitar la zona desde la tarjeta');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 60; }); v = await ver(); await clic('#vista [data-accion="fondos_emergencia"][data-args*="\\"nivel\\":2"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.Emerg.activas(ESP.E)[0].em.fondos === 2), 'movilizar fondos de contingencia');
  await pg.evaluate(() => { const E = ESP.E; ESP.Emerg.activas(E)[0].dano.GAL = 99; ESP.E.jugador.agenda.puntos = 60; }); v = await ver(); ok(/Nivel 3/.test(v.txt), 'con mucho daño la comunidad pasa a nivel 3');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/crisis3-pm.png' });
  await clic('#vista [data-accion="gestionar_crisis"][data-args*="emergencia"]'); await pg.waitForTimeout(250); v = await ver(); ok(/Mando del Estado/i.test(v.txt), 'declarar la emergencia de interés nacional pasa el mando al Estado');
  // cierre → zona catastrófica
  await pg.evaluate(() => { const E = ESP.E, cr = ESP.Emerg.activas(E)[0]; cr.dano.GAL = cr.sev * cr.dur * 0.55 * 0.95; ESP.Crisis.cerrar(E, cr); E.jugador.agenda.puntos = 60; ESP.Emerg.asegurar(E).zonas[0].estado = 'por_pedir'; ESP.Emerg.zonaPedir(E, ESP.Emerg.asegurar(E).zonas[0].id); }); v = await ver();
  ok(/zona afectada gravemente/i.test(v.txt) && !!(await pg.$('#vista [data-accion="resolver_zona_catastrofica"]')), 'tras la catástrofe aparece la solicitud de zona catastrófica pendiente de ti');
  await clic('#vista [data-accion="resolver_zona_catastrofica"][data-args*="\\"ok\\":\\"1\\""]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ESP.Emerg.asegurar(ESP.E).zonas[0].estado === 'concedida'), 'conceder la declaración desde el botón');

  // 2. Presidente autonómico
  await poner('presauto', 'VAL'); const id2 = await crea('dana', 'VAL', 3); await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 60; }); v = await ver(); ok(/Plan autonómico|plan de emergencias autonómico/i.test(v.txt) && !!(await pg.$('#vista [data-accion="gestionar_crisis"][data-args*="pedir_ayuda"]')), 'el presidente de la comunidad ve sus decisiones');
  await clic('#vista [data-accion="gestionar_crisis"][data-args*="pedir_ayuda"]'); await pg.waitForTimeout(250); v = await ver(); ok(/pide la UME/i.test(v.txt), 'pedir ayuda crea la petición y se muestra');
  await pg.evaluate(() => { const E = ESP.E, cr = ESP.Emerg.activas(E)[0]; cr.dano.VAL = cr.sev * cr.dur * 0.55 * 0.95; ESP.Crisis.cerrar(E, cr); E.jugador.agenda.puntos = 60; }); v = await ver(); ok(!!(await pg.$('#vista [data-accion="pedir_zona_catastrofica"]')), 'tras la catástrofe puede pedir la zona afectada gravemente'); await clic('#vista [data-accion="pedir_zona_catastrofica"]'); await pg.waitForTimeout(250); ok(await pg.evaluate(() => ['concedida', 'denegada', 'pendiente'].includes(ESP.Emerg.asegurar(ESP.E).zonas[0].estado)), 'solicitar la declaración desde el botón');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
