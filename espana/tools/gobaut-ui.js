/* Prueba de interfaz de los gobiernos autonómicos más vivos (Elecciones → Investidura: en funciones, negociación, voto del grupo, cordón sanitario y repetición). Uso: node tools/gobaut-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil';
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(movil ? 8314 : 8313, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const url = 'http://localhost:' + (movil ? 8314 : 8313) + '/index.html';
  await pg.goto(url); await pg.waitForSelector('#i-nueva'); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await pg.click('[data-nivel="nacional"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-partido]'); await pg.click('[data-partido="ES_ASD"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-rol]'); await pg.click('[data-rol="lider"]'); await pg.click('#c-sig'); await pg.waitForSelector('#c-ok'); await pg.click('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; });
  // El jugador encabeza la lista de su partido en el Parlamento de Madrid, con una investidura abierta
  await pg.evaluate(() => {
    const E = ESP.E, J = E.jugador, T = ESP.Territorio, rc = E.esp.ccaa.MAD; ESP.UI.cerrarModales(); E.ui.sinGuia = true; E.eventos.pendientes.length = 0; E.parl.auto = true; E.esp.cortes.estado = 'activa'; J.agenda.puntos = 99; J.agenda.max = 99;
    J.cargo = 'dipauto'; J.nivel = 'autonomico'; J.region = 'MAD'; J.escReg = true; E.paises.ES.gob.pm = 'otro'; if (!(rc.parl.escanos[J.partido] > 0)) rc.parl.escanos[J.partido] = 20; rc.cab[J.partido] = 'J'; E.ui.regInv = 'MAD'; T.abrirInvestidura(E, 'MAD');
  });
  const abrir = (pant, tab) => pg.evaluate(([p, t]) => { ESP.UI.cerrarModales(); ESP.App.ir(p, t ? { tab: t } : undefined); const v = document.querySelector('#vista'); return { txt: v.innerText, tabs: [...v.querySelectorAll('.tabs [data-tab]')].map(x => x.dataset.tab), h: v.scrollWidth, w: document.documentElement.clientWidth }; }, [pant, tab]);
  const clic = async sel => { await pg.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await pg.click(sel); await pg.waitForTimeout(150); };
  const pts = () => pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 99; });

  // 1. Pestaña Investidura (ámbito autonómico): ya está disponible y muestra los tres bloques
  let v = await abrir('elecciones', 'investidura'); ok(v.tabs.includes('investidura'), 'Diputado/a autonómico/a: Elecciones ofrece «Investidura» (' + v.tabs.join(',') + ')');
  ok(/Gobiernos en funciones y bloqueos/i.test(v.txt) && /En funciones/.test(v.txt), 'el panel lista la comunidad con el Gobierno en funciones'); ok(/Negociar mi investidura/i.test(v.txt), 'aparece la negociación de tu investidura'); ok(/Cordón sanitario/i.test(v.txt), 'aparece el cordón sanitario');
  ok(v.h <= v.w + 2, 'el panel no desborda horizontalmente (' + v.h + ' ≤ ' + v.w + ')');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/gobaut-panel.png' });
  // 2. Cabildeo y contrapartida desde el panel
  await clic('#vista [data-accion="cabildear_investidura"]:not(.desact)'); let n = await pg.evaluate(() => { const x = ESP.GobAut.neg(ESP.E, 'MAD'); return x ? { cabT: Object.keys(x.cabT).length, con: Object.keys(x.con).length } : null; }); ok(n && n.cabT >= 1, 'el 🤝 abre una ronda de cabildeo con un grupo (' + (n && n.cabT) + ')');
  await pts(); await abrir('elecciones', 'investidura'); await clic(`#vista [data-accion="contrapartida_investidura"][data-args*='"tipo":"programa"']:not(.desact)`); n = await pg.evaluate(() => { const x = ESP.GobAut.neg(ESP.E, 'MAD'); return { cabT: Object.keys(x.cabT).length, con: Object.keys(x.con).length }; }); ok(n.con >= 1, 'la contrapartida de programa queda pactada con un grupo (' + n.con + ')');
  // 3. Cordón sanitario: romper y restablecer
  await pts(); v = await abrir('elecciones', 'investidura'); ok(!!(await pg.$('#vista [data-accion="romper_cordon"]')), 'el cordón ofrece «Pactar con ellos» con un partido vetado');
  await pg.evaluate(() => { window.__c0 = ESP.U.chance; ESP.U.chance = () => true; }); await clic('#vista [data-accion="romper_cordon"]'); await pg.evaluate(() => { ESP.U.chance = window.__c0; });
  const rot = await pg.evaluate(() => ESP.GobAut.rotos(ESP.E).length); ok(rot >= 1, 'el veto se rompe (' + rot + ' rupturas)');
  await pts(); v = await abrir('elecciones', 'investidura'); ok(/Veto roto contigo/i.test(v.txt) && !!(await pg.$('#vista [data-accion="restaurar_cordon"]')), 'la tabla muestra el veto roto y permite restablecerlo');
  await clic('#vista [data-accion="restaurar_cordon"]'); ok(await pg.evaluate(() => ESP.GobAut.rotos(ESP.E).length === 0), 'restablecer el cordón lo vuelve a cerrar');
  // 4. Territorio: etiqueta «en funciones»
  v = await abrir('territorio', 'ccaa'); ok(/en funciones/i.test(v.txt), 'Territorio → Comunidades marca el Gobierno en funciones');
  // 5. Modal de candidato: negociar sin cerrarlo
  await pg.evaluate(() => { const E = ESP.E, rc = E.esp.ccaa.MAD, v = rc.inv, J = E.jugador; v.cand = J.partido; v.estado = 'candidatoJ'; v.voluntario = true; E.esp.pendienteInvAut = { c: 'MAD', tipo: 'candidato' }; E.jugador.agenda.puntos = 99; ESP.Pantallas.invest.candidatoAut('MAD'); });
  await pg.waitForSelector('#ci-neg', { timeout: 5000 }); ok(true, 'el modal de investidura incluye la negociación');
  const antes = await pg.evaluate(() => Object.keys(ESP.GobAut.neg(ESP.E, 'MAD').cabT).length);
  await pg.evaluate(() => { const s = document.querySelector('#ci-neg-p'); const E = ESP.E, o = [...s.options].find(x => !(x.value in ESP.GobAut.neg(E, 'MAD').cabT) && !ESP.GobAut.hayVeto(E, E.jugador.partido, x.value, 'MAD')) || s.options[1]; s.value = o.value; });
  await pg.click('[data-neg="cab"]'); await pg.waitForTimeout(200);
  ok(!!(await pg.$('#ci-ok')) && await pg.evaluate(a => Object.keys(ESP.GobAut.neg(ESP.E, 'MAD').cabT).length > a, antes), 'cabildear desde el modal no lo cierra y deja huella');
  await pg.evaluate(() => { const s = document.querySelector('#ci-neg-p'); const E = ESP.E, o = [...s.options].find(x => !ESP.GobAut.neg(E, 'MAD').con[x.value] && !ESP.GobAut.hayVeto(E, E.jugador.partido, x.value, 'MAD')) || s.options[0]; s.value = o.value; });
  await pg.click('[data-neg="cargos"]'); await pg.waitForTimeout(200); ok(!!(await pg.$('#ci-ok')) && await pg.evaluate(() => Object.keys(ESP.GobAut.neg(ESP.E, 'MAD').con).length >= 1), 'la contrapartida desde el modal se anota');
  ok(await pg.evaluate(() => /\+\d+/.test(document.querySelector('#ci-negs').textContent)), 'el modal resume lo negociado con cada grupo');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/gobaut-modal.png' });
  await pg.click('#ci-ok'); await pg.waitForTimeout(200); ok(await pg.evaluate(() => ESP.E.esp.ccaa.MAD.inv.estado === 'debate'), 'someterse a la votación sigue funcionando');
  // 6. Voto del grupo ante la investidura de otro candidato
  await pg.evaluate(() => { const E = ESP.E, T = ESP.Territorio, rc = E.esp.ccaa.MAD, v = rc.inv; ESP.UI.cerrarModales(); v.voluntario = false; v.estado = 'debate'; v.cand = 'ES_PPI'; if (!(rc.parl.escanos.ES_PPI > 0)) rc.parl.escanos.ES_PPI = 30; v.bloq = T.bloque(E, 'MAD', 'ES_PPI'); E.esp.pendienteInvAut = null; E.jugador.agenda.puntos = 99; });
  v = await abrir('elecciones', 'investidura'); ok(/Tu grupo ante la investidura/i.test(v.txt), 'cuando el candidato es otro aparece «Tu grupo ante la investidura»');
  await clic(`#vista [data-accion="voto_investidura_aut"][data-args*='"voto":"no"']`); ok(await pg.evaluate(() => ESP.E.esp.ccaa.MAD.inv.votoJ === 'no'), 'el botón Bloquear fija el voto de tu grupo');
  v = await abrir('elecciones', 'investidura'); ok(/Bloqueas/.test(v.txt), 'la tarjeta refleja que bloqueas');
  // 7. Repetición de elecciones y culpas
  await pg.evaluate(() => { const E = ESP.E, T = ESP.Territorio, rc = E.esp.ccaa.MAD, v = rc.inv; v.fallidos = ['ES_PPI']; v.t1 = E.fecha.t - 12; v.cand = null; v.bloq = null; v.estado = 'consultas'; v.tNom = E.fecha.t; T.invNominar(E, 'MAD'); E.eventos.pendientes.length = 0; ESP.UI.cerrarModales(); E.jugador.agenda.puntos = 99; });
  v = await abrir('elecciones', 'investidura'); ok(/Elecciones repetidas/i.test(v.txt) && /repetición/i.test(v.txt), 'la comunidad aparece con elecciones repetidas');
  ok(v.h <= v.w + 2, 'el panel de repetición no desborda (' + v.h + ' ≤ ' + v.w + ')');
  ok(!!(await pg.$('#vista [data-accion="culpar_bloqueo"]')), 'tu partido puede culpar a otro del bloqueo');
  await pg.evaluate(() => { window.__c0 = ESP.U.chance; ESP.U.chance = () => true; }); const c0 = await pg.evaluate(() => JSON.stringify(ESP.E.esp.gau.rep.MAD.culpa)); await clic('#vista [data-accion="culpar_bloqueo"]'); await pg.evaluate(() => { ESP.U.chance = window.__c0; });
  ok(await pg.evaluate(c => JSON.stringify(ESP.E.esp.gau.rep.MAD.culpa) !== c, c0), 'culpar cambia el reparto de culpas');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/gobaut-repeticion.png' });
  // 8. La agenda ofrece las acciones al ámbito autonómico y no al nacional
  const ag = await pg.evaluate(() => { ESP.App.ir('agenda'); return [...document.querySelectorAll('#vista [data-accion], #vista [data-modal]')].map(x => x.dataset.accion || x.dataset.modal); }); ok(ag.includes('romper_cordon') || ag.includes('culpar_bloqueo') || ag.includes('voto_investidura_aut'), 'la agenda del ámbito autonómico incluye acciones de este sistema');
  await pg.evaluate(() => { const E = ESP.E, J = E.jugador; J.cargo = 'diputado'; J.nivel = 'nacional'; }); const ag2 = await pg.evaluate(() => { ESP.App.ir('agenda'); return [...document.querySelectorAll('#vista [data-accion], #vista [data-modal]')].map(x => x.dataset.accion || x.dataset.modal); });
  ok(!ag2.includes('culpar_bloqueo') && !ag2.includes('cabildear_investidura') && !ag2.includes('voto_investidura_aut'), 'un/a diputado/a nacional no ve las acciones autonómicas de este sistema');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
