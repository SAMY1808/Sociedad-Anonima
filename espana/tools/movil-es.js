/* Capturas en formato móvil (390×844): node tools/movil-es.js [nivel] [partido] [rol] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
const [nivel = 'nacional', partido = 'ES_ASD', rol = 'lider', pref = 'm'] = process.argv.slice(2);
(async () => {
  await new Promise(r => srv.listen(8124, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage();
  const errores = []; pg.on('pageerror', e => errores.push(e.message));
  const ancho0 = async (n) => { const r = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth })); if (r.sw > r.iw + 1 || r.iw > 391) console.log('DESBORDA en', n, JSON.stringify(r)); };
  await pg.goto('http://localhost:8124/index.html');
  await pg.screenshot({ path: `/tmp/${pref}-00-inicio.png` });
  await pg.tap('#i-nueva');
  await pg.waitForSelector('[data-nivel]'); await pg.screenshot({ path: `/tmp/${pref}-01-crea1.png` });
  await ancho0('crea1');
  await pg.tap(`[data-nivel="${nivel}"]`); await pg.tap('#c-sig');
  await pg.waitForSelector('[data-partido]'); await pg.screenshot({ path: `/tmp/${pref}-02-crea2.png` });
  await ancho0('crea2');
  await pg.tap(`[data-partido="${partido}"]`); await pg.tap('#c-sig');
  await pg.waitForSelector('[data-rol]'); await pg.screenshot({ path: `/tmp/${pref}-03-crea3.png` });
  await ancho0('crea3');
  await pg.tap(`[data-rol="${rol}"]`); await pg.tap('#c-sig');
  await pg.waitForSelector('#c-ok'); await pg.tap('#c-ok');
  await pg.waitForSelector('#vista', { timeout: 60000 });
  const cerrar = async () => { for (let i = 0; i < 6; i++) { if (!(await pg.$('.modal-fondo'))) break; await pg.evaluate(() => ESP.UI.cerrarModales()); } };
  const ir = async (p, params, nom) => { await cerrar(); await pg.evaluate(([p, params]) => ESP.App.ir(p, params), [p, params || null]); await pg.waitForTimeout(250); await pg.screenshot({ path: `/tmp/${pref}-${nom}.png` }); };
  await cerrar();
  await ir('dashboard', null, '10-dash');
  await ir('agenda', null, '11-agenda');
  await ir('cortes', null, '12-cortes');
  await ir('consejo', null, '13-consejo');
  await ir('gabinete', null, '14-gabinete');
  await ir('territorio', { tab: 'competencias' }, '15-comp');
  await ir('territorio', { tab: 'mapa' }, '16-mapa');
  await ir('elecciones', null, '17-elec');
  await ir('leyes', null, '18-leyes');
  await pg.evaluate(() => ESP.Pantallas.territorio.verCcaa('CAT')); await pg.waitForTimeout(200); await pg.screenshot({ path: `/tmp/${pref}-19-ficha.png` });
  await cerrar();
  await pg.evaluate(() => { ESP.E.esp.pendienteGabinete = { key: 'central', formacion: true }; ESP.App.revisarPendientes(); }); await pg.waitForTimeout(200); await pg.screenshot({ path: `/tmp/${pref}-20-formacion.png` });
  await ir('territorio', { tab: 'ccaa' }, '28-ccaa');
  await ir('elecciones', { tab: 'autonomicas' }, '29-aut');
  await ir('ayuntamiento', null, '24-ayto');
  await ir('personaje', null, '25-carrera-completa');
  await cerrar();
  // Hoja «Más», candidatura autonómica, aviso de botón desactivado y desbordamiento horizontal
  await pg.tap('#nav-mas'); await pg.waitForSelector('.mas-grid'); await pg.waitForTimeout(300); await pg.screenshot({ path: `/tmp/${pref}-21-mas.png` });
  await pg.tap('.mas-it[data-p="personaje"]'); await pg.waitForTimeout(250); await pg.screenshot({ path: `/tmp/${pref}-22-carrera.png` });
  await cerrar();
  await pg.evaluate(() => { ESP.E.jugador.prestigio = 70; ESP.App.ir('agenda'); ESP.Pantallas.agenda.abrir('candidatura_aut'); }); await pg.waitForTimeout(300); await pg.screenshot({ path: `/tmp/${pref}-23-candidatura.png` });
  // Toque en un botón desactivado → aviso con el motivo; toque en una curul → ficha
  await cerrar();
  await pg.evaluate(() => ESP.App.ir('agenda')); await pg.waitForTimeout(200);
  const d = await pg.$('[data-accion].desact, [data-modal].desact');
  if (d) { await d.tap({ force: true }); await pg.waitForTimeout(250); const t = await pg.$('.toast'); console.log('Aviso botón desactivado:', t ? (await t.innerText()).slice(0, 80) : 'NO HAY TOAST'); await pg.screenshot({ path: `/tmp/${pref}-26-aviso.png` }); }
  await pg.evaluate(() => ESP.App.ir('cortes')); await pg.waitForTimeout(250);
  const c = await pg.$('.hemiciclo [data-pol]');
  if (c) { await c.scrollIntoViewIfNeeded(); await pg.waitForTimeout(300); const bb = await c.boundingBox(); await pg.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await pg.waitForTimeout(250); console.log('Tooltip táctil:', await pg.evaluate(() => document.getElementById('tooltip').classList.contains('on'))); await pg.screenshot({ path: `/tmp/${pref}-27-tooltip.png` }); }
  await cerrar();
  const ancho = {};
  for (const [p, params] of [['dashboard'], ['agenda'], ['cortes'], ['cortes', { tab: 'senado' }], ['cortes', { tab: 'pactos' }], ['leyes'], ['consejo'], ['consejo', { tab: 'ministros' }], ['gabinete'], ['ayuntamiento'], ['territorio', { tab: 'ccaa' }], ['territorio', { tab: 'competencias' }], ['territorio', { tab: 'proces' }], ['territorio', { tab: 'estatutos' }], ['territorio', { tab: 'financiacion' }], ['territorio', { tab: 'munis' }], ['partido'], ['europa'], ['elecciones'], ['elecciones', { tab: 'autonomicas' }], ['elecciones', { tab: 'municipales' }], ['personaje'], ['partidas']]) {
    await pg.evaluate(([p, params]) => ESP.App.ir(p, params || null), [p, params || null]); await pg.waitForTimeout(120);
    const r = await pg.evaluate(() => { const v = document.getElementById('vista'); const mal = []; v.querySelectorAll('*').forEach(e => { const b = e.getBoundingClientRect(); if (b.width && b.right > innerWidth + 1 && !e.closest('.tscroll,.tabs,.seg,.hemiciclo,svg,.pasos')) mal.push((e.className || e.tagName).toString().slice(0, 30)); }); return { sw: document.documentElement.scrollWidth, vw: innerWidth, vsw: v.scrollWidth, mal: mal.slice(0, 4) }; });
    if (r.sw > r.vw + 1 || r.vsw > r.vw + 1 || r.mal.length) ancho[p + (params ? ':' + params.tab : '')] = r;
  }
  console.log('Desbordamiento:', JSON.stringify(ancho));
  console.log(errores.length ? 'ERRORES ' + errores.join('|') : 'sin errores');
  await b.close(); srv.close();
})().catch(e => { console.error('FALLO', e); process.exit(1); });
