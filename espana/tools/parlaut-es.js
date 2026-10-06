/* Prueba del Parlamento autonómico: disolución, Diputación Permanente y decretos-ley con convalidación. Uso: node tools/parlaut-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 171, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, g = E.paises.ES.gob;
const lim = () => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.elecciones.nochePendiente = null; };

const avanza = n => { for (let i = 0; i < n; i++) { lim(); E.esp.pendienteConvAut = E.esp.pendienteConvAut; C.Tiempo.avanzar(); } };
const T = C.Territorio, c = 'ARA', rc = E.esp.ccaa[c];
console.log('Composición y Diputación Permanente');
const dp = T.dp(E, c); ok(dp.n >= 7 && U.suma(Object.values(dp.seats)) === dp.n, 'DP de ' + dp.n + ' miembros reparte todos sus escaños');
ok(!T.disuelto(E, c), 'el Parlamento no está disuelto');
console.log('Disolución');
rc.leyes = rc.leyes || []; const prog = T.leyesDisponibles(E, c)[0];
let r = T.proponerLeyAut(E, c, prog.id); ok(r.ok, 'proposición registrada: ' + (r.msg || '').slice(0, 50));
T.adelantar(E, c, 'de prueba'); avanza(1);
ok(T.disuelto(E, c), 'Parlamento disuelto'); ok(rc.leyes.every(l => l.estado !== 'tramite'), 'caducan las leyes en trámite');
r = T.proponerLeyAut(E, c, prog.id); ok(!r.ok && /disuelto/.test(r.msg), 'no se registran leyes con el Parlamento disuelto');
console.log('Decretos-ley');
const disp = T.leyesDisponibles(E, c); const d1 = T.decretar(E, c, disp[1].id, { quien: 'Test' });
ok(d1.ok && d1.d.dis, 'decreto-ley aprobado con el Parlamento disuelto');
const resolver = () => { if (E.esp.pendienteConvAut) { const pv = E.esp.pendienteConvAut, d = T.rdlAut(E, pv.c, pv.id); T.convalidar(E, pv.c, d, 'si'); } };
for (let i = 0; i < 6; i++) { lim(); const pc = E.esp.pendienteConvAut; C.Tiempo.avanzar(); resolver(); }
ok(d1.d.estado !== 'vigor', 'el decreto se resuelve: ' + d1.d.estado + ' en ' + (d1.d.v && d1.d.v.organo));
ok(d1.d.v && d1.d.v.organo === 'dp' || !T.disuelto(E, c), 'lo vota la Diputación Permanente mientras está disuelto');
console.log('Presidente autonómico');
rc.parl.proxT = E.fecha.t + 100; rc.gob.pres = 'J'; E.jugador.region = c; E.jugador.cargo = 'presauto'; E.jugador.agenda.puntos = 10;
const disp2 = T.leyesDisponibles(E, c).filter(p => !T.paAsegurar(E, c).rdl.some(x => x.prog === p.id));
r = C.Acciones.ejecutar('decreto_ley_aut', { prog: disp2[0].id }); ok(r.ok !== false, 'el presidente aprueba un decreto-ley: ' + (r.msg || '').slice(0, 60));
for (let i = 0; i < 6; i++) { lim(); C.Tiempo.avanzar(); }
ok(T.paAsegurar(E, c).rdl.find(x => x.prog === disp2[0].id).estado !== 'vigor', 'se convalida o deroga en el Pleno');
// IA: decretos espontáneos
let n = 0; for (const k of T.ids()) { E.esp.ccaa[k].parl.proxT = E.fecha.t + 3; } for (let i = 0; i < 60; i++) { lim(); C.Tiempo.avanzar(); resolver(); }
for (const k of T.ids()) n += T.paAsegurar(E, k).rdl.length; ok(n >= 1, 'el Gobierno de alguna comunidad dicta decretos-ley por su cuenta (' + n + ')');
let cv = 0, dr = 0; for (const k of T.ids()) T.paAsegurar(E, k).rdl.forEach(x => { if (x.estado === 'convalidado') cv++; if (x.estado === 'derogado') dr++; }); console.log('  convalidados', cv, 'derogados', dr); ok(cv >= dr, 'la mayoría de decretos se convalida (' + cv + ' vs ' + dr + ')');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);
