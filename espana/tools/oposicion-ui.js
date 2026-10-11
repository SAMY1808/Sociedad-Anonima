/* Prueba de interfaz de la pantalla «Oposición y pactos» (gobierno en la sombra, contraprogramación y pactos de Estado). Uso: node tools/oposicion-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil';
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(movil ? 8316 : 8315, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const url = 'http://localhost:' + (movil ? 8316 : 8315) + '/index.html';
  await pg.goto(url); await pg.waitForSelector('#i-nueva'); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await pg.click('[data-nivel="nacional"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-partido]'); await pg.click('[data-partido="ES_ASD"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-rol]'); await pg.click('[data-rol="lider"]'); await pg.click('#c-sig'); await pg.waitForSelector('#c-ok'); await pg.click('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; });
  // El jugador lidera la oposición (ASD fuera del Gobierno)
  const comoOpo = () => pg.evaluate(() => {
    const E = ESP.E, J = E.jugador, g = E.paises.ES.gob; ESP.UI.cerrarModales(); E.ui.sinGuia = true; E.eventos.pendientes.length = 0; E.parl.auto = true; E.esp.cortes.estado = 'activa'; J.agenda.puntos = 99; J.agenda.max = 99;
    const otro = E.paises.ES.partidos.find(k => k !== J.partido); if (g.pm === 'J') g.pm = Object.values(g.ministros)[0] || 'otro'; g.coalicion = [otro]; g.partido = otro; J.cargo = 'diputado'; J.nivel = 'nacional'; J.rol = 'lider'; return true;
  });
  const abrir = (tab) => pg.evaluate(t => { ESP.UI.cerrarModales(); ESP.App.ir('oposicion', t ? { tab: t } : undefined); const v = document.querySelector('#vista'); return { txt: v.innerText, h: v.scrollWidth, w: document.documentElement.clientWidth }; }, tab);
  const clic = async sel => { await pg.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await pg.click(sel); await pg.waitForTimeout(150); };
  const pts = () => pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 99; });
  await comoOpo();

  // 1. Menú y pestaña «Gobierno en la sombra»
  ok(await pg.evaluate(() => { ESP.App.nav(); return !!document.querySelector('#nav [data-p="oposicion"]'); }) || movil, 'el menú ofrece «Oposición y pactos» a quien juega en el ámbito central');
  let v = await abrir('sombra'); ok(/Gobierno en la sombra/i.test(v.txt) && /Credibilidad/i.test(v.txt) && /Cartera/i.test(v.txt), 'la pestaña muestra credibilidad, cobertura y las carteras'); ok(v.h <= v.w + 2, 'no desborda horizontalmente (' + v.h + ' ≤ ' + v.w + ')');
  const min = await pg.evaluate(() => ESP.Oposicion.cargos(ESP.E)[0].id);
  await clic(`#vista [data-accion="nombrar_sombra"][data-args*='"min":"${min}"']`); ok(await pg.evaluate(m => !!ESP.Oposicion.som(ESP.E).gab[m], min), 'nombrar a un ministro/a en la sombra desde la tabla');
  v = await abrir('sombra'); ok(await pg.evaluate(m => !!document.querySelector(`#vista [data-accion="replica_sombra"][data-args*='"min":"${m}"']`), min), 'aparece el botón de réplica de esa cartera');
  await pts(); await clic(`#vista [data-accion="replica_sombra"][data-args*='"min":"${min}"']`); ok(await pg.evaluate(m => ESP.Oposicion.som(ESP.E).rep[m] != null, min), 'la réplica queda registrada (enfriamiento de tres semanas)');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/oposicion-sombra.png' });
  await pts(); v = await abrir('sombra'); await clic(`#vista [data-accion="cesar_sombra"][data-args*='"min":"${min}"']`); ok(await pg.evaluate(m => !ESP.Oposicion.som(ESP.E).gab[m], min), 'cesar a quien llevaba la cartera');

  // 2. Contraprogramación
  await pg.evaluate(() => { const E = ESP.E, g = E.paises.ES.gob; const p = ESP.Congreso.proponer(E, 'plan_vivienda', { tipo: 'gobierno', pid: g.partido }); p.pop = 55; window.__ley = p.id; });
  v = await abrir('contra'); ok(/Contraprogramación/i.test(v.txt) && /Plan|vivienda/i.test(v.txt), 'la pestaña lista las leyes del Gobierno en trámite'); ok(v.h <= v.w + 2, 'Contraprogramación no desborda (' + v.h + ' ≤ ' + v.w + ')');
  const pop0 = await pg.evaluate(() => ESP.E.proyectos[window.__ley].pop); await pts(); await clic(`#vista [data-accion="contraprogramar"][data-args*='"modo":"alternativa"']`); const pop1 = await pg.evaluate(() => ESP.E.proyectos[window.__ley].pop); ok(pop1 < pop0, 'presentar una alternativa resta apoyo popular a la ley (' + pop0 + ' → ' + pop1.toFixed(1) + ')');
  v = await abrir('contra'); ok(/contraprogramada 1×/.test(v.txt), 'la tarjeta refleja la ofensiva');

  // 3. Pactos de Estado
  v = await abrir('pactos'); ok(/Pactos de Estado/i.test(v.txt) && /Lideras la oposición/i.test(v.txt) && /Pacto educativo/i.test(v.txt), 'la pestaña muestra tu posición y los asuntos de Estado'); ok(v.h <= v.w + 2, 'Pactos no desborda (' + v.h + ' ≤ ' + v.w + ')');
  await pg.evaluate(() => { window.__c0 = ESP.U.chance; ESP.U.chance = () => true; ESP.Oposicion.pe(ESP.E).ult = -99; }); await pts(); await clic(`#vista [data-accion="proponer_pacto_estado"][data-args*='"tema":"educacion"']`);
  ok(await pg.evaluate(() => ESP.Oposicion.pe(ESP.E).act.length === 1), 'proponer un pacto abre la negociación');
  v = await abrir('pactos'); ok(/Negociaciones abiertas/i.test(v.txt) && /Línea dura/.test(v.txt), 'aparece la negociación con sus tres líneas');
  for (let i = 0; i < 3; i++) { await pts(); v = await abrir('pactos'); await clic(`#vista [data-accion="negociar_pacto_estado"][data-args*='"linea":"dura"']`); await pg.evaluate(() => { ESP.E.fecha.t += 1; ESP.E.jugador.agenda.puntos = 99; }); } await pg.evaluate(() => { ESP.U.chance = window.__c0; });
  const firmado = await pg.evaluate(() => ({ f: ESP.Oposicion.pe(ESP.E).firmados.length, ley: ESP.Impacto.vigentes(ESP.E).has('ley_educativa') })); ok(firmado.f === 1 && firmado.ley, 'tres rondas duras bien resueltas firman el pacto y entra en vigor la ley');
  v = await abrir('pactos'); ok(/Pactos firmados/i.test(v.txt) && /Ley vigente/i.test(v.txt), 'la pantalla muestra el pacto firmado y el asunto con ley vigente');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/oposicion-pactos.png' });
  // Ofertas recibidas
  await pg.evaluate(() => { const E = ESP.E, pe = ESP.Oposicion.pe(E); pe.ofertas.push({ id: 'oX', tema: 'sanidad', socio: ESP.Oposicion.socio(E), t0: E.fecha.t }); E.jugador.agenda.puntos = 99; });
  v = await abrir('pactos'); ok(/Ofertas recibidas/i.test(v.txt), 'las ofertas del otro lado se listan'); await clic(`#vista [data-accion="responder_pacto_estado"][data-args*='"ok":"1"']`); ok(await pg.evaluate(() => ESP.Oposicion.pe(ESP.E).act.some(a => a.tema === 'sanidad')), 'aceptar la oferta abre la negociación');

  // 4. Agenda
  const ag = await pg.evaluate(() => { ESP.App.ir('agenda'); return [...document.querySelectorAll('#vista [data-accion], #vista [data-modal]')].map(x => x.dataset.accion || x.dataset.modal); });
  ok(ag.includes('nombrar_sombra') && ag.includes('contraprogramar') && ag.includes('proponer_pacto_estado'), 'la agenda ofrece las acciones de la oposición');
  // 5. Presidente del Gobierno: sólo pactos
  await pg.evaluate(() => { const E = ESP.E, J = E.jugador, g = E.paises.ES.gob; g.pm = 'J'; g.partido = J.partido; g.coalicion = [J.partido]; J.cargo = 'pm'; E.jugador.agenda.puntos = 99; });
  v = await abrir('sombra'); ok(/Sólo desde la oposición/i.test(v.txt) && !(await pg.$('#vista [data-accion="nombrar_sombra"]')), 'Presidente/a: el gobierno en la sombra no está disponible');
  v = await abrir('pactos'); ok(/Presides el Gobierno/i.test(v.txt), 'Presidente/a: sigue pudiendo pactar con la oposición');
  // 6. Ámbito autonómico: no ve la pantalla
  await pg.evaluate(() => { const E = ESP.E, J = E.jugador; J.cargo = 'dipauto'; J.nivel = 'autonomico'; J.region = 'MAD'; E.paises.ES.gob.pm = 'otro'; ESP.App.nav(); });
  ok(await pg.evaluate(() => !document.querySelector('#nav [data-p="oposicion"]')), 'un/a diputado/a autonómico/a no ve la pantalla en el menú');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
