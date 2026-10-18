/* Genera partidas guardadas de prueba con la versión del juego del directorio donde se ejecuta (comprimidas con brotli).
   Se ejecuta con versiones antiguas del juego (un checkout o worktree del commit) para guardar partidas «de hace tiempo» y con la actual para el futuro;
   tools/guardados-es.js comprueba que la versión nueva siga cargando y jugando todas.
   Uso: node tools/guardados/generar.js <etiqueta> [directorio de salida] [perfiles: nac,aut,loc,partido]      (p. ej. «2988a43»; por defecto, esta misma carpeta y todos los perfiles) */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const mini = require('../mini'), modulos = require('../modulos');
const etiqueta = process.argv[2] || 'actual', salida = process.argv[3] || __dirname, filtro = (process.argv[4] || '').split(',').filter(Boolean);
const C = mini(modulos()), U = C.U, piloto = require('../piloto')(C);
let errores = 0; const oe = console.error; console.error = () => { errores++; };      // los árboles antiguos pueden quejarse: aquí sólo se juega
/* id, semanas y opciones de cada partida. Cubren los tres niveles, el modo partido y una carrera con cargo autonómico. */
const PERFILES = [
  { id: 'nac-lider-4a', semanas: 208, cargo: 'pm', o: { semilla: 101, partido: 'ES_UPC', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' } },
  { id: 'aut-lider-3a', semanas: 156, cargo: 'presauto', o: { semilla: 202, partido: 'ES_UPC', nivel: 'autonomico', rol: 'lider', region: 'MAD', muni: 'm_mad' } },
  { id: 'loc-lider-2a', semanas: 104, cargo: 'alcalde', o: { semilla: 303, partido: 'ES_ASD', nivel: 'local', rol: 'lider', region: 'CAT', muni: 'm_bcn' } },
  { id: 'partido-3a', semanas: 156, cargo: null, o: { semilla: 404, partido: 'ES_ASD', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' }, modoPartido: true }
];
const INTENTOS = +process.env.INTENTOS || 8;     // se prueban varias semillas hasta que la carrera llegue al cargo que se busca (así las partidas no son sólo de «sin cargo»)
const jugar = (p, semilla) => {
  const E = C.Mundo.nueva(Object.assign({ nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES' }, p.o, { semilla })); C.E = E; if (p.modoPartido) { E.meta.modoPartido = true; E.meta.vistaPartido = true; }
  let t = 0, fallosSemana = 0; const hechas = {};
  for (let i = 0; i < p.semanas; i++) { try { if (!piloto.semana(E, hechas)) { if (++fallosSemana > 30) break; } else t++; } catch (e) { if (++fallosSemana > 30) break; } }
  return { E, t };
};
for (const p of PERFILES.filter(p => !filtro.length || filtro.some(f => p.id.startsWith(f)))) {
  let r = null, intento = 0;
  try { for (; intento < INTENTOS; intento++) { r = jugar(p, p.o.semilla + intento * 1000); if (!p.cargo || r.E.jugador.cargo === p.cargo) break; } } catch (e) { console.log(`  ✗ ${p.id}: no se pudo crear (${e.message})`); continue; }
  const E = r.E; E.meta.nombrePartida = 'Prueba ' + p.id;
  const txt = JSON.stringify(E), cmp = zlib.brotliCompressSync(Buffer.from(txt), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: txt.length } }), f = path.join(salida, `${etiqueta}-${p.id}.json.br`);
  fs.writeFileSync(f, cmp);
  console.log(`  ${!p.cargo || E.jugador.cargo === p.cargo ? '✓' : '·'} ${path.basename(f)} · ${r.t} semanas (${U.fmtT(E.fecha.t)}, semilla ${p.o.semilla + Math.min(intento, INTENTOS - 1) * 1000}) · ${C.Personaje.cargoTxt(E)} · ${Math.round(txt.length / 1024)} KB → ${Math.round(cmp.length / 1024)} KB`);
}
console.error = oe;
