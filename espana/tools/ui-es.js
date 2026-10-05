/* Prueba de interfaz con Playwright: crea una partida, recorre todas las pantallas y avanza el tiempo resolviendo modales.
   Uso: node tools/ui-es.js [nivel=nacional|autonomico|local] [partido=ES_ASD] [rol=base|lider] [semanas=60] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
const [nivel = 'nacional', partido = 'ES_ASD', rol = 'base', semanas = '60', tag = ''] = process.argv.slice(2);
(async () => {
  await new Promise(r => srv.listen(8123, r));
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const pg = await b.newPage({ viewport: { width: 1360, height: 860 } });
  const errores = [];
  pg.on('pageerror', e => errores.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  pg.on('console', m => { if (m.type() === 'error') errores.push('CONSOLE ' + m.text()); });
  await pg.goto('http://localhost:8123/index.html');
  await pg.waitForSelector('#i-nueva');
  await pg.click('#i-nueva');
  await pg.waitForSelector('[data-nivel]');
  await pg.click(`[data-nivel="${nivel}"]`);
  if (nivel === 'local') await pg.selectOption('#c-muni', { index: 0 }).catch(() => {});
  if (process.env.REGION) await pg.click(`[data-prov="${process.env.REGION}"]`).catch(() => {});
  await pg.click('#c-sig');
  await pg.waitForSelector('[data-partido]');
  await pg.click(`[data-partido="${partido}"]`);
  await pg.click('#c-sig');
  await pg.waitForSelector('[data-rol]');
  await pg.click(`[data-rol="${rol}"]`);
  await pg.click('#c-sig');
  await pg.waitForSelector('#c-ok');
  await pg.click('#c-ok');
  await pg.waitForSelector('#vista', { timeout: 60000 });
  console.log('partida creada');
  const titulos = {};
  const resolver = async () => {
    for (let i = 0; i < 30; i++) {
      const fondo = await pg.$('.modal-fondo'); if (!fondo) return;
      const tit = await pg.evaluate(() => (document.querySelector('.modal-fondo .m-cab h2') || {}).textContent || ''); titulos[tit] = (titulos[tit] || 0) + 1; if (process.env.SHOT && tit.includes(process.env.SHOT) && titulos[tit] === 1) await pg.screenshot({ path: `/tmp/modal-${process.env.SHOT.replace(/\W/g, '')}.png` });
      const clic = async s => { const e = await pg.$(s); if (e && await e.isVisible()) { await e.click({ timeout: 2000 }).catch(() => {}); return true; } return false; };
      if (await clic('.modal-fondo #n-saltar:not([disabled])')) { await pg.waitForTimeout(100); }
      if (await clic('.modal-fondo #n-cerrar:not([disabled])')) continue;
      if (await clic('.modal-fondo #nl-ok')) continue;
      if (await clic('.modal-fondo #pe-ok')) continue;
      if (await clic('.modal-fondo #np-ok')) continue;
      if (await clic('.modal-fondo #gf-ok')) continue;
      if (await clic('.modal-fondo [data-o="respaldar"]')) continue;
      if (await clic('.modal-fondo [data-nom]')) continue;
      if (await clic('.modal-fondo [data-op]')) continue;
      if (await clic('.modal-fondo [data-v]')) continue;
      if (await clic('.modal-fondo #b-ok')) continue;
      if (await clic('.modal-fondo [data-res]')) continue;
      if (await clic('.modal-fondo .cerrar')) continue;
      await pg.keyboard.press('Escape'); await pg.waitForTimeout(50);
      const f2 = await pg.$('.modal-fondo'); if (f2) { await pg.evaluate(() => ESP.UI.cerrarModales()); }
    }
  };
  const pantallas = ['dashboard', 'agenda', 'cortes', 'leyes', 'consejo', 'gabinete', 'ayuntamiento', 'territorio', 'partido', 'europa', 'elecciones', 'personaje', 'partidas'];
  const visitar = async () => {
    for (const p of pantallas) {
      await pg.click(`#nav [data-p="${p}"]`).catch(() => {}); await pg.waitForTimeout(60);
      // subpestañas
      const tabs = await pg.$$('.tabs [data-tab]');
      for (let i = 0; i < tabs.length; i++) { const ts = await pg.$$('.tabs [data-tab]'); if (!ts[i]) break; await ts[i].click().catch(() => {}); await pg.waitForTimeout(40); }
      await resolver();
    }
  };
  if (process.env.GAB) {
    await pg.evaluate(() => { const E = ESP.E; E.esp.pendienteGabinete = { key: 'central', formacion: true }; ESP.App.revisarPendientes(); }); await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/ui-formacion.png' });
    await pg.click('.modal-fondo [data-c]'); await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/ui-pool.png' });
    await pg.click('.modal-fondo [data-nom]'); await pg.waitForTimeout(150);
    await pg.click('#gf-ok'); await pg.waitForTimeout(150);
    await pg.evaluate(() => ESP.App.ir('gabinete', { key: 'central' })); await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/ui-gabinete.png' });
    await pg.evaluate(() => { const E = ESP.E; E.esp.gab = E.esp.gab || { pool: {} }; E.esp.gab.escandalo = { cid: 'hac', id: E.paises.ES.gob.ministros.hac, t: 0 }; ESP.App.revisarPendientes(); }); await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/ui-escandalo.png' }); await resolver();
  }
  if (process.env.CENSURA) await pg.evaluate(() => ESP.Pantallas.elecciones.bloqueModal('censura'));
  if (process.env.DISOLVER) await pg.evaluate(() => { const E = ESP.E; E.fecha.t += 60; E.esp.cortes.ultDisolucion = -100; ESP.Generales.disolver(E, 'prueba', true); });
  await visitar();
  if (tag) await pg.screenshot({ path: `/tmp/ui-${tag}-0.png` });
  const N = +semanas;
  for (let i = 0; i < N; i += 4) {
    await pg.click('#b-mes').catch(() => {});
    await pg.waitForTimeout(80);
    await resolver();
    // algunas acciones de agenda
    if (i % 12 === 0) {
      await pg.click('#nav [data-p="agenda"]').catch(() => {});
      const botones = await pg.$$('[data-accion]:not([disabled])');
      for (const bt of botones.slice(0, 3)) { await bt.click({ timeout: 1500 }).catch(() => {}); await resolver(); }
    }
    if (i % 24 === 0) await visitar();
  }
  await visitar();
  if (tag) { await pg.click('#nav [data-p="dashboard"]'); await pg.screenshot({ path: `/tmp/ui-${tag}-1.png` }); for (const p of ['cortes', 'consejo', 'territorio', 'elecciones', 'ayuntamiento']) { await pg.click(`#nav [data-p="${p}"]`); await pg.waitForTimeout(100); await pg.screenshot({ path: `/tmp/ui-${tag}-${p}.png`, fullPage: false }); } }
  if (process.env.EXTRA) {
    await pg.evaluate(() => ESP.App.ir('territorio', { tab: 'competencias' })); await pg.waitForTimeout(150); await pg.screenshot({ path: '/tmp/ui-comp.png' });
    await pg.evaluate(() => ESP.Pantallas.territorio.verCcaa(ESP.E.jugador.region || 'CAT')); await pg.waitForTimeout(150); await pg.screenshot({ path: '/tmp/ui-ficha.png' }); await resolver();
    for (const m of ['reclamar_competencia', 'negociar_financiacion', 'consejeria', 'politica_fiscal']) { await pg.evaluate(m2 => ESP.Pantallas.agenda.abrir(m2), m); await pg.waitForTimeout(120); if (m === 'reclamar_competencia') await pg.screenshot({ path: '/tmp/ui-reclamar.png' }); if (m === 'negociar_financiacion') await pg.screenshot({ path: '/tmp/ui-fin.png' }); await pg.evaluate(() => ESP.UI.cerrarModales()); }
    await pg.evaluate(() => ESP.App.ir('territorio', { tab: 'proces' })); await pg.waitForTimeout(150); await pg.screenshot({ path: '/tmp/ui-proces.png' });
    await pg.evaluate(() => ESP.App.ir('territorio', { tab: 'financiacion' })); await pg.waitForTimeout(150); await pg.screenshot({ path: '/tmp/ui-finan.png' });
  }
  const info = await pg.evaluate(() => { const E = ESP.E; return { fecha: ESP.U.fmtT(E.fecha.t), cargo: ESP.Personaje.cargoTxt(E), estado: E.esp.cortes.estado }; });
  console.log('estado final', JSON.stringify(info));
  console.log('modales:', JSON.stringify(titulos));
  console.log(errores.length ? 'ERRORES:\n' + [...new Set(errores)].slice(0, 15).join('\n') : 'sin errores');
  await b.close(); srv.close();
})().catch(e => { console.error('FALLO', e); process.exit(1); });
