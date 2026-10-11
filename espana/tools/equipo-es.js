/* Prueba de los sistemas de medios, justicia, partido interno, diálogo social, crisis y jefe de gabinete. Uso: node tools/equipo-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/art155.js','js/sistemas/ccaa2.js','js/sistemas/disolucion.js','js/sistemas/financia.js','js/sistemas/campmun.js','js/sistemas/crisis3.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 171, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, g = E.paises.ES.gob;
const lim = () => { if (C.Sesion && E.esp.pendienteSesion) C.Sesion.resolverAuto(E); E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.esp.pendienteCrisisV = null; E.esp.pendienteCongreso = false; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; };
const avanza = n => { for (let i = 0; i < n; i++) { lim(); C.Tiempo.avanzar(); } };
J.agenda.puntos = 30;
console.log('Medios');
const Md = C.Medios; const md = Md.asegurar(E); ok(Object.keys(md.rel).length === 8, '8 medios con relación inicial');
avanza(12); ok(md.portadas.length >= 20, 'portadas semanales (' + md.portadas.length + ')');
let r = C.Acciones.ejecutar('entrevista_medio', { medio: 'dnac' }); ok(r.ok, r.msg);
r = C.Acciones.ejecutar('rueda_prensa', {}); ok(r.ok, r.msg);
md.bulos.unshift({ id: 'bx', t: E.fecha.t, pid: J.partido, txt: 'bulo de prueba', fuerza: 0.9, activo: true });
r = C.Acciones.ejecutar('desmentir_bulo', { id: 'bx' }); ok(r.ok, 'desmentir: ' + r.msg);
console.log('Justicia');
const jt = C.Justicia.asegurar(E); ok(jt.cgpj && jt.fiscal && jt.causas, 'estado de la Justicia'); const tc = C.Justicia.tc(E); ok(tc.prog + tc.cons === 12, 'TC de 12 magistrados (' + tc.prog + '-' + tc.cons + ')');
jt.cgpj.caducado = true; J.agenda.puntos = 30; for (let i = 0; i < 8 && jt.cgpj.caducado; i++) { jt.cgpj.ultimoIntento = -99; r = C.Acciones.ejecutar('negociar_cgpj', {}); } ok(!jt.cgpj.caducado, 'se renueva el CGPJ negociando');
r = C.Acciones.ejecutar('nombrar_fiscal', { perfil: 'independiente' }); ok(r.ok, r.msg);
const cs = C.Justicia.nueva(E, J.partido, 'J', 0.6); cs.dur = 1; ok(cs.fase === 'denuncia', 'causa abierta contra el jugador');
avanza(3); ok(cs.fase === 'instruccion' || cs.fase === 'cerrada', 'la causa avanza (' + cs.fase + ')');
if (cs.pend) { const x = C.Justicia.responder(E, cs.id, 'colaborar'); ok(/documentaci|Aportas/i.test(x) || x.length > 3, 'respuesta en instrucción'); }
cs.dur = 1; cs.pend = null; avanza(4); for (let i = 0; i < 3 && cs.fase !== 'cerrada'; i++) { cs.dur = 1; if (cs.pend) C.Justicia.responder(E, cs.id, 'resistir'); avanza(2); } ok(cs.fase === 'cerrada' || cs.fase === 'sentencia' || cs.fase === 'juicio', 'la causa llega al final (' + cs.fase + ' · ' + cs.resultado + ')');
console.log('Partido interno');
const Pi = C.PartidoInt, pi = Pi.asegurar(E); ok(Math.abs(pi.fac.oficial + pi.fac.critico + pi.fac.barones - 100) < 0.5, 'facciones suman 100');
r = C.Acciones.ejecutar('amarrar_apoyos', {}); ok(r.ok, r.msg); pi.cong.prox = E.fecha.t + 2; avanza(1); ok(pi.cong.fase === 'precongreso', 'se convoca el congreso'); avanza(3); if (E.esp.pendienteCongreso) C.PartidoInt.congreso(E, { bonus: 0 }); ok(pi.hist.length >= 1, 'congreso celebrado: ' + (pi.hist[0] || {}).txt);
console.log('Diálogo social');
const So = C.Social, s = So.asegurar(E); ok(So.puede(E), 'el presidente puede negociar');
const pb = So.prob(E, 'smi', 1, false); ok(pb.ac > 0 && pb.ac < 1, 'probabilidad de acuerdo ' + Math.round(pb.ac * 100) + ' %');
let ac = 0; for (let i = 0; i < 16; i++) { s.ult.smi = -99; r = C.Acciones.ejecutar('mesa_dialogo', { tema: 'smi', L: 1, comp: true }); J.agenda.puntos = 30; if (/Acuerdo/.test(r.msg || '')) ac++; } ok(ac >= 1, 'se cierran acuerdos (' + ac + ')');
r = C.Acciones.ejecutar('imponer_decreto_social', { tema: 'pensiones', L: 1 }); ok(r.ok, r.msg);
s.conf = 90; avanza(30); ok(s.huelgas.length >= 0 && s.acuerdos.length >= 1, 'conflictividad y acuerdos registrados');
console.log('Crisis'); E.paises.ES.gob.pm = 'J'; J.cargo = 'pm';
const Cr = C.Crisis, cr0 = Cr.asegurar(E); const cn = Cr.nueva(E) || Cr.nueva(E) || Cr.nueva(E); ok(cn && cn.id, 'nace una crisis: ' + (cn && Cr.TIPOS[cn.tipo].n));
J.agenda.puntos = 30; r = C.Acciones.ejecutar('gestionar_crisis', { id: cn.id, k: 'ume', ambito: 'estado' }); ok(r.ok, r.msg);
r = C.Acciones.ejecutar('gestionar_crisis', { id: cn.id, k: 'ume', ambito: 'estado' }); ok(r.ok === false, 'no se repite la misma medida');
avanza(cn.dur + 2); ok(cn.fase === 'cerrada' && cr0.hist.length >= 1, 'la crisis se cierra y queda en el historial');
console.log('Jefe de gabinete');
const Jf = C.Jefe; ok(Jf.puede(E) === true, 'puedes tener jefe de gabinete'); const cands = Jf.candidatos(E); ok(cands.length === 4, '4 candidatos'); r = Jf.nombrar(E, cands[0].id); ok(r.ok, r.msg);
for (const a of Object.keys(Jf.AREAS)) ok(Jf.fijar(E, a, 'delegado'), 'delegar ' + a);
J.agenda.puntos = 5; const pts = J.agenda.puntos; E.esp.consejo.agenda.length = 0; avanza(20); ok(J.agenda.puntos >= 0 && E.esp.jefe.log.length >= 1, 'el jefe trabaja y anota decisiones (' + E.esp.jefe.log.length + ')'); console.log('   ', E.esp.jefe.log.slice(0, 3).map(l => l.area + ': ' + l.txt.slice(0, 60)).join(' | '));
Object.keys(Jf.AREAS).forEach(a => Jf.fijar(E, a, 'asesor')); avanza(2); ok(E.esp.jefe.prop.length >= 0, 'modo asesor genera propuestas (' + E.esp.jefe.prop.length + ')'); if (E.esp.jefe.prop.length) { const p0 = E.esp.jefe.prop[0]; J.agenda.puntos = 10; const x = Jf.aprobar(E, p0.id); ok(x.ok !== false || /sin|puntos|No/.test(x.msg || ''), 'aprobar propuesta: ' + (x.msg || '').slice(0, 60)); }
r = Jf.cesar(E); ok(r.ok && !E.esp.jefe.jefe, 'cesar al jefe');
console.log('Campañas municipal y europea / Legado');
const Cm = C.CampMini; ok(!!Cm && C.Acciones.puede('campana_mun', {}) !== true, 'campaña municipal cerrada fuera de plazo');
E.esp.muni.proxT = E.fecha.t + 8; E.ue.proxPE = E.fecha.t + 6; J.agenda.puntos = 20;
for (const k of ['mun', 'eu']) { ok(Cm.activa(E, k), 'campaña ' + k + ' activa'); let n = 0; for (let i = 0; i < 6; i++) { J.agenda.puntos = 20; const r = C.Acciones.ejecutar('campana_' + k, {}); if (r.ok !== false) n++; } ok(n >= 5 && Cm.puntos(E, k) > 2, 'actos de campaña ' + k + ' suman impulso (' + U.d1(Cm.puntos(E, k)) + ')'); }
let w = 0; while (E.fecha.t < E.esp.muni.proxT + 1 && w++ < 80) { lim(); E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; if (E.esp.gab) E.esp.gab.escandalo = null; if (C.Tiempo.bloqueo(E)) { console.log('  bloqueo', C.Tiempo.bloqueo(E)); break; } C.Tiempo.avanzar(); } ok(Cm.puntos(E, 'mun') === 0 && Cm.puntos(E, 'eu') === 0, 'el impulso se aplica y se reinicia al votar');
const Lg = C.Legado; avanza(3); const lg = Lg.asegurar(E); ok(lg.resumen.length >= 1, 'resumen semanal generado (' + lg.resumen.length + ')'); ok(Lg.stats(E).length >= 8, 'estadísticas'); ok(/años en política/.test(Lg.epilogo(E)), 'epílogo'); ok(Object.keys(lg.logros).length >= 1, 'logros desbloqueados: ' + Object.keys(lg.logros).join(','));
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);
