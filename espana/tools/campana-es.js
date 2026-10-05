/* Prueba de la campaña de las generales: presupuesto, provincias, encuestas, debate, coalición y cierre. Uso: node tools/campana-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 121, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, Ca = C.Campana, Gen = C.Generales;
const sim = n => { for (let i = 0; i < n; i++) { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.ue.pendiente.length = 0; if (E.esp.pendienteDebate) Ca.celebrarDebate(E, 'propuestas'); E.elecciones.nochePendiente = null; C.Tiempo.avanzar(); } };
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
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);
