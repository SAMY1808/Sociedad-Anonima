/* Prueba de interfaz de la reforma constitucional territorial (pestaña «Constitución» de Territorio). Uso: node tools/constit-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil';
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(movil ? 8312 : 8311, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const url = 'http://localhost:' + (movil ? 8312 : 8311) + '/index.html';
  await pg.goto(url); await pg.waitForSelector('#i-nueva'); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await pg.click('[data-nivel="nacional"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-partido]'); await pg.click('[data-partido="ES_ASD"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-rol]'); await pg.click('[data-rol="lider"]'); await pg.click('#c-sig'); await pg.waitForSelector('#c-ok'); await pg.click('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; });
  const como = (cargo, region) => pg.evaluate(([c, reg]) => {
    const E = ESP.E, J = E.jugador, G = E.paises.ES.gob; ESP.UI.cerrarModales(); E.ui.sinGuia = true; E.eventos.pendientes.length = 0; E.parl.auto = true;
    E.esp.cortes.estado = 'activa'; J.agenda.puntos = 99; J.agenda.max = 99;
    for (const k of Object.keys(E.esp.ccaa)) if (E.esp.ccaa[k].gob && E.esp.ccaa[k].gob.pres === 'J') E.esp.ccaa[k].gob.pres = 'pan';
    if (c === 'pm') { G.pm = 'J'; J.cargo = 'pm'; J.nivel = 'nacional'; } else if (c === 'dip') { J.cargo = 'diputado'; J.nivel = 'nacional'; G.pm = 'pan'; } else { G.pm = 'pan'; J.cargo = 'presauto'; J.nivel = 'autonomico'; J.region = reg; E.esp.ccaa[reg].gob.pres = 'J'; }
    return true;
  }, [cargo, region]);
  const abrir = tab => pg.evaluate(t => { ESP.App.ir('territorio', { tab: t }); const v = document.querySelector('#vista'); return { txt: v.innerText, tabs: [...v.querySelectorAll('.tabs [data-tab]')].map(x => x.dataset.tab), h: v.scrollWidth, w: document.documentElement.clientWidth }; }, tab);
  const clic = async sel => { await pg.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await pg.click(sel); await pg.waitForTimeout(150); };
  const ref = () => pg.evaluate(() => { const r = ESP.E.esp.cn && ESP.E.esp.cn.ref; return r ? { fase: r.fase, items: r.items.slice(), cab: Object.keys(r.cab).length, cabT: Object.keys(r.cabT).length, contra: Object.keys(r.contra).length, pacto: r.pacto, propId: r.propId, si: r.camp.si } : null; });

  // 1. Presidente del Gobierno: abre la reforma con un modelo
  await como('pm');
  let v = await abrir('constitucion'); ok(v.tabs.includes('constitucion'), 'Presidente/a: Territorio ofrece «Constitución» (' + v.tabs.join(',') + ')');
  ok(/Reforma constitucional territorial/i.test(v.txt) && /Federal/i.test(v.txt) && /Recentralizador/i.test(v.txt), 'sin reforma, la pestaña explica el proceso y ofrece los tres modelos');
  ok(v.h <= v.w + 2, 'la pestaña no desborda horizontalmente (' + v.h + ' ≤ ' + v.w + ')');
  const botones = await pg.$$('#vista [data-accion="abrir_reforma_constitucional"]'); ok(botones.length === 3, 'un botón «Abrir con este modelo» por modelo (' + botones.length + ')');
  await pg.evaluate(() => { document.querySelectorAll('#vista [data-accion="abrir_reforma_constitucional"]')[1].scrollIntoView({ block: 'center' }); }); await (await pg.$$('#vista [data-accion="abrir_reforma_constitucional"]'))[1].click(); await pg.waitForTimeout(250);
  let r = await ref(); ok(r && r.fase === 'borrador' && r.items.length >= 3, 'el botón abre el borrador con el modelo autonómico reforzado (' + (r && r.items.join(',')) + ')');
  v = await abrir('constitucion'); ok(/Borrador/i.test(v.txt) && /Apoyo en el Congreso/i.test(v.txt) && /Referéndum de ratificación/i.test(v.txt), 'el borrador muestra artículos, apoyo en el Congreso y referéndum'); ok(v.h <= v.w + 2, 'el borrador no desborda (' + v.h + ' ≤ ' + v.w + ')');
  // Artículos: incluir y quitar
  const antes = r.items.length; await clic(`#vista [data-accion="articulo_constitucional"][data-args*='"id":"lenguas"']`);
  r = await ref(); ok(r.items.length === antes + 1, 'incluir un artículo lo añade al texto (' + antes + ' → ' + r.items.length + ')');
  await pg.evaluate(() => { ESP.App.ir('territorio', { tab: 'constitucion' }); }); await clic(`#vista [data-accion="articulo_constitucional"][data-args*='"id":"lenguas"']`); r = await ref(); ok(r.items.length === antes, 'volver a pulsar lo quita (' + r.items.length + ')');
  // Cabildeo y contrapartida
  await pg.evaluate(() => { ESP.App.ir('territorio', { tab: 'constitucion' }); }); await clic('#vista [data-accion="cabildear_constit"]'); r = await ref(); ok(r.cabT >= 1, 'el 🤝 abre una ronda de cabildeo con un grupo de la oposición (' + r.cabT + ')');
  await pg.evaluate(() => { ESP.E.jugador.agenda.puntos = 99; ESP.App.ir('territorio', { tab: 'constitucion' }); }); await clic('#vista [data-accion="contrapartida_constit"]'); r = await ref(); ok(r.contra >= 1, 'el 🎁 ofrece una contrapartida a un grupo (' + r.contra + ')');
  // Pacto con la mayor oposición y remisión
  await pg.evaluate(() => { const E = ESP.E; E.jugador.agenda.puntos = 99; const ref = E.esp.cn.ref, P = E.paises.ES; const k = P.partidos.filter(x => x !== E.jugador.partido && P.escanos[x] > 100)[0]; if (k) { ref.cab[k] = 0.9; ref.pacto = k; } for (const x of P.partidos) if (x !== E.jugador.partido && P.escanos[x] > 25) ref.cab[x] = Math.max(ref.cab[x] || 0, 0.9); });
  v = await abrir('constitucion'); await clic('#vista [data-accion="remitir_reforma_constitucional"]'); await pg.waitForTimeout(250);
  r = await ref(); ok(r && r.fase === 'cortes' && r.propId, 'remitir lleva el texto a las Cortes (fase ' + (r && r.fase) + ')');
  v = await abrir('constitucion'); ok(/Congreso y Senado/i.test(v.txt) && !(await pg.$('#vista [data-accion="remitir_reforma_constitucional"]')), 'en las Cortes ya no se ofrece remitir');
  ok(await pg.$('#vista [data-accion="retirar_articulo_constit"]'), 'se puede retirar un artículo como cesión'); ok(await pg.$('#vista [data-accion="retirar_reforma_constitucional"]'), 'se puede retirar la reforma');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/constit-cortes.png' });
  // 2. Referéndum
  await pg.evaluate(() => { const E = ESP.E, ref = E.esp.cn.ref, p = E.proyectos[ref.propId]; ESP.Constit.alAprobarCortes(E, p); E.jugador.agenda.puntos = 99; });
  v = await abrir('constitucion'); ok(/Votación el/i.test(v.txt) && await pg.$('#vista [data-accion="campana_constit"]'), 'tras las Cortes se convoca el referéndum con los botones de campaña');
  await clic('#vista [data-accion="campana_constit"]'); r = await ref(); ok(r && r.si > 0, 'la campaña por el sí suma apoyo (' + (r && r.si) + ')');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/constit-referendum.png' });
  await pg.evaluate(() => { const E = ESP.E; E.esp.cn.ref.camp.si = 10; E.fecha.t = E.esp.cn.ref.tVoto; ESP.Constit.turno(E); });
  v = await abrir('constitucion'); const hist = await pg.evaluate(() => ESP.E.esp.cn.hist[0]); ok(hist && /ratificada|rechazada en referéndum/.test(hist.res), 'el referéndum se resuelve y queda en el historial (' + (hist && hist.res) + ')');
  ok(/ratificada|rechazada en referéndum/.test(v.txt), 'la pestaña muestra el historial de la votación'); ok(v.h <= v.w + 2, 'el historial no desborda (' + v.h + ' ≤ ' + v.w + ')');
  const vig = await pg.evaluate(() => Object.keys(ESP.E.esp.cn.efectos)); if (vig.length) { ok(/Reformas en vigor/i.test(v.txt), 'si se ratifica, aparecen las reformas en vigor (' + vig.join(',') + ')'); }

  // 3. Diputado: lee, pero no actúa
  await como('dip'); v = await abrir('constitucion'); ok(v.tabs.includes('constitucion') && !(await pg.$('#vista [data-accion="abrir_reforma_constitucional"]')), 'Diputado/a: la pestaña se lee, pero no tiene botones para abrir la reforma');
  ok(/Sólo el presidente/i.test(v.txt) || /Reforma constitucional/i.test(v.txt), 'se explica quién puede abrirla');
  const ag = await pg.evaluate(() => { ESP.App.ir('agenda'); return [...document.querySelectorAll('#vista [data-accion]')].map(x => x.dataset.accion); }); ok(!ag.some(a => /constit/.test(a)), 'Diputado/a: la agenda no ofrece acciones de reforma constitucional');

  // 4. Presidente/a autonómico/a: ve la pestaña, sin botones de gobierno
  await como('presauto', 'MAD'); v = await abrir('constitucion'); ok(v.tabs.includes('constitucion') && !(await pg.$('#vista [data-accion="abrir_reforma_constitucional"]')), 'Presidente/a autonómico/a: ve «Constitución» pero no la puede abrir');
  ok(v.h <= v.w + 2, 'la vista autonómica no desborda (' + v.h + ' ≤ ' + v.w + ')');
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
