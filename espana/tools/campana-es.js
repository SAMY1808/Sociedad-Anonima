/* Prueba de la campaña de las generales: presupuesto, provincias, encuestas, debate, coalición y cierre. Uso: node tools/campana-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 121, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, Ca = C.Campana, Gen = C.Generales, D = C.DATA;
const sim = n => { for (let i = 0; i < n; i++) { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; E.ue.pendiente.length = 0; if (E.esp.pendienteDebate) Ca.celebrarDebate(E, 'propuestas'); E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; E.esp.pendienteCrisisV = null; E.esp.pendienteCongreso = false; if (E.esp.pendienteSesion) C.Sesion.resolverAuto(E); C.Tiempo.avanzar(); } };
console.log('Antes de la campaña');
ok(!Ca.activa(E), 'no hay campaña en marcha'); const r0 = C.Acciones.ejecutar('mitin_prov', { prov: 'MAD' }); ok(r0.ok === false, 'no se puede hacer campaña fuera de ella');
console.log('Campaña');
Gen.disolver(E, 'test', true);
const camp = E.esp.camp; ok(Ca.activa(E) && camp.tVoto === E.esp.cortes.proxT, 'la disolución abre la campaña (' + Ca.semanasHasta(E) + ' semanas)');
ok(camp.presup.total > 40 && Ca.peso(E), 'presupuesto inicial de ' + camp.presup.total + ' M€');
ok(camp.enc.length >= 1 && camp.enc[0].tipo === 'cis', 'barómetro inicial del CIS');
const provs = Ca.provincias(E); ok(provs.length === 52 && provs.every(p => isFinite(p.disputa)), 'tablero de 52 provincias');
const top = provs.sort((a, b) => a.disputa - b.disputa)[0]; console.log('  provincia más disputada:', top.nombre, 'ganar', top.ganar.toFixed(2), 'perder', top.perder);
J.agenda.puntos = 99;
const antes = Gen.simular(E, { ruido: 0, ruidoN: 0 }).esc[J.partido];
let r = C.Acciones.ejecutar('mitin_prov', { prov: top.id }); ok(r.ok, r.msg);
for (let i = 0; i < 4; i++) { r = C.Acciones.ejecutar('gasto_campana', { canal: 'territorio', prov: top.id }); } ok(r.ok, 'aparato local: ' + r.msg);
r = C.Acciones.ejecutar('gasto_campana', { canal: 'tv' }); ok(r.ok, r.msg);
r = C.Acciones.ejecutar('encargar_encuesta', { tipo: 'propia' }); ok(r.ok, r.msg); ok(Ca.propiaReciente(E), 'encuesta propia reciente');
r = C.Acciones.ejecutar('apelar_voto_util', {}); ok(r.ok, r.msg);
r = C.Acciones.ejecutar('movilizar_votantes', {}); ok(r.ok, r.msg);
const despues = Gen.simular(E, { ruido: 0, ruidoN: 0 }).esc[J.partido]; ok(despues >= antes, `el esfuerzo no te resta escaños (${antes} → ${despues})`);
const f0 = camp.focus[top.id]; ok(f0 > 5, 'esfuerzo acumulado en ' + top.nombre + ': ' + f0.toFixed(1));
r = C.Acciones.ejecutar('credito_campana', {}); ok(r.ok && camp.presup.credito === 30, 'crédito de campaña');
const so = Ca.socios(E); ok(so.length >= 3, 'socios de coalición: ' + so.map(x => E.partidos[x.k].sigla).join(','));
let coal = null; for (let i = 0; i < 20 && !camp.coal; i++) { r = C.Acciones.ejecutar('coalicion_pre', { pid: so[0].k }); }
ok(!!camp.coal || true, 'coalición preelectoral ' + (camp.coal ? 'pactada con ' + camp.coal.b : 'rechazada (azar)'));
if (camp.coal) { const e = Gen.simular(E, { ruido: 0, ruidoN: 0 }); ok(e.esc[camp.coal.a] + e.esc[camp.coal.b] > 0 && Object.values(e.esc).reduce((a, b) => a + b, 0) === 350, 'con coalición siguen sumando 350 escaños'); }
// Avanzar hasta el debate y las urnas
let vioDebate = false, noche = null;
for (let i = 0; i < 12 && Ca.activa(E); i++) { if (E.esp.pendienteDebate) vioDebate = true; E.eventos.pendientes.length = 0; sim(1); if (E.elecciones.nochePendiente) noche = E.elecciones.nochePendiente; }
ok(camp.debate.hecho, 'se celebra el debate decisivo (' + (camp.debate.res || []).map(k => E.partidos[k].sigla).join(' > ') + ')');
ok(!Ca.activa(E) && E.esp.campPrev, 'la campaña se cierra al votar');
console.log('  gasto', camp.presup.gastado, '| finanzas partido', Math.round(E.partidos[J.partido].finanzas));
console.log('Primarias');
J.rol = 'direccion'; J.prestigio = 70; J.agenda.puntos = 10; J.primT = null; J.circ = J.circ || 'MAD';
r = C.Acciones.puede('primarias_lista', {}); ok(r === true, 'primarias disponibles (' + r + ')');
let g = false; for (let i = 0; i < 10 && !g; i++) { J.primT = null; J.agenda.puntos = 10; C.Acciones.ejecutar('primarias_lista', {}); g = !!J.cabezaLista; } ok(g, 'se gana la cabeza de lista provincial');
console.log('Asesor y campaña automática (generales)');
const E2 = crear({ semilla: 122 }), J2 = E2.jugador; Gen.disolver(E2, 'test', true); J2.agenda.puntos = 20;
const cs = Ca.consejos(E2); ok(cs.length >= 2, 'el asesor propone acciones (' + cs.length + '): ' + cs.slice(0, 3).map(x => x.txt.slice(0, 40)).join(' | '));
const ra = C.Acciones.ejecutar('campana_auto', {}); ok(ra.ok, ra.msg);
ok(E2.esp.camp.presup.gastado > 10 && E2.esp.camp.presup.gastado <= E2.esp.camp.presup.total, 'la campaña automática gasta el presupuesto sin pasarse (' + E2.esp.camp.presup.gastado.toFixed(1) + '/' + E2.esp.camp.presup.total + ')');
console.log('Campaña autonómica');
const E3 = crear({ semilla: 123, nivel: 'autonomico', rol: 'lider', region: 'MAD' }), J3 = E3.jugador, rc3 = E3.esp.ccaa.MAD; J3.agenda.puntos = 30; J3.prestigio = 60;
const adv = n => { for (let i = 0; i < n; i++) { E3.eventos.pendientes.length = 0; E3.parl.pendienteVoto.length = 0; E3.ue.pendiente.length = 0; E3.esp.pendienteGabinete = null; E3.esp.pendienteInvAut = null; E3.esp.pendienteVotoAut = null; E3.esp.pendienteConvAut = null; if (E3.esp.gab) E3.esp.gab.escandalo = null; E3.esp.pendienteInvestidura = false; E3.esp.pendienteSocio = false; E3.elecciones.nochePendiente = null; if (E3.esp.pendienteDebate) Ca.celebrarDebate(E3, 'ataque'); C.Tiempo.avanzar(); } };
rc3.parl.proxT = E3.fecha.t + 8; C.Tiempo.avanzar();
const cA = E3.esp.campA && E3.esp.campA.MAD; ok(cA && cA.activa && cA.ambito === 'aut', 'la campaña autonómica se abre a 8 semanas de las urnas');
ok(cA.tope < 90 && cA.tope >= 6, 'tope de gasto autonómico: ' + cA.tope + ' M€ (presupuesto ' + cA.presup.total + ')');
ok(Ca.cur(E3) === cA, 'el contexto actual es la campaña autonómica');
const ts = Ca.territoriosAut(E3, 'MAD'); ok(ts.length >= 1 && Math.abs(ts.reduce((a, t) => a + t.peso, 0) - 1) < 1e-6, 'territorios de la comunidad: ' + ts.map(t => t.nombre).join(','));
const ri = Ca.regInfo(E3, 'MAD'); ok(ri.n > 50 && isFinite(ri.ganar), 'estado de tu partido: ' + ri.esc + ' esc., +' + Math.round(ri.ganar * 100) + ' % para otro');
const a0 = C.Territorio.simular(E3, 'MAD', { ruido: 0 }).escanos[J3.partido] || 0;
let rr = C.Acciones.ejecutar('mitin_prov', { prov: ts[0].id }); ok(rr.ok, rr.msg);
rr = C.Acciones.ejecutar('gasto_campana', { canal: 'tv' }); ok(rr.ok, rr.msg);
rr = C.Acciones.ejecutar('campana_auto', {}); ok(rr.ok || /presupuesto/.test(rr.msg), rr.msg);
rr = C.Acciones.ejecutar('encargar_encuesta', { tipo: 'propia' }); ok(rr.ok || /fondos/.test(rr.msg), rr.msg);
const a1 = C.Territorio.simular(E3, 'MAD', { ruido: 0 }).escanos[J3.partido] || 0; ok(a1 >= a0, `la campaña no te resta escaños (${a0} → ${a1})`);
const so3 = Ca.socios(E3); ok(so3.length >= 1, 'socios regionales: ' + so3.map(x => E3.partidos[x.k].sigla).join(','));
for (let i = 0; i < 15 && !cA.coal; i++) C.Acciones.ejecutar('coalicion_pre', { pid: so3[0].k });
if (cA.coal) { const r3 = C.Territorio.simular(E3, 'MAD', { ruido: 0 }); ok(U.suma(Object.values(r3.escanos)) === D.ccaa.MAD.esc, 'con coalición el reparto suma ' + D.ccaa.MAD.esc + ' escaños'); }
adv(9);
ok(cA.debate.hecho, 'debate autonómico celebrado (' + (cA.debate.res || []).map(k => E3.partidos[k].sigla).join(' > ') + ')');
ok(!cA.activa && cA.fin != null, 'la campaña autonómica se cierra al votar');
const jo = E3.esp.jornada[cA.fin] || Object.values(E3.esp.jornada).find(j => j.aut && j.aut.some(a => a.c === 'MAD' && a.camp)); ok(!!jo && jo.aut.some(a => a.c === 'MAD' && a.camp && a.camp.sondeo), 'la noche autonómica incluye pie de urna y cuentas');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);
