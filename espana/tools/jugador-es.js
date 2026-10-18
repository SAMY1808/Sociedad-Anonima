/* Prueba del jugador en España: crea una partida con un perfil y simula, ejecutando acciones y resolviendo eventos al azar. */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/art155.js','js/sistemas/ccaa2.js','js/sistemas/disolucion.js','js/sistemas/financia.js','js/sistemas/campmun.js','js/sistemas/crisis3.js','js/sistemas/constit.js','js/sistemas/gobaut.js','js/sistemas/oposicion.js','js/sistemas/desatasco.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;
const arg = process.argv.slice(2);
const perfil = { semilla: +arg[0] || 11, partido: arg[1] || 'ES_ASD', nivel: arg[2] || 'nacional', rol: arg[3] || 'base', region: arg[4] || null, muni: arg[5] || null, nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES' };
const sem = +arg[6] || 260;
const E = C.Mundo.nueva(perfil), J = E.jugador, P = E.paises.ES;
const f = o => Object.keys(o).sort((a, b) => o[b] - o[a]).map(k => (E.partidos[k] ? E.partidos[k].sigla : k) + ' ' + (Math.round(o[k] * 10) / 10)).join(' · ');
console.log('JUGADOR', J.partido, 'nivel', J.nivel, 'cargo', C.Personaje.cargoTxt(E), 'rol', J.rol, 'region', J.region, 'muni', J.muni);
const todas = []; const np = C.Noticias.poner; C.Noticias.poner = (E2, t, x, p) => { todas.push(U.fmtT(E2.fecha.t) + ' ' + x); return np(E2, t, x, p); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const piloto = require('./piloto')(C);
let hechas = {};
for (let i = 0; i < sem; i++) {
  if (!piloto.semana(E, hechas)) break;
}
console.error = oe;
if (piloto.desatascos.length) { console.log('✗ el piloto tuvo que recurrir al desatasco', piloto.desatascos.length, 'veces (falta una rama en tools/piloto.js o una ventana en el juego):', piloto.desatascos.slice(0, 3).join(' | ')); process.exitCode = 1; }
console.log('--- tras', sem, 'semanas (', U.fmtT(E.fecha.t), '), errores:', errores); if (errores) process.exitCode = 1;
console.log('Jugador:', C.Personaje.cargoTxt(E), '| nivel', J.nivel, '| prestigio', Math.round(J.prestigio), '| rol', J.rol, '| partido', J.partido, '| electo', J.electo, 'escReg', J.escReg, 'concejal', J.concejal);
console.log('Hitos:', Object.keys(J.hitos).map(k => k + '@' + J.hitos[k]).join(', '));
console.log('Gobierno:', E.partidos[P.gob.partido].sigla, 'pm', E.politicos[P.gob.pm] && E.politicos[P.gob.pm].n);
console.log('Acciones usadas:', JSON.stringify(hechas));
console.log('Historial jugador:'); J.historial.slice(0, 15).reverse().forEach(h => console.log('  ', U.fmtT(h.t), h.txt));
