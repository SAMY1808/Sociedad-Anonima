/* Compatibilidad de partidas guardadas. Cada partida de tools/guardados (creadas por versiones anteriores del juego y por la actual; ver guardados/generar.js)
   debe cargarse con la versión que tienes, jugar 120 semanas sin errores ni bloqueos y seguir siendo una partida guardable (se guarda y se vuelve a cargar igual).
   Si falla una partida antigua, una actualización rompería las carreras largas de los jugadores.
   Uso: node tools/guardados-es.js [filtro] [semanas=120]      (con EXTRA=/ruta/partida.json se añade una partida real) */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const mini = require('./mini'), modulos = require('./modulos');
const C = mini(modulos()), U = C.U, piloto = require('./piloto')(C);
const SOLO = process.argv[2] || '', SEM = +process.argv[3] || 120;
let errores = 0; const errTxt = []; const oe = console.error; console.error = (...a) => { errores++; if (errTxt.length < 6) errTxt.push(a.map(x => (x && x.message) || String(x)).join(' ').slice(0, 220)); };
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const dir = path.join(__dirname, 'guardados');
const archivos = fs.readdirSync(dir).filter(f => /\.json\.br$/.test(f) && f.includes(SOLO)).sort().map(f => path.join(dir, f))
  .concat((process.env.EXTRA || '').split(',').filter(Boolean));       // EXTRA=/ruta/partida.json[,otra.json.br]: para comprobar una partida real de un jugador
const nofinitos = E => { const out = [], vis = new Set(); (function rec(o, ruta, prof) { if (out.length >= 4 || prof > 16) return; if (typeof o === 'number') { if (!Number.isFinite(o)) out.push(ruta + ' = ' + o); return; } if (typeof o === 'function') { out.push(ruta + ' es una función'); return; } if (o === null || typeof o !== 'object' || vis.has(o)) return; vis.add(o); if (Array.isArray(o)) o.forEach((x, i) => rec(x, ruta + '[' + i + ']', prof + 1)); else for (const k of Object.keys(o)) rec(o[k], ruta + '.' + k, prof + 1); })(E, 'E', 0); return out; };

console.log('Partidas guardadas de versiones anteriores (' + archivos.length + ')');
ok(archivos.length >= 8, 'hay partidas de prueba suficientes en tools/guardados (' + archivos.length + ')');
for (const f of archivos) {
  const nom = path.basename(f).replace(/\.json(\.br)?$/, ''); errores = 0; errTxt.length = 0; piloto.desatascos.length = 0;
  let E; try { const bin = fs.readFileSync(f); E = JSON.parse((/\.br$/.test(f) ? zlib.brotliDecompressSync(bin) : bin).toString('utf8')); } catch (e) { ok(false, nom + ': no se pudo leer (' + e.message + ')'); continue; }
  const cargo0 = (() => { try { return C.Personaje.cargoTxt(E); } catch (e) { return '?'; } })(), t0 = E.fecha.t;
  try { C.Estado.migrar(E); C.E = E; C.Bus.emit('partida:cargada', E); } catch (e) { ok(false, nom + ': no se pudo cargar (' + e.message + ')'); continue; }
  ok(errores === 0, `${nom}: se carga sin errores (${U.fmtT(E.fecha.t)} · ${C.Personaje.cargoTxt(E)})` + (errores ? ' — ' + errTxt.slice(0, 2).join(' | ') : ''));
  let jugadas = 0, parada = null;
  for (let i = 0; i < SEM; i++) { let r; try { r = piloto.semana(E, {}); } catch (e) { parada = 'excepción: ' + e.message; break; } if (!r) { parada = 'el tiempo se paró el ' + U.fmtT(E.fecha.t) + ' (bloqueo: ' + C.Tiempo.bloqueo() + ')'; break; } jugadas++; }
  ok(!parada && jugadas === SEM && E.fecha.t - t0 === SEM, `${nom}: juega ${SEM} semanas hasta ${U.fmtT(E.fecha.t)} como ${C.Personaje.cargoTxt(E)}` + (parada ? ' — ' + parada : ''));
  ok(errores === 0, `${nom}: sin errores del juego al continuarla` + (errores ? ' — ' + errTxt.slice(0, 2).join(' | ') : ''));
  ok(piloto.desatascos.length === 0, `${nom}: ninguna decisión se quedó sin resolver` + (piloto.desatascos.length ? ' — ' + piloto.desatascos[0] : ''));
  const raros = nofinitos(E), esc = U.suma(Object.values(E.paises.ES.escanos));
  ok(!raros.length && esc === 350, `${nom}: valores sanos (sin NaN ni infinitos; Congreso de ${esc} escaños)` + (raros.length ? ' — ' + raros.join('; ') : ''));
  const cargar = t => { const X = JSON.parse(t); C.Estado.migrar(X); C.E = X; C.Bus.emit('partida:cargada', X); return X; };
  const E2 = cargar(JSON.stringify(E)), t2 = JSON.stringify(E2), E3 = cargar(t2);
  ok(JSON.stringify(E3) === t2, `${nom}: se guarda y se vuelve a cargar igual (estable tras la primera carga)`);
}
console.error = oe;
console.log('fallos', fallos); process.exit(fallos ? 1 : 0);
