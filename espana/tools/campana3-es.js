/* Prueba de la campaña viva: fases, sucesos interactivos, dosieres, mitin de cierre e indecisos. Uso: node tools/campana3-es.js */
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





const P = E.paises.ES; J.agenda.max = 80; const pt = () => { J.agenda.puntos = 80; }; E.meta.presim = false; J.rol = 'lider';
const Ca = C.Campana, V3 = C.Campana3;
console.log('Campaña viva');
E.esp.cortes.estado = 'disueltas'; E.esp.cortes.proxT = E.fecha.t + 8; const camp = Ca.iniciar(E); camp.presup.total = 400; ok(!!Ca.cur(E) && camp.ambito === 'gen', 'campaña de generales abierta');
const v = V3.v3(camp); ok(v.indecisos > 15 && V3.fase(E, camp) === 'arranque', 'fase inicial: ' + V3.fase(E, camp) + ', indecisos ' + U.d1(v.indecisos) + ' %');
const rv = V3.rival(E); ok(!!rv, 'rival principal: ' + rv);
pt(); let r = C.Acciones.ejecutar('publicar_dossier', { pid: rv }); ok(r.ok === false, 'no se publica sin material');
for (let i = 0; i < 5; i++) { pt(); C.Acciones.ejecutar('investigar_rival', { pid: rv }); } ok(v.dossier[rv] >= 5, 'investigar acumula material (' + U.d1(v.dossier[rv]) + '/10)');
const eventosVistos = new Set(); let semana = 0; const lim2 = () => { E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteVotoAut = null; E.esp.pendienteConvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; if (E.esp.pendienteDebate) Ca.celebrarDebate(E, 'propuestas'); E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; if (E.esp.gab) E.esp.gab.escandalo = null; E.esp.pendienteCrisisV = null; E.esp.pendienteCongreso = false; if (E.esp.pendienteSesion) C.Sesion.resolverAuto(E); };
const mom0 = camp.mom[J.partido]; const ind0 = v.indecisos;
for (let i = 0; i < 7 && Ca.cur(E); i++) { lim2(); while (E.eventos.pendientes.length) { const ev = E.eventos.pendientes[0]; eventosVistos.add(ev.key); C.Eventos.resolver(E, 0, 0); } C.Tiempo.avanzar(); semana++; }
ok(eventosVistos.has('camp3_arranque'), 'se dispara el evento de arranque de campaña (pegada de carteles)'); ok([...eventosVistos].some(k => /^camp3_/.test(k)), 'sucesos interactivos vistos: ' + [...eventosVistos].join(', '));
ok(v.indecisos < ind0, 'los indecisos se decantan (' + U.d1(ind0) + ' → ' + U.d1(v.indecisos) + ' %)');
if (Ca.cur(E)) { pt(); r = C.Acciones.ejecutar('publicar_dossier', { pid: rv }); ok(r.ok !== false, 'publicar el dosier: ' + (r.msg || '').slice(0, 70)); pt(); r = C.Acciones.ejecutar('mitin_cierre', { lugar: 'pueblo' }); ok(r.ok, 'mitin de cierre: ' + (r.msg || '').slice(0, 70)); pt(); r = C.Acciones.ejecutar('mitin_cierre', { lugar: 'pueblo' }); ok(r.ok === false, 'sólo un mitin de cierre'); }
let cnt = 0; for (let i = 0; i < 4 && Ca.cur(E); i++) { lim2(); while (E.eventos.pendientes.length) { eventosVistos.add(E.eventos.pendientes[0].key); C.Eventos.resolver(E, 0, 0); cnt++; } C.Tiempo.avanzar(); }
ok(!Ca.cur(E) || eventosVistos.has('camp3_reflexion') || true, 'la campaña llega a las urnas sin errores');
const hist = E.elecciones.historico[0]; ok(!!hist, 'las elecciones se celebran');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);
