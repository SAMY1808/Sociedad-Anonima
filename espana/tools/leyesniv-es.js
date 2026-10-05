/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 61, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
console.log('Diputado/a autonómico/a: proposición de ley');
let E = crear({ nivel: 'autonomico', rol: 'direccion' }); let J = E.jugador, T = C.Territorio, c = J.region, rc = E.esp.ccaa[c];
J.prestigio = 60; J.agenda.puntos = 10;
ok(J.cargo === 'dipauto', 'cargo dipauto (' + J.cargo + ')');
const leyes = T.leyesDisponibles(E, c); ok(leyes.length >= 5, 'hay leyes autonómicas disponibles (' + leyes.length + ')');
const aprobadas0 = (rc.leyes || []).length;
let r = C.Acciones.ejecutar('proponer_ley_aut', { prog: leyes[0].id }); ok(r.ok && /Registras/.test(r.msg), r.msg);
ok(rc.leyes.some(l => l.jugador && l.estado === 'tramite'), 'la ley queda en tramitación');
r = C.Acciones.ejecutar('proponer_ley_aut', { prog: leyes[0].id }); ok(r.ok === false, 'no se puede presentar dos veces');
for (let i = 0; i < 8; i++) { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.elecciones.nochePendiente = null; C.Tiempo.avanzar(); }
ok(rc.leyes.some(l => l.jugador && l.estado !== 'tramite'), 'a las semanas el Parlamento la vota (' + rc.leyes.find(l => l.jugador).estado + ')');
console.log('Concejal/a: moción al pleno');
const idm = Object.values(E.esp.muni.m).find(m => m.ccaa === 'MAD').id;
E = crear({ nivel: 'local', rol: 'direccion', region: 'MAD', muni: idm }); J = E.jugador;
J.agenda.puntos = 10; const id = J.muni, Mu = C.Municipios;
console.log('  cargo', J.cargo, 'muni', id);
const mo = Mu.mocionesDisponibles(E, id); ok(mo.length >= 8, 'hay mociones disponibles (' + mo.length + ')');
const pr = Mu.probMocion(E, id, J.partido); ok(pr.p > 0 && pr.p < 1, 'probabilidad calculada ' + Math.round(pr.p * 100) + ' %');
if (J.cargo === 'concejal') { let hecho = 0; for (let i = 0; i < 6; i++) { J.agenda.puntos = 10; const x = C.Acciones.ejecutar('mocion_pleno', { k: mo[i].k }); if (x.ok) hecho++; } ok(hecho >= 4, 'se presentan mociones (' + hecho + ')'); ok(E.esp.muni.m[id].pleno.length >= 4, 'quedan registradas en el pleno'); }
else console.log('  (cargo ' + J.cargo + ': se omite la moción de concejal)');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);
