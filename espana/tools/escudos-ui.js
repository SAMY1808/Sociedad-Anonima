/* Prueba de interfaz de los escudos de ayuntamientos y los logotipos de partidos. Uso: node tools/escudos-ui.js [movil] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/json' };
const movil = process.argv[2] === 'movil';
const srv = http.createServer((q, r) => { let f = path.join(raiz, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'text/plain' }); r.end(d); } }); });
(async () => {
  await new Promise(r => srv.listen(movil ? 8318 : 8317, r));
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext(movil ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage(); const err = []; pg.on('pageerror', e => err.push('PAGE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') err.push('CON ' + m.text()); });
  let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
  const url = 'http://localhost:' + (movil ? 8318 : 8317) + '/index.html';
  await pg.goto(url); await pg.waitForSelector('#i-nueva'); await pg.click('#i-nueva'); await pg.waitForSelector('[data-nivel]'); await pg.click('[data-nivel="nacional"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-partido]');
  // Selección de partido: cada fila lleva su logotipo
  const filas = await pg.evaluate(() => ({ n: document.querySelectorAll('[data-partido]').length, logos: document.querySelectorAll('[data-partido] svg.logo-p').length, w: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(filas.n >= 15 && filas.logos >= filas.n - 1, 'la selección de partido muestra el logotipo de cada partido (' + filas.logos + ' de ' + filas.n + ')'); ok(filas.w <= filas.cw + 2, 'la selección no desborda (' + filas.w + ' ≤ ' + filas.cw + ')');
  await pg.click('[data-partido="ES_ASD"]'); await pg.click('#c-sig'); await pg.waitForSelector('[data-rol]'); await pg.click('[data-rol="lider"]'); await pg.click('#c-sig'); await pg.waitForSelector('#c-ok'); await pg.click('#c-ok'); await pg.waitForSelector('#vista', { timeout: 60000 });
  await pg.evaluate(() => { ESP.UI.cerrarModales(); ESP.E.eventos.pendientes = []; ESP.E.ui.sinGuia = true; });
  const abrir = (p, tab) => pg.evaluate(([p, t]) => { ESP.UI.cerrarModales(); ESP.App.ir(p, t ? { tab: t } : undefined); const v = document.querySelector('#vista'); return { esc: v.querySelectorAll('svg.esc').length, logos: v.querySelectorAll('svg.logo-p').length, h: v.scrollWidth, w: document.documentElement.clientWidth, txt: v.innerText.length }; }, [p, tab]);
  // Con un cargo local se ven las pestañas de municipios
  await pg.evaluate(() => { const J = ESP.E.jugador; J.cargo = 'concejal'; J.nivel = 'local'; J.muni = J.muni || 'm_mad'; });
  // Territorio → Municipios
  let v = await abrir('territorio', 'munis'); ok(v.esc >= 60, 'Territorio → Municipios: un escudo por ciudad (' + v.esc + ')'); ok(v.logos >= 10, 'y el logotipo del partido de cada alcaldía (' + v.logos + ')'); ok(v.h <= v.w + 2, 'sin desbordar (' + v.h + ' ≤ ' + v.w + ')');
  // Elecciones → Municipales
  v = await abrir('elecciones', 'municipales'); ok(v.esc >= 10, 'Elecciones → Municipales: escudos de las grandes ciudades (' + v.esc + ')'); ok(v.h <= v.w + 2, 'sin desbordar (' + v.h + ' ≤ ' + v.w + ')');
  // Mi partido
  v = await abrir('partido'); ok(await pg.evaluate(() => !!document.querySelector('#vista .cab h1 svg.logo-p')), 'Mi partido: el título lleva el logotipo grande');
  // Ayuntamiento y poder local
  v = await abrir('ayuntamiento'); ok(await pg.evaluate(() => !!document.querySelector('#vista .cab h1 svg.esc')), 'Ayuntamiento: el título lleva el escudo de la ciudad');
  v = await abrir('local2'); ok(await pg.evaluate(() => !!document.querySelector('#vista .cab h1 svg.esc')), 'Poder local: el título lleva el escudo');
  await pg.evaluate(() => { const J = ESP.E.jugador; J.cargo = 'diputado'; J.nivel = 'nacional'; });
  // Otras tablas con partidos: Mayorías y Cortes
  v = await abrir('mayorias'); ok(v.logos >= 5, 'Mayorías y rivales: logotipos junto a las siglas (' + v.logos + ')'); ok(v.h <= v.w + 2, 'sin desbordar (' + v.h + ' ≤ ' + v.w + ')');
  v = await abrir('cortes'); ok(v.logos >= 5, 'Cortes Generales: logotipos junto a las siglas (' + v.logos + ')'); ok(v.h <= v.w + 2, 'sin desbordar (' + v.h + ' ≤ ' + v.w + ')');
  // Galería de comprobación visual
  const g = await pg.evaluate(() => {
    const E = ESP.E, d = document.createElement('div'); d.id = 'gal'; d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b1220;overflow:auto;padding:12px;display:flex;flex-wrap:wrap;gap:10px;align-content:flex-start';
    const ids = ESP.DATA.municipios.map(m => m[0]); d.innerHTML = ids.map(id => `<div style="display:flex;flex-direction:column;align-items:center;width:64px;font:10px sans-serif;color:#cbd5e1;text-align:center">${ESP.Escudos.svg(id, { h: 52 })}<span>${ESP.DATA.municipios.find(m => m[0] === id)[1]}</span></div>`).join('') + '<div style="width:100%;height:6px"></div>' + E.paises.ES.partidos.map(k => `<div style="display:flex;flex-direction:column;align-items:center;width:64px;font:10px sans-serif;color:#cbd5e1;text-align:center">${ESP.Logos.svg(E, k, { h: 52 })}<span>${E.partidos[k].sigla}</span></div>`).join('');
    document.body.appendChild(d); const bad = [...d.querySelectorAll('svg')].filter(s => { const r = s.getBoundingClientRect(); return !r.width || !r.height; }).length; return { n: d.querySelectorAll('svg.esc').length, p: d.querySelectorAll('svg.logo-p').length, bad };
  });
  ok(g.n === 66 && g.p >= 15 && g.bad === 0, 'galería: ' + g.n + ' escudos y ' + g.p + ' logotipos se dibujan con tamaño real');
  if (!movil) await pg.screenshot({ path: '/tmp/claude-0/shots/escudos-galeria.png' });
  console.log(err.length ? 'ERRORES ' + err.join('\n') : 'sin errores de consola', '| fallos', fallos);
  await b.close(); srv.close(); process.exit(fallos || err.length ? 1 : 0);
})().catch(e => { console.error('FALLO', e); process.exit(1); });
