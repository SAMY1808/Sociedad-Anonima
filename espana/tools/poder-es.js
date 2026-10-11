/* Prueba de poder y fragilidad: mayorías y rivales, corrupción y comisiones, acuerdos de gobierno y Corona. Uso: node tools/poder-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/art155.js','js/sistemas/ccaa2.js','js/sistemas/disolucion.js','js/sistemas/financia.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 171, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, g = E.paises.ES.gob;
const lim = () => { if (C.Sesion && E.esp.pendienteSesion) C.Sesion.resolverAuto(E); E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.esp.pendienteCrisisV = null; E.esp.pendienteCongreso = false; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; };

const avanza = n => { for (let i = 0; i < n; i++) { lim(); if (E.esp.gab) E.esp.gab.escandalo = null; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; C.Tiempo.avanzar(); } };
const P = E.paises.ES;
console.log('Mayorías y rivales');
const My = C.Mayorias; const m = My.asegurar(E); ok(Object.keys(m.estilo).length >= 6, 'cada partido tiene estilo (' + Object.keys(m.estilo).length + ')');
const alt = My.alternativas(E); ok(alt.length >= 1 && alt[0].si > 0, 'alternativas de moción: ' + alt.map(a => E.partidos[a.cand].sigla + ' ' + a.si).join(', '));
const aa = My.alternativasAut(E, 'ARA'); ok(aa.length >= 1, 'alternativas autonómicas');
J.agenda.puntos = 20; let r = C.Acciones.ejecutar('reunirse_rival', { pid: alt[0].cand }); ok(r.ok, 'reunirse con un rival'); J.agenda.puntos = 20; r = C.Acciones.ejecutar('atacar_rival', { pid: alt[0].cand }); ok(r.ok, 'atacar a un rival');
E.esp.mayo.ofertas.push({ id: 'o1', pid: alt[0].cand, t: E.fecha.t, tema: 'un pacto de prueba' }); r = My.aceptarOferta(E, 'o1'); ok(r.ok, 'aceptar una oferta de pacto');
avanza(30); ok(true, 'turnos de rivales sin errores');
console.log('Corrupción');
const K = C.Corrupcion; const rival = P.partidos.find(x => x !== J.partido && E.partidos[x].amb === 'nac' && (P.escanos[x] || 0) > 30);
const caso = K.nuevo(E, rival, { gravedad: 0.8 }); ok(caso.fase === 'rumor', 'se abre un caso');
for (let i = 0; i < 4; i++) { caso.tFase -= 20; avanza(1); } ok(['juicio', 'cerrado', 'investigacion'].includes(caso.fase), 'el caso avanza de fase: ' + caso.fase);
const c2 = K.nuevo(E, rival, { gravedad: 0.6 }); J.agenda.puntos = 20; r = C.Acciones.ejecutar('exigir_comision', { caso: c2.id }); console.log('   comisión:', r.msg || r); ok(r.ok !== false || /apoyos/.test(r.msg), 'exigir comisión (resultado coherente)');
if (c2.com) { avanza(14); ok(K.asegurar(E).coms[0].estado === 'cerrada', 'la comisión se cierra con conclusiones'); }
const mv = Object.keys(P.gob.ministros).find(m => P.gob.ministros[m] !== 'J' && E.politicos[P.gob.ministros[m]]); if (mv) { r = K.reprobar(E, mv, J.partido); ok(r.ok, 'reprobación de un ministro: ' + r.msg); } else ok(true, 'reprobación (gobierno en funciones: sin ministros)');
E.meta.presim = false; let nc = 0; for (let i = 0; i < 300; i++) { lim(); E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; if (E.esp.gab) E.esp.gab.escandalo = null; C.Tiempo.avanzar(); } nc = K.asegurar(E).casos.length; ok(nc >= 3, 'se generan casos de corrupción por sí solos (' + nc + ')');
console.log('Acuerdos de gobierno');
const Cl = C.Coaliciones; P.gob.pm = 'J'; J.cargo = 'pm'; E.esp.pactos.push({ pid: P.gob.coalicion[0] === J.partido ? (P.partidos.find(x => x !== J.partido)) : P.gob.coalicion[0], dem: 'social', t: E.fecha.t, limite: E.fecha.t + 5, estado: 'pendiente' });
const pa = E.esp.pactos[E.esp.pactos.length - 1]; ok(Cl.progreso(E, pa) === 'nada', 'cláusula sin empezar'); J.agenda.puntos = 20; r = C.Acciones.ejecutar('comision_seguimiento', {}); ok(r.ok, 'comisión de seguimiento');
J.agenda.puntos = 20; r = C.Acciones.ejecutar('cumplir_pacto', { pid: pa.pid, dem: pa.dem }); ok(r.ok, 'cumplir cláusula con ley: ' + r.msg); ok(Cl.progreso(E, pa) === 'tramite', 'la cláusula pasa a tramitación');
J.agenda.puntos = 20; r = C.Acciones.ejecutar('renegociar_pacto', { pid: pa.pid, dem: pa.dem }); ok(r.ok && pa.reneg, 'renegociar el plazo');
console.log('La Corona');
const Cr = C.Corona; const cr = Cr.asegurar(E); J.agenda.puntos = 20; r = C.Acciones.ejecutar('audiencia_rey', {}); ok(r.ok, 'audiencia'); J.agenda.puntos = 20; r = C.Acciones.ejecutar('defender_corona', {}); ok(r.ok, 'defender'); J.agenda.puntos = 20; r = C.Acciones.ejecutar('cuestionar_corona', {}); ok(r.ok, 'cuestionar');
cr.pop = 10; cr.bajas = 20; avanza(2); ok(!!cr.crisis, 'crisis de legitimidad con popularidad baja'); J.agenda.puntos = 20; r = C.Acciones.ejecutar('mediar_corona', {}); ok(r.ok, 'mediar'); cr.crisis = { t: E.fecha.t - 30 }; Cr.abdicar(E); ok(cr.reinado === 1 && cr.pop > 55, 'abdicación y nuevo reinado');
// Compatibilidad con el estado antiguo de la Corona (sólo `apoyo`, usado por los eventos de la Casa Real)
{ const E5 = crear({ semilla: 9 }); E5.esp.corona = { apoyo: 51 }; const c5 = C.Corona.asegurar(E5); ok(c5.pop === 51 && Array.isArray(c5.serie) && Array.isArray(c5.hist), 'estado antiguo de la Corona migrado'); c5.pop = 40; ok(E5.esp.corona.apoyo === 40, 'pop y apoyo son la misma cifra');
  const E6 = crear({ semilla: 9 }); E6.esp.corona = { pop: 44, rel: 50 }; const c6 = C.Corona.asegurar(E6); ok(c6.apoyo === 44 && !Object.prototype.hasOwnProperty.call(JSON.parse(JSON.stringify(E6.esp.corona)), 'pop'), 'estado con `pop` migrado a `apoyo`'); }
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);
